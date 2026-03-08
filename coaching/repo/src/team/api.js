/**
 * Team API routes — PRD 01 (REQ-TEAM-007)
 */

const { filterMembers, getSubtree, validateOrgTree } = require('./models');

function buildTreeFromFlat(members) {
  const byId = new Map(members.map(m => [m.id, { ...m, children: [] }]));
  const roots = [];
  for (const node of byId.values()) {
    if (node.reports_to && byId.has(node.reports_to)) {
      byId.get(node.reports_to).children.push(node);
    } else if (!node.reports_to) {
      roots.push(node);
    }
  }
  return roots;
}

function createTeamRoutes(db) {
  return {
    // GET /api/team/tree
    async getTree(req, res) {
      const members = await db.getAllTeamMembers();
      const tree = buildTreeFromFlat(members);
      res.json({ tree, member_count: members.length });
    },

    // GET /api/team/members?role=ae&manager_id=...&subtree_of=...&name=...
    async getMembers(req, res) {
      const members = await db.getAllTeamMembers();
      const filtered = filterMembers(members, {
        role: req.query.role,
        manager_id: req.query.manager_id,
        subtree_of: req.query.subtree_of,
        name: req.query.name,
      });
      res.json({ members: filtered, count: filtered.length });
    },

    // GET /api/team/member/:id
    async getMember(req, res) {
      const member = await db.getTeamMember(req.params.id);
      if (!member) return res.status(404).json({ error: 'Member not found' });

      const allMembers = await db.getAllTeamMembers();
      const directReports = allMembers.filter(m => m.reports_to === member.id);

      res.json({ member, direct_reports: directReports });
    },

    // POST /api/team/sync
    async triggerSync(req, res) {
      const { syncTeam } = require('./team-sync');
      try {
        const result = await syncTeam(
          db,
          process.env.GLEAN_API_KEY,
          process.env.NOTION_API_KEY,
          process.env.NOTION_TEAM_DB_ID
        );
        res.json({ status: 'ok', ...result });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    },
  };
}

module.exports = { createTeamRoutes, buildTreeFromFlat };
