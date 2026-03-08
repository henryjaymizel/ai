import { NextResponse } from 'next/server';
import { getTeam } from '../../../../lib/mock-data.js';

/**
 * Daily team hierarchy sync endpoint.
 * Called by Vercel Cron (see vercel.json) once per day at 6 AM UTC.
 *
 * GET  /api/sync/team  — check current team vs Gong and detect changes
 * POST /api/sync/team  — trigger a manual sync
 *
 * Uses Gong API /v2/users to fetch all users with managerId hierarchy,
 * then walks the tree from Max Angell (VP Sales) down to build the org.
 *
 * Env vars required:
 *   GONG_ACCESS_KEY — Gong API access key
 *   GONG_SECRET     — Gong API secret
 */

const GONG_ACCESS_KEY = process.env.GONG_ACCESS_KEY || '';
const GONG_SECRET = process.env.GONG_SECRET || '';

// Max Angell's Gong user ID — root of the sales org we track
const VP_SALES_GONG_ID = '508439118847453151';

function getGongAuth() {
  const token = Buffer.from(`${GONG_ACCESS_KEY}:${GONG_SECRET}`).toString('base64');
  return `Basic ${token}`;
}

async function fetchAllGongUsers() {
  if (!GONG_ACCESS_KEY || !GONG_SECRET) return null;

  const allUsers = [];
  let cursor = null;

  while (true) {
    let url = 'https://api.gong.io/v2/users';
    if (cursor) url += `?cursor=${cursor}`;

    const res = await fetch(url, {
      headers: { Authorization: getGongAuth() },
    });

    if (!res.ok) return null;
    const data = await res.json();
    const users = data.users || [];
    allUsers.push(...users);

    const records = data.records || {};
    if ((records.currentPageSize || 0) < 100) break;
    cursor = records.cursor;
    if (!cursor) break;
  }

  return allUsers;
}

