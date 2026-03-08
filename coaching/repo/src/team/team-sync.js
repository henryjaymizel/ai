/**
 * Team sync from Glean and Notion — PRD 01 (REQ-TEAM-001, REQ-TEAM-006)
 */

const { createTeamMember } = require('./models');

const GLEAN_API_BASE = process.env.GLEAN_API_BASE || 'https://api.glean.com';
const NOTION_API_BASE = process.env.NOTION_API_BASE || 'https://api.notion.com/v1';
const MAX_ANGELL_ROOT = process.env.SALES_VP_EMAIL || 'max.angell@company.com';

async function fetchGleanOrgTree(apiKey) {
  // Fetch the full reporting tree under Max Angell from Glean
  const response = await fetch(`${GLEAN_API_BASE}/api/v1/people/orgchart`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email: MAX_ANGELL_ROOT, depth: 10 }),
  });
  if (!response.ok) throw new Error(`Glean API error: ${response.status}`);
  return response.json();
}

async function fetchNotionTeamRoster(apiKey, databaseId) {
  // Fetch team roster from Notion for role metadata and team labels
  const response = await fetch(`${NOTION_API_BASE}/databases/${databaseId}/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ page_size: 100 }),
  });
  if (!response.ok) throw new Error(`Notion API error: ${response.status}`);
  return response.json();
}

function mapGleanRole(title) {
  const t = (title || '').toLowerCase();
  if (t.includes('vice president') || t.includes('vp of sales')) return 'vp';
  if (t.includes('director')) return 'director';
  if ((t.includes('manager') && !t.includes('office manager')) || t.includes('team lead')) return 'manager';
  if (t.includes('account executive') || t.includes(' ae')) return 'ae';
  if (t.includes('sales development') || t.includes('sdr') || t.includes('bdr')) return 'sdr';
  if (t.includes('sales engineer') || t.includes('solutions')) return 'se';
  return 'other';
}

function mergeGleanAndNotion(gleanTree, notionRoster) {
  // Glean is primary for reporting lines; Notion is primary for role metadata
  const notionByEmail = new Map();
  for (const entry of notionRoster) {
    const email = entry.properties?.Email?.email;
    if (email) notionByEmail.set(email.toLowerCase(), entry);
  }

  const members = [];

  function traverse(person, parentId) {
    const email = person.email?.toLowerCase();
    const notionEntry = email ? notionByEmail.get(email) : null;

    const roleOverride = notionEntry?.properties?.Role?.select?.name?.toLowerCase();
    const teamLabel = notionEntry?.properties?.Team?.select?.name || null;

    const member = createTeamMember({
      id: person.id || crypto.randomUUID(),
      name: person.name,
      email: person.email,
      role: roleOverride || mapGleanRole(person.title),
      title: person.title,
      reports_to: parentId,
      team_label: teamLabel,
      glean_id: person.id,
      notion_id: notionEntry?.id || null,
    });

    members.push(member);

    if (person.reports) {
      for (const report of person.reports) {
        traverse(report, member.id);
      }
    }
  }

  traverse(gleanTree, null);
  return members;
}

async function syncTeam(db, gleanApiKey, notionApiKey, notionDbId) {
  const gleanTree = await fetchGleanOrgTree(gleanApiKey);
  const notionData = await fetchNotionTeamRoster(notionApiKey, notionDbId);
  const notionRoster = notionData.results || [];

  const members = mergeGleanAndNotion(gleanTree, notionRoster);

  // Upsert into database
  for (const member of members) {
    await db.upsertTeamMember(member);
  }

  return { synced: members.length, timestamp: new Date().toISOString() };
}

module.exports = { fetchGleanOrgTree, fetchNotionTeamRoster, mapGleanRole, mergeGleanAndNotion, syncTeam };
