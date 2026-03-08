/**
 * Team data models and validation — PRD 01
 */

const VALID_ROLES = ['vp', 'director', 'manager', 'ae', 'sdr', 'se', 'enablement', 'revops', 'other'];
const VALID_SEGMENTS = ['smb', 'mid_market', 'enterprise'];

function createTeamMember({ id, name, email, role, title, reports_to, team_label, glean_id, notion_id, segment, segment_source, sfdc_user_id }) {
  if (!VALID_ROLES.includes(role)) {
    throw new Error(`Invalid role: ${role}. Must be one of: ${VALID_ROLES.join(', ')}`);
  }
  if (segment && !VALID_SEGMENTS.includes(segment)) {
    throw new Error(`Invalid segment: ${segment}. Must be one of: ${VALID_SEGMENTS.join(', ')}`);
  }
  if (!id || !name || !email) {
    throw new Error('TeamMember requires id, name, and email');
  }
  return {
    id,
    name,
    email,
    role,
    segment: segment || null,
    segment_source: segment_source || null,
    title: title || '',
    reports_to: reports_to || null,
    team_label: team_label || null,
    glean_id: glean_id || null,
    notion_id: notion_id || null,
    sfdc_user_id: sfdc_user_id || null,
    last_synced_at: new Date().toISOString(),
  };
}

function validateOrgTree(members) {
  const byId = new Map(members.map(m => [m.id, m]));
  const roots = members.filter(m => m.reports_to === null);
  const errors = [];

  if (roots.length === 0) {
    errors.push('No root node found (VP with reports_to=null)');
  }
  if (roots.length > 1) {
    errors.push(`Multiple roots found: ${roots.map(r => r.name).join(', ')}`);
  }

  // Check for broken reports_to references
  for (const m of members) {
    if (m.reports_to && !byId.has(m.reports_to)) {
      errors.push(`${m.name} reports to unknown ID: ${m.reports_to}`);
    }
  }

  // Check for cycles
  for (const m of members) {
    const visited = new Set();
    let current = m;
    while (current && current.reports_to) {
      if (visited.has(current.id)) {
        errors.push(`Cycle detected involving: ${current.name}`);
        break;
      }
      visited.add(current.id);
      current = byId.get(current.reports_to);
    }
  }

  return { valid: errors.length === 0, errors };
}

function getSubtree(members, rootId) {
  const byManager = new Map();
  for (const m of members) {
    if (m.reports_to) {
      if (!byManager.has(m.reports_to)) byManager.set(m.reports_to, []);
      byManager.get(m.reports_to).push(m);
    }
  }

  const result = [];
  const queue = [rootId];
  while (queue.length > 0) {
    const id = queue.shift();
    const reports = byManager.get(id) || [];
    for (const r of reports) {
      result.push(r);
      queue.push(r.id);
    }
  }
  return result;
}

function filterMembers(members, filters = {}) {
  let result = [...members];

  if (filters.role) {
    result = result.filter(m => m.role === filters.role);
  }
  if (filters.manager_id) {
    result = result.filter(m => m.reports_to === filters.manager_id);
  }
  if (filters.subtree_of) {
    const subtreeIds = new Set(getSubtree(members, filters.subtree_of).map(m => m.id));
    result = result.filter(m => subtreeIds.has(m.id));
  }
  if (filters.name) {
    const lower = filters.name.toLowerCase();
    result = result.filter(m => m.name.toLowerCase().includes(lower));
  }

  return result;
}

module.exports = { VALID_ROLES, VALID_SEGMENTS, createTeamMember, validateOrgTree, getSubtree, filterMembers };