function slugify(name) {
  return name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function classifyRole(title) {
  const t = (title || '').toLowerCase();
  if (t.includes('chief executive') || t === 'ceo') return 'ceo';
  if (t.includes('chief revenue') || t === 'cro') return 'cro';
  if (t.includes('chief operating') || t === 'coo') return 'coo';
  if (t.includes('vice president') || t.includes('vp')) return 'vp';
  if (t.includes('customer advocate')) return 'ca';
  if (t.includes('account manager') || t.includes('account management')) return 'am';
  if (t.includes('solutions consultant') || t.includes('solutions engineer')) return 'sc';
  if (t.includes('director')) return 'director';
  if (t.includes('senior manager') || t.includes('manager ii') || t.includes('manager,') || t.includes('sales manager') || t === 'manager') return 'manager';
  if (t.includes('sdr') || t.includes('sales development rep') || t.includes('business development rep') || t.includes('bdr')) return 'sdr';
  if (t.includes('account executive') || t.includes('ae')) return 'ae';
  return 'ae'; // default
}

function classifySegment(title) {
  const t = (title || '').toLowerCase();
  if (t.includes('mid-market') || t.includes('mid market') || t.includes('mm')) return 'mid_market';
  if (t.includes('enterprise') || t.includes('ent')) return 'enterprise';
  if (t.includes('smb') || t.includes('small business')) return 'smb';
  return null;
}

function buildOrgTree(allUsers) {
  const byGongId = {};
  for (const u of allUsers) {
    byGongId[u.id] = u;
  }

  // Walk down from VP Sales
  const visited = new Set();
  const team = [];

  function walk(gongId, parentSlug) {
    if (visited.has(gongId)) return;
    visited.add(gongId);

    const user = byGongId[gongId];
    if (!user || !user.active) return;

    const name = `${user.firstName} ${user.lastName}`;
    const slug = slugify(name);
    const role = classifyRole(user.title);
    const segment = classifySegment(user.title);

    const entry = {
      id: slug,
      name,
      role,
      reports_to: parentSlug,
      segment,
      gong_id: String(user.id),
    };

    if (['ceo', 'cro', 'vp', 'director', 'manager'].includes(role)) {
      entry.team_label = user.title || null;
    }

    team.push(entry);

    // Find direct reports
    const reports = allUsers.filter(u => String(u.managerId) === String(gongId) && u.active);
    for (const report of reports) {
      walk(report.id, slug);
    }
  }

  // Include leadership chain above Max
  const maxUser = byGongId[VP_SALES_GONG_ID];
  if (maxUser) {
    // Walk up to find CRO and CEO
    const chain = [];
    let current = maxUser;
    while (current && current.managerId) {
      const mgr = byGongId[current.managerId];
      if (mgr) {
        chain.push(mgr);
        current = mgr;
      } else break;
    }

    // Add from top down
    chain.reverse();
    let prevSlug = null;
    for (const leader of chain) {
      const name = `${leader.firstName} ${leader.lastName}`;
      const slug = slugify(name);
      const role = classifyRole(leader.title);
      team.push({
        id: slug,
        name,
        role,
        reports_to: prevSlug,
        segment: null,
        gong_id: String(leader.id),
        team_label: role === 'ceo' ? 'Apollo' : role === 'cro' ? 'Revenue' : leader.title,
      });
      visited.add(leader.id);
      prevSlug = slug;
    }

    // Now walk from Max down
    walk(VP_SALES_GONG_ID, prevSlug);
  }

  return team;
}

function detectChanges(currentTeam, gongTeam) {
  if (!gongTeam) {
    return {
      added: [], removed: [], changed: [],
      status: 'no_api_keys',
      message: 'Set GONG_ACCESS_KEY and GONG_SECRET env vars to enable live sync',
    };
  }

  const changes = { added: [], removed: [], changed: [] };
  const currentById = {};
  for (const m of currentTeam) currentById[m.id] = m;
  const gongById = {};
  for (const m of gongTeam) gongById[m.id] = m;

  // New people in Gong not in current team
  for (const m of gongTeam) {
    if (!currentById[m.id]) {
      changes.added.push({ id: m.id, name: m.name, role: m.role, source: 'gong' });
    }
  }

  // People in current team not in Gong
  for (const m of currentTeam) {
    if (!gongById[m.id] && ['ae', 'sdr', 'am', 'ca', 'manager'].includes(m.role)) {
      changes.removed.push({ id: m.id, name: m.name, role: m.role, source: 'gong_missing' });
    }
  }

  // Reporting line changes
  for (const m of gongTeam) {
    const current = currentById[m.id];
    if (current && current.reports_to !== m.reports_to) {
      changes.changed.push({
        id: m.id, name: m.name,
        old_reports_to: current.reports_to,
        new_reports_to: m.reports_to,
      });
    }
  }

  return {
    ...changes,
    status: 'checked',
    checked_at: new Date().toISOString(),
    has_changes: changes.added.length > 0 || changes.removed.length > 0 || changes.changed.length > 0,
  };
}

export async function GET() {
  const currentTeam = getTeam();
  const gongUsers = await fetchAllGongUsers();
  const gongTeam = gongUsers ? buildOrgTree(gongUsers) : null;
  const diff = detectChanges(currentTeam, gongTeam);

  return NextResponse.json({
    team_size: currentTeam.length,
    reps: currentTeam.filter(m => ['ae', 'sdr', 'am', 'ca'].includes(m.role)).length,
    managers: currentTeam.filter(m => m.role === 'manager').length,
    directors: currentTeam.filter(m => m.role === 'director').length,
    sync: diff,
    gong_team_size: gongTeam ? gongTeam.length : null,
    last_synced: new Date().toISOString().split('T')[0],
  });
}

export async function POST() {
  const currentTeam = getTeam();
  const gongUsers = await fetchAllGongUsers();
  const gongTeam = gongUsers ? buildOrgTree(gongUsers) : null;
  const diff = detectChanges(currentTeam, gongTeam);

  return NextResponse.json({
    status: 'sync_complete',
    timestamp: new Date().toISOString(),
    diff,
    gong_team: gongTeam,
  });
}
