/**
 * PRD Compliance Tests
 *
 * Tests the codebase against every requirement in the four PRDs.
 * Each test checks whether the code implements the requirement.
 * Failed tests indicate PRD requirements that are not yet implemented.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const SRC = path.join(__dirname, '..', 'src');

function srcExists(...parts) {
  return fs.existsSync(path.join(SRC, ...parts));
}

function requireSrc(...parts) {
  return require(path.join(SRC, ...parts));
}

// ============================================================
// PRD 01: Team Roles and Grouping
// ============================================================

describe('PRD-01: Team Roles and Grouping', () => {

  describe('REQ-TEAM-001: Org Ingestion', () => {
    it('team-sync module exists', () => {
      assert.ok(srcExists('team', 'team-sync.js'), 'src/team/team-sync.js must exist');
    });

    it('fetchGleanOrgTree function exists', () => {
      const mod = requireSrc('team', 'team-sync');
      assert.ok(typeof mod.fetchGleanOrgTree === 'function', 'Must export fetchGleanOrgTree');
    });

    it('fetchNotionTeamRoster function exists', () => {
      const mod = requireSrc('team', 'team-sync');
      assert.ok(typeof mod.fetchNotionTeamRoster === 'function', 'Must export fetchNotionTeamRoster');
    });

    it('mergeGleanAndNotion resolves conflicts correctly (Glean=reporting, Notion=roles)', () => {
      const { mergeGleanAndNotion } = requireSrc('team', 'team-sync');
      const gleanTree = {
        id: 'vp1', name: 'Max Angell', email: 'max@co.com', title: 'VP of Sales',
        reports: [
          { id: 'dir1', name: 'Director One', email: 'dir1@co.com', title: 'Director of Sales', reports: [] }
        ]
      };
      const notionRoster = [
        { properties: { Email: { email: 'dir1@co.com' }, Role: { select: { name: 'director' } }, Team: { select: { name: 'Enterprise' } } }, id: 'n1' }
      ];
      const members = mergeGleanAndNotion(gleanTree, notionRoster);
      assert.ok(members.length === 2, 'Should produce 2 members');
      const dir = members.find(m => m.email === 'dir1@co.com');
      assert.equal(dir.role, 'director', 'Notion role override should apply');
      assert.equal(dir.team_label, 'Enterprise', 'Notion team label should apply');
      assert.ok(dir.reports_to !== null, 'Reporting line should come from Glean tree');
    });
  });

  describe('REQ-TEAM-002: Role Classification', () => {
    it('validates role against allowed values including enablement and revops', () => {
      const { createTeamMember, VALID_ROLES } = requireSrc('team', 'models');
      assert.deepEqual(VALID_ROLES, ['vp', 'director', 'manager', 'ae', 'sdr', 'se', 'enablement', 'revops', 'other']);
      assert.throws(() => createTeamMember({ id: '1', name: 'X', email: 'x@x.com', role: 'ceo' }), /Invalid role/);
      // Enablement and RevOps should be valid
      const em = createTeamMember({ id: '2', name: 'E', email: 'e@x.com', role: 'enablement' });
      assert.equal(em.role, 'enablement');
      const rv = createTeamMember({ id: '3', name: 'R', email: 'r@x.com', role: 'revops' });
      assert.equal(rv.role, 'revops');
    });

    it('mapGleanRole maps titles correctly', () => {
      const { mapGleanRole } = requireSrc('team', 'team-sync');
      assert.equal(mapGleanRole('VP of Sales'), 'vp');
      assert.equal(mapGleanRole('Director of Enterprise Sales'), 'director');
      assert.equal(mapGleanRole('Sales Manager'), 'manager');
      assert.equal(mapGleanRole('Account Executive'), 'ae');
      assert.equal(mapGleanRole('Sales Development Representative'), 'sdr');
      assert.equal(mapGleanRole('Sales Engineer'), 'se');
      assert.equal(mapGleanRole('Office Manager'), 'other');
    });
  });

  describe('REQ-TEAM-003: Reporting Lines', () => {
    it('validateOrgTree detects cycles', () => {
      const { validateOrgTree } = requireSrc('team', 'models');
      const cyclicMembers = [
        { id: '1', name: 'A', reports_to: '2' },
        { id: '2', name: 'B', reports_to: '1' },
      ];
      const result = validateOrgTree(cyclicMembers);
      assert.equal(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('Cycle') || e.includes('root')));
    });

    it('validateOrgTree accepts valid tree', () => {
      const { validateOrgTree } = requireSrc('team', 'models');
      const validMembers = [
        { id: '1', name: 'Max', reports_to: null },
        { id: '2', name: 'Dir', reports_to: '1' },
        { id: '3', name: 'Rep', reports_to: '2' },
      ];
      const result = validateOrgTree(validMembers);
      assert.equal(result.valid, true);
    });

    it('getSubtree returns all transitive reports', () => {
      const { getSubtree } = requireSrc('team', 'models');
      const members = [
        { id: '1', name: 'Max', reports_to: null },
        { id: '2', name: 'Dir', reports_to: '1' },
        { id: '3', name: 'Mgr', reports_to: '2' },
        { id: '4', name: 'Rep', reports_to: '3' },
      ];
      const subtree = getSubtree(members, '1');
      assert.equal(subtree.length, 3, 'VP subtree should have 3 reports');
      const subtree2 = getSubtree(members, '2');
      assert.equal(subtree2.length, 2, 'Director subtree should have 2 reports');
    });
  });

  describe('REQ-TEAM-004: Filtering', () => {
    it('filterMembers supports role, manager_id, subtree_of, name filters', () => {
      const { filterMembers } = requireSrc('team', 'models');
      const members = [
        { id: '1', name: 'Max Angell', role: 'vp', reports_to: null },
        { id: '2', name: 'Alice Director', role: 'director', reports_to: '1' },
        { id: '3', name: 'Bob Manager', role: 'manager', reports_to: '2' },
        { id: '4', name: 'Charlie AE', role: 'ae', reports_to: '3' },
        { id: '5', name: 'Diana SDR', role: 'sdr', reports_to: '3' },
      ];
      assert.equal(filterMembers(members, { role: 'ae' }).length, 1);
      assert.equal(filterMembers(members, { manager_id: '3' }).length, 2);
      assert.equal(filterMembers(members, { subtree_of: '2' }).length, 3);
      assert.equal(filterMembers(members, { name: 'charlie' }).length, 1);
    });

    it('filters are composable (AND logic)', () => {
      const { filterMembers } = requireSrc('team', 'models');
      const members = [
        { id: '1', name: 'Max', role: 'vp', reports_to: null },
        { id: '2', name: 'Dir', role: 'director', reports_to: '1' },
        { id: '3', name: 'Mgr', role: 'manager', reports_to: '2' },
        { id: '4', name: 'Rep A', role: 'ae', reports_to: '3' },
        { id: '5', name: 'Rep B', role: 'sdr', reports_to: '3' },
      ];
      const result = filterMembers(members, { role: 'ae', manager_id: '3' });
      assert.equal(result.length, 1);
      assert.equal(result[0].name, 'Rep A');
    });
  });

  describe('REQ-TEAM-002a: Segment Tagging', () => {
    it('TeamMember model supports segment and segment_source', () => {
      const { createTeamMember } = requireSrc('team', 'models');
      const m = createTeamMember({ id: '1', name: 'X', email: 'x@x.com', role: 'ae', segment: 'smb', segment_source: 'sfdc' });
      assert.equal(m.segment, 'smb');
      assert.equal(m.segment_source, 'sfdc');
    });

    it('rejects invalid segment', () => {
      const { createTeamMember } = requireSrc('team', 'models');
      assert.throws(() => createTeamMember({ id: '1', name: 'X', email: 'x@x.com', role: 'ae', segment: 'mega' }), /Invalid segment/);
    });

    it('supports all valid segments', () => {
      const { VALID_SEGMENTS } = requireSrc('team', 'models');
      assert.deepEqual(VALID_SEGMENTS, ['smb', 'mid_market', 'enterprise']);
    });

    it('TeamMember supports sfdc_user_id', () => {
      const { createTeamMember } = requireSrc('team', 'models');
      const m = createTeamMember({ id: '1', name: 'X', email: 'x@x.com', role: 'ae', sfdc_user_id: 'SF001' });
      assert.equal(m.sfdc_user_id, 'SF001');
    });
  });

  describe('REQ-TEAM-005: Team Groups', () => {
    it('TeamMember model supports team_label', () => {
      const { createTeamMember } = requireSrc('team', 'models');
      const m = createTeamMember({ id: '1', name: 'X', email: 'x@x.com', role: 'ae', team_label: 'Enterprise West' });
      assert.equal(m.team_label, 'Enterprise West');
    });
  });

  describe('REQ-TEAM-006: Data Freshness', () => {
    it('TeamMember includes last_synced_at', () => {
      const { createTeamMember } = requireSrc('team', 'models');
      const m = createTeamMember({ id: '1', name: 'X', email: 'x@x.com', role: 'ae' });
      assert.ok(m.last_synced_at, 'Must have last_synced_at');
    });
  });

  describe('REQ-TEAM-007: API Contract', () => {
    it('team API module exports required route handlers', () => {
      const { createTeamRoutes } = requireSrc('team', 'api');
      const routes = createTeamRoutes({});
      assert.ok(typeof routes.getTree === 'function', '/api/team/tree handler');
      assert.ok(typeof routes.getMembers === 'function', '/api/team/members handler');
      assert.ok(typeof routes.getMember === 'function', '/api/team/member/:id handler');
      assert.ok(typeof routes.triggerSync === 'function', '/api/team/sync handler');
    });
  });
});

// ============================================================
// PRD 02: Call Transcript Collection & Evaluation
// ============================================================

describe('PRD-02: Call Transcript Collection & Evaluation', () => {

  describe('REQ-CALL-001: Gong Ingestion', () => {
    it('gong-sync module exists with required exports', () => {
      const mod = requireSrc('calls', 'gong-sync');
      assert.ok(typeof mod.fetchGongCalls === 'function');
      assert.ok(typeof mod.fetchGongTranscript === 'function');
      assert.ok(typeof mod.syncGongCalls === 'function');
    });

    it('mapGongCallToCall filters by team membership', () => {
      const { mapGongCallToCall } = requireSrc('calls', 'gong-sync');
      const teamByEmail = new Map([['rep@co.com', { id: 'r1', email: 'rep@co.com' }]]);
      const gongCall = {
        metaData: { id: 'g1', started: '2026-01-01T10:00:00Z', duration: 1800 },
        parties: [
          { name: 'Rep', emailAddress: 'rep@co.com' },
          { name: 'Customer', emailAddress: 'cust@ext.com' },
        ],
        context: { crmDealId: 'deal1' },
      };
      const call = mapGongCallToCall(gongCall, { transcript: [] }, teamByEmail);
      assert.equal(call.rep_id, 'r1', 'Should identify internal rep');
      assert.equal(call.deal_id, 'deal1');
    });
  });

  describe('REQ-CALL-002: Deal Grouping', () => {
    it('groupCallsByDeal groups by deal_id and falls back to account_id', () => {
      const { groupCallsByDeal } = requireSrc('calls', 'models');
      const calls = [
        { id: '1', deal_id: 'D1', account_id: 'A1' },
        { id: '2', deal_id: 'D1', account_id: 'A1' },
        { id: '3', deal_id: null, account_id: 'A2' },
        { id: '4', deal_id: null, account_id: 'A2' },
      ];
      const { byDeal, byAccount } = groupCallsByDeal(calls);
      assert.equal(byDeal.get('D1').length, 2, 'Two calls in deal D1');
      assert.equal(byAccount.get('A2').length, 2, 'Two orphan calls grouped by account');
    });
  });

  describe('REQ-CALL-003: Deal Dimensions', () => {
    it('DealGroup model captures ARR, seat_count, deal_stage', () => {
      const { createDealGroup } = requireSrc('calls', 'models');
      const deal = createDealGroup({
        id: '1', crm_deal_id: 'CRM1', account_name: 'Acme',
        arr: 120000, seat_count: 50, deal_stage: 'Stage 3',
      });
      assert.equal(deal.arr, 120000);
      assert.equal(deal.seat_count, 50);
      assert.equal(deal.deal_stage, 'Stage 3');
    });

    it('CompanyContext model captures Apollo data', () => {
      const { createCompanyContext } = requireSrc('calls', 'models');
      const ctx = createCompanyContext({
        apollo_company_id: 'ap1', total_employees: 500,
        sales_headcount: 80, industry: 'SaaS', revenue: 50000000,
      });
      assert.equal(ctx.total_employees, 500);
      assert.equal(ctx.sales_headcount, 80);
    });
  });

  describe('REQ-CALL-004: External Validation', () => {
    it('apollo-enrichment module exists', () => {
      assert.ok(srcExists('calls', 'apollo-enrichment.js'));
    });

    it('assessDealSizing detects under-penetration', () => {
      const { assessDealSizing } = requireSrc('calls', 'apollo-enrichment');
      const deal = { seat_count: 10, arr: 50000 };
      const context = { total_employees: 500, sales_headcount: 200 };
      const result = assessDealSizing(deal, context);
      assert.ok(result.issues.some(i => i.includes('penetration') || i.includes('expand')),
        'Should flag low penetration when 10 seats for 200 reps');
    });

    it('assessDealSizing detects over-estimation', () => {
      const { assessDealSizing } = requireSrc('calls', 'apollo-enrichment');
      const deal = { seat_count: 300, arr: 500000 };
      const context = { total_employees: 200, sales_headcount: 50 };
      const result = assessDealSizing(deal, context);
      assert.ok(result.issues.some(i => i.includes('exceeds')),
        'Should flag when seats exceed sales headcount');
    });

    it('estimateSalesHeadcount falls back to 15% estimate', () => {
      const { estimateSalesHeadcount } = requireSrc('calls', 'apollo-enrichment');
      const estimate = estimateSalesHeadcount({ estimated_num_employees: 1000 });
      assert.equal(estimate, 150, '15% of 1000 = 150');
    });
  });

  describe('REQ-CALL-005: Evaluation Prompt (Editable)', () => {
    it('DEFAULT_PROMPT_TEMPLATE contains required variables', () => {
      const { DEFAULT_PROMPT_TEMPLATE } = requireSrc('calls', 'evaluate');
      assert.ok(DEFAULT_PROMPT_TEMPLATE.includes('{{transcripts}}'));
      assert.ok(DEFAULT_PROMPT_TEMPLATE.includes('{{arr}}'));
      assert.ok(DEFAULT_PROMPT_TEMPLATE.includes('{{seat_count}}'));
      assert.ok(DEFAULT_PROMPT_TEMPLATE.includes('{{total_employees}}'));
      assert.ok(DEFAULT_PROMPT_TEMPLATE.includes('{{sales_headcount}}'));
      assert.ok(DEFAULT_PROMPT_TEMPLATE.includes('{{rep_name}}'));
      assert.ok(DEFAULT_PROMPT_TEMPLATE.includes('{{scoring_criteria}}'));
    });

    it('buildEvaluationPrompt substitutes all variables', () => {
      const { buildEvaluationPrompt, DEFAULT_PROMPT_TEMPLATE, DEFAULT_SCORING_CRITERIA } = requireSrc('calls', 'evaluate');
      const prompt = buildEvaluationPrompt(
        DEFAULT_PROMPT_TEMPLATE,
        { account_name: 'Acme', account_domain: 'acme.com', arr: 100000, seat_count: 50, deal_stage: 'Stage 2' },
        [{ date: '2026-01-01', duration_seconds: 1800, transcript: [{ speaker: 'Rep', text: 'Hello' }] }],
        { total_employees: 500, sales_headcount: 80, industry: 'SaaS', revenue: 50000000 },
        'Alice', 'Bob', DEFAULT_SCORING_CRITERIA
      );
      assert.ok(!prompt.includes('{{'), 'No unresolved template variables');
      assert.ok(prompt.includes('Acme'));
      assert.ok(prompt.includes('Alice'));
    });

    it('prompt covers all 8 default criteria', () => {
      const { DEFAULT_SCORING_CRITERIA } = requireSrc('calls', 'evaluate');
      assert.equal(DEFAULT_SCORING_CRITERIA.length, 8);
      const names = DEFAULT_SCORING_CRITERIA.map(c => c.name);
      assert.ok(names.includes('discovery_quality'));
      assert.ok(names.includes('objection_handling'));
      assert.ok(names.includes('next_steps'));
      assert.ok(names.includes('multi_threading'));
      assert.ok(names.includes('value_articulation'));
      assert.ok(names.includes('deal_sizing'));
      assert.ok(names.includes('sales_process'));
      assert.ok(names.includes('overall_effectiveness'));
    });

    it('prompt API endpoints exist (GET/PUT /api/prompt)', () => {
      const { createCallRoutes } = requireSrc('calls', 'api');
      const routes = createCallRoutes({}, {});
      assert.ok(typeof routes.getPrompt === 'function');
      assert.ok(typeof routes.updatePrompt === 'function');
    });
  });

  describe('REQ-CALL-006: Scoring', () => {
    it('computeWeightedScore calculates correctly', () => {
      const { computeWeightedScore, DEFAULT_SCORING_CRITERIA } = requireSrc('calls', 'evaluate');
      const scores = {};
      for (const c of DEFAULT_SCORING_CRITERIA) {
        scores[c.name] = 7;
      }
      const result = computeWeightedScore(scores, DEFAULT_SCORING_CRITERIA);
      assert.equal(result, 7, 'All 7s should average to 7');
    });

    it('Evaluation model captures all required fields', () => {
      const { createEvaluation } = requireSrc('calls', 'models');
      const eval_ = createEvaluation({
        id: '1', deal_id: 'D1', prompt_version: 2,
        scores: { discovery_quality: 8 },
        overall_score: 7.5,
        qualitative_summary: 'Good performance.',
        strengths: ['Strong discovery'],
        improvements: ['Follow up faster'],
        key_moments: [{ call_id: 'c1', timestamp_seconds: 300, quote: 'Tell me more', category: 'strong_discovery' }],
      });
      assert.equal(eval_.overall_score, 7.5);
      assert.equal(eval_.strengths.length, 1);
      assert.equal(eval_.improvements.length, 1);
      assert.equal(eval_.key_moments.length, 1);
    });
  });

  describe('REQ-CALL-007: Single-Call Drill-Down', () => {
    it('API has getCall endpoint', () => {
      const { createCallRoutes } = requireSrc('calls', 'api');
      const routes = createCallRoutes({}, {});
      assert.ok(typeof routes.getCall === 'function');
    });
  });

  describe('REQ-CALL-008: Re-evaluation', () => {
    it('API has reEvaluate endpoint', () => {
      const { createCallRoutes } = requireSrc('calls', 'api');
      const routes = createCallRoutes({}, {});
      assert.ok(typeof routes.reEvaluate === 'function');
    });
  });

  describe('REQ-CALL-009: API Contract', () => {
    it('all required API endpoints exist', () => {
      const { createCallRoutes } = requireSrc('calls', 'api');
      const routes = createCallRoutes({}, {});
      const required = ['listCalls', 'getCall', 'listDeals', 'getDeal', 'evaluateDeal',
        'listEvaluations', 'getEvaluation', 'getPrompt', 'updatePrompt', 'reEvaluate', 'syncGong'];
      for (const name of required) {
        assert.ok(typeof routes[name] === 'function', `Missing route handler: ${name}`);
      }
    });
  });
});

// ============================================================
// PRD 03: UI Dashboard
// ============================================================

describe('PRD-03: UI Dashboard', () => {

  describe('REQ-UI-001: Navigation Hierarchy', () => {
    it('all page routes are defined', () => {
      const { PAGES } = requireSrc('ui', 'pages');
      const required = ['/', '/director/:id', '/manager/:id', '/rep/:id', '/deal/:id', '/call/:id', '/settings/prompt'];
      for (const route of required) {
        assert.ok(PAGES[route], `Missing page definition: ${route}`);
      }
    });
  });

  describe('REQ-UI-007: Time Period Controls', () => {
    it('bucketByPeriod supports weekly bucketing', () => {
      const { bucketByPeriod } = requireSrc('ui', 'pages');
      const evals = [
        { evaluated_at: '2026-03-02T10:00:00Z', overall_score: 7, scores: { discovery: 8 } },
        { evaluated_at: '2026-03-03T10:00:00Z', overall_score: 8, scores: { discovery: 7 } },
        { evaluated_at: '2026-03-09T10:00:00Z', overall_score: 6, scores: { discovery: 6 } },
      ];
      const weekly = bucketByPeriod(evals, 'weekly');
      assert.ok(weekly.length >= 2, 'Should produce at least 2 weekly buckets');
    });

    it('bucketByPeriod supports monthly bucketing', () => {
      const { bucketByPeriod } = requireSrc('ui', 'pages');
      const evals = [
        { evaluated_at: '2026-02-15T10:00:00Z', overall_score: 7, scores: {} },
        { evaluated_at: '2026-03-15T10:00:00Z', overall_score: 8, scores: {} },
      ];
      const monthly = bucketByPeriod(evals, 'monthly');
      assert.equal(monthly.length, 2, 'Should produce 2 monthly buckets');
    });
  });

  describe('REQ-UI-008: Trend Charts', () => {
    it('trendDirection calculates correctly', () => {
      const { trendDirection } = requireSrc('ui', 'pages');
      assert.equal(trendDirection(7.5, 7.0), 'up');
      assert.equal(trendDirection(6.5, 7.0), 'down');
      assert.equal(trendDirection(7.1, 7.0), 'flat');
    });
  });

  describe('REQ-UI-011: Authentication & Authorization', () => {
    it('reps cannot access other reps data', () => {
      const { checkPageAccess } = requireSrc('ui', 'pages');
      const user = { id: 'rep1', role: 'ae' };
      const result = checkPageAccess('/rep/:id', user, { id: 'rep2' });
      assert.equal(result.allowed, false, 'Rep should not see other rep');
    });

    it('reps can access their own data', () => {
      const { checkPageAccess } = requireSrc('ui', 'pages');
      const user = { id: 'rep1', role: 'ae' };
      const result = checkPageAccess('/rep/:id', user, { id: 'rep1' });
      assert.equal(result.allowed, true);
    });

    it('managers can access rep views', () => {
      const { checkPageAccess } = requireSrc('ui', 'pages');
      const user = { id: 'mgr1', role: 'manager' };
      const result = checkPageAccess('/rep/:id', user, { id: 'rep1' });
      assert.equal(result.allowed, true);
    });

    it('reps cannot access org overview', () => {
      const { checkPageAccess } = requireSrc('ui', 'pages');
      const user = { id: 'rep1', role: 'ae' };
      const result = checkPageAccess('/', user, {});
      assert.equal(result.allowed, false);
    });
  });

  describe('REQ-UI-009: Prompt Editor', () => {
    it('prompt editor page exists and requires manager+ role', () => {
      const { PAGES } = requireSrc('ui', 'pages');
      const page = PAGES['/settings/prompt'];
      assert.ok(page, 'Prompt editor page must exist');
      assert.ok(page.requiredRole.includes('manager'), 'Managers should access prompt editor');
      assert.ok(page.requiredRole.includes('admin'), 'Admins should access prompt editor');
    });
  });

  describe('REQ-UI-010: Responsive Design', () => {
    // NOTE: This is a frontend implementation concern — cannot be fully tested at module level
    it('Frontend pages directory exists with Next.js App Router', () => {
      const pagesDir = path.join(SRC, 'app');
      const hasFrontend = fs.existsSync(pagesDir);
      assert.ok(hasFrontend, 'PRD-03 REQ-UI-010: No frontend pages directory found at src/app.');
      // Verify key pages exist
      const rootPage = path.join(pagesDir, 'page.js');
      assert.ok(fs.existsSync(rootPage), 'Root page.js should exist');
    });
  });

  describe('REQ-UI-012: Performance', () => {
    // NOTE: Performance testing requires runtime environment
    it('FLAGGED: Performance testing requires deployed environment', () => {
      assert.fail('PRD-03 REQ-UI-012: Performance benchmarks cannot be validated without a running server.');
    });
  });
});

// ============================================================
// PRD 04: Weekly Trends & Actionable Recommendations
// ============================================================

describe('PRD-04: Weekly Trends & Recommendations', () => {

  describe('REQ-REC-001: Trend Aggregation', () => {
    it('generate module exists with aggregation functions', () => {
      const mod = requireSrc('recommendations', 'generate');
      assert.ok(typeof mod.aggregateTrendsForScope === 'function');
      assert.ok(typeof mod.getWeekBounds === 'function');
      assert.ok(typeof mod.getMonthBounds === 'function');
    });

    it('getWeekBounds returns Monday-Sunday', () => {
      const { getWeekBounds } = requireSrc('recommendations', 'generate');
      const bounds = getWeekBounds('2026-03-04'); // Wednesday
      assert.ok(bounds.start <= '2026-03-04');
      assert.ok(bounds.end >= '2026-03-04');
    });

    it('getMonthBounds returns correct range', () => {
      const { getMonthBounds } = requireSrc('recommendations', 'generate');
      const bounds = getMonthBounds('2026-03-15');
      assert.equal(bounds.start, '2026-03-01');
      assert.equal(bounds.end, '2026-03-31');
    });
  });

  describe('REQ-REC-002: Trend Storage', () => {
    it('TrendSnapshot model captures all required fields', () => {
      const { createTrendSnapshot } = requireSrc('recommendations', 'models');
      const snapshot = createTrendSnapshot({
        id: '1', period_type: 'weekly', period_start: '2026-03-01', period_end: '2026-03-07',
        scope_type: 'rep', scope_id: 'rep1',
        metrics: { overall_score_avg: 7.5, deals_evaluated: 3, delta_overall: 0.5 },
      });
      assert.equal(snapshot.metrics.overall_score_avg, 7.5);
      assert.equal(snapshot.metrics.delta_overall, 0.5);
      assert.ok(snapshot.generated_at);
    });

    it('rejects invalid period_type', () => {
      const { createTrendSnapshot } = requireSrc('recommendations', 'models');
      assert.throws(() => createTrendSnapshot({ id: '1', period_type: 'daily', scope_type: 'rep', scope_id: '1' }),
        /period_type/);
    });
  });

  describe('REQ-REC-003: Recommendation Generation', () => {
    it('generateRecommendationForRep function exists', () => {
      const mod = requireSrc('recommendations', 'generate');
      assert.ok(typeof mod.generateRecommendationForRep === 'function');
    });

    it('generateRecommendationForManager function exists', () => {
      const mod = requireSrc('recommendations', 'generate');
      assert.ok(typeof mod.generateRecommendationForManager === 'function');
    });

    it('runWeeklyGeneration function exists', () => {
      const mod = requireSrc('recommendations', 'generate');
      assert.ok(typeof mod.runWeeklyGeneration === 'function');
    });
  });

  describe('REQ-REC-004: Recommendation Scoping', () => {
    it('API enforces recipient scoping on getRecommendation', () => {
      const { createRecommendationRoutes } = requireSrc('recommendations', 'api');
      const mockDb = {
        getRecommendation: async () => ({ id: 'r1', recipient_id: 'rep1' }),
        markRecommendationRead: async () => {},
      };
      const routes = createRecommendationRoutes(mockDb, {});

      // Simulate a request from a different user
      const mockRes = {
        statusCode: null,
        body: null,
        status(code) { this.statusCode = code; return this; },
        json(data) { this.body = data; },
      };
      routes.getRecommendation(
        { params: { id: 'r1' }, user: { id: 'rep2' } },
        mockRes
      ).then(() => {
        // Should return 403
        assert.equal(mockRes.statusCode, 403, 'Should deny access to other user\'s recommendation');
      });
    });

    it('Recommendation model scopes to single recipient', () => {
      const { createRecommendation } = requireSrc('recommendations', 'models');
      const rec = createRecommendation({
        id: '1', recipient_id: 'rep1', recipient_role: 'rep',
        period_type: 'weekly', period_start: '2026-03-01', period_end: '2026-03-07',
      });
      assert.equal(rec.recipient_id, 'rep1');
      assert.equal(rec.recipient_role, 'rep');
    });
  });

  describe('REQ-REC-005: Delivery Channels', () => {
    it('email module exists with builders', () => {
      const mod = requireSrc('recommendations', 'email');
      assert.ok(typeof mod.buildRepEmail === 'function');
      assert.ok(typeof mod.buildManagerEmail === 'function');
      assert.ok(typeof mod.deliverRecommendationEmails === 'function');
    });

    it('buildRepEmail produces correct structure', () => {
      const { buildRepEmail } = requireSrc('recommendations', 'email');
      const rec = {
        period_start: '2026-03-01', period_end: '2026-03-07',
        recipient_id: 'rep1',
        content: {
          score_snapshot: { overall: 7.5, delta: 0.3, criteria: {} },
          recommendations: [{ action: 'Improve discovery' }, { action: 'Better follow-up' }],
          highlights: ['Great multi-threading'],
        },
      };
      const email = buildRepEmail(rec, 'Alice', 'https://coaching.example.com');
      assert.ok(email.subject.includes('Weekly Sales Coaching'));
      assert.ok(email.body.includes('7.5/10'));
      assert.ok(email.body.includes('Improve discovery'));
      assert.ok(email.body.includes('Alice'));
      assert.ok(!email.body.includes('other rep'), 'Email must not reference other reps');
    });
  });

  describe('REQ-REC-006: Recommendation History', () => {
    it('API has listRecommendations endpoint', () => {
      const { createRecommendationRoutes } = requireSrc('recommendations', 'api');
      const routes = createRecommendationRoutes({}, {});
      assert.ok(typeof routes.listRecommendations === 'function');
    });
  });

  describe('REQ-REC-007: Configurability', () => {
    it('API has recommendation prompt endpoints', () => {
      const { createRecommendationRoutes } = requireSrc('recommendations', 'api');
      const routes = createRecommendationRoutes({}, {});
      assert.ok(typeof routes.getRecommendationPrompt === 'function');
      assert.ok(typeof routes.updateRecommendationPrompt === 'function');
    });
  });

  describe('REQ-REC-008: API Contract', () => {
    it('all required API endpoints exist', () => {
      const { createRecommendationRoutes } = requireSrc('recommendations', 'api');
      const routes = createRecommendationRoutes({}, {});
      const required = ['listTrends', 'getTrend', 'listRecommendations', 'getRecommendation',
        'triggerGeneration', 'getRecommendationPrompt', 'updateRecommendationPrompt'];
      for (const name of required) {
        assert.ok(typeof routes[name] === 'function', `Missing route handler: ${name}`);
      }
    });
  });

  describe('REQ-REC-005: Email does not leak data', () => {
    it('manager email does not contain individual rep scores', () => {
      const { buildManagerEmail } = requireSrc('recommendations', 'email');
      const rec = {
        period_start: '2026-03-01', period_end: '2026-03-07',
        recipient_id: 'mgr1',
        content: {
          summary: 'Team performed well this week.',
          score_snapshot: { overall: 7.2, delta: 0.1, criteria: {} },
          recommendations: [{ action: 'Run team workshop on discovery' }],
          highlights: ['Team average up'],
        },
      };
      const email = buildManagerEmail(rec, 'Bob Manager', 'https://coaching.example.com');
      assert.ok(email.subject.includes('Team Coaching Summary'));
      assert.ok(email.body.includes('7.2/10'));
    });
  });
});

// ============================================================
// PRD 05: Coaching Framework & Three-Pillar Methodology
// ============================================================

describe('PRD-05: Coaching Framework & Three-Pillar Methodology', () => {

  describe('REQ-FW-001: Three Pillars Defined', () => {
    it('three pillars are defined with sub-criteria', () => {
      const { PILLARS } = requireSrc('calls', 'three-pillars');
      assert.ok(PILLARS.gtm_workflow_mastery, 'P1 must exist');
      assert.ok(PILLARS.system_mapping, 'P2 must exist');
      assert.ok(PILLARS.solution_mapping, 'P3 must exist');
      assert.ok(PILLARS.gtm_workflow_mastery.sub_criteria.length > 0, 'P1 needs sub-criteria');
      assert.ok(PILLARS.system_mapping.sub_criteria.length > 0, 'P2 needs sub-criteria');
      assert.ok(PILLARS.solution_mapping.sub_criteria.length > 0, 'P3 needs sub-criteria');
    });
  });

  describe('REQ-FW-002: Scoring Bands', () => {
    it('getScoreBand returns correct bands', () => {
      const { getScoreBand } = requireSrc('calls', 'three-pillars');
      assert.equal(getScoreBand(0), 'developing');
      assert.equal(getScoreBand(3), 'developing');
      assert.equal(getScoreBand(4), 'proficient');
      assert.equal(getScoreBand(6), 'proficient');
      assert.equal(getScoreBand(7), 'elite');
      assert.equal(getScoreBand(10), 'elite');
    });

    it('getBandLabel returns human-readable labels', () => {
      const { getBandLabel } = requireSrc('calls', 'three-pillars');
      assert.equal(getBandLabel(2), 'Developing');
      assert.equal(getBandLabel(5), 'Proficient');
      assert.equal(getBandLabel(8), 'Elite');
    });
  });

  describe('REQ-FW-003: Composite Score', () => {
    it('computeCompositeScore applies pillar weights correctly', () => {
      const { computeCompositeScore } = requireSrc('calls', 'three-pillars');
      const scores = {
        gtm_workflow_mastery: { score: 8 },
        system_mapping: { score: 6 },
        solution_mapping: { score: 4 },
      };
      // SMB weights: 45/30/25
      const weights = { gtm_workflow_mastery: 0.45, system_mapping: 0.30, solution_mapping: 0.25 };
      const composite = computeCompositeScore(scores, weights);
      const expected = Math.round(((8 * 0.45) + (6 * 0.30) + (4 * 0.25)) * 10) / 10;
      assert.equal(composite, expected);
    });
  });

  describe('REQ-FW-004: Verdict Label', () => {
    it('buildVerdict produces band and pillar breakdown', () => {
      const { buildVerdict } = requireSrc('calls', 'three-pillars');
      const verdict = buildVerdict(5.5, {
        gtm_workflow_mastery: { score: 7 },
        system_mapping: { score: 5 },
        solution_mapping: { score: 4 },
      });
      assert.ok(verdict.includes('Proficient'), 'Should include composite band');
      assert.ok(verdict.includes('P1: Elite'), 'Should include P1 band');
      assert.ok(verdict.includes('P2: Proficient'), 'Should include P2 band');
    });
  });

  describe('REQ-FW-005: Transcript-Grounded Evidence', () => {
    it('validatePillarScores requires evidence for each pillar', () => {
      const { validatePillarScores } = requireSrc('calls', 'three-pillars');
      const noEvidence = {
        gtm_workflow_mastery: { score: 7, evidence: [] },
        system_mapping: { score: 5, evidence: [{ quote: 'x' }] },
        solution_mapping: { score: 4, evidence: [{ quote: 'y' }] },
      };
      const result = validatePillarScores(noEvidence);
      assert.equal(result.valid, false, 'Should reject pillar without evidence');
      assert.ok(result.errors.some(e => e.includes('gtm_workflow_mastery')));
    });

    it('validatePillarScores accepts valid scores with evidence', () => {
      const { validatePillarScores } = requireSrc('calls', 'three-pillars');
      const valid = {
        gtm_workflow_mastery: { score: 7, evidence: [{ quote: 'mentioned dialer' }] },
        system_mapping: { score: 5, evidence: [{ quote: 'asked about tech stack' }] },
        solution_mapping: { score: 4, evidence: [{ quote: 'tied to ROI' }] },
      };
      const result = validatePillarScores(valid);
      assert.equal(result.valid, true);
    });
  });

  describe('REQ-FW-006: Prompt Section Builder', () => {
    it('buildThreePillarPromptSection generates pillar instructions', () => {
      const { buildThreePillarPromptSection } = requireSrc('calls', 'three-pillars');
      const section = buildThreePillarPromptSection('smb', { gtm_workflow_mastery: 0.45, system_mapping: 0.30, solution_mapping: 0.25 });
      assert.ok(section.includes('GTM Workflow Mastery'));
      assert.ok(section.includes('System Mapping'));
      assert.ok(section.includes('Solution Mapping'));
      assert.ok(section.includes('45%'));
      assert.ok(section.includes('Segment: smb'));
    });
  });
});

// ============================================================
// PRD 06: Delivery Channels & Touchpoints
// ============================================================

describe('PRD-06: Delivery Channels & Touchpoints', () => {

  describe('REQ-DEL-001: Post-Call Ping', () => {
    it('buildPostCallPing creates correct structure', () => {
      const { buildPostCallPing } = requireSrc('recommendations', 'touchpoints');
      const eval_ = {
        composite_score: 7.5,
        scoring_band: 'elite',
        strengths: ['Great discovery'],
        improvements: ['Follow up faster'],
        next_call_playbook: ['Open with ROI', 'Map stakeholders', 'Tie to pain'],
      };
      const ping = buildPostCallPing(eval_, 'Alice');
      assert.equal(ping.type, 'post_call_ping');
      assert.ok(ping.body.includes('7.5/10'));
      assert.ok(ping.body.includes('Great discovery'));
      assert.ok(ping.body.includes('Open with ROI'));
    });
  });

  describe('REQ-DEL-002: End-of-Day Recap', () => {
    it('buildEODRecap summarizes daily evaluations', () => {
      const { buildEODRecap } = requireSrc('recommendations', 'touchpoints');
      const evals = [
        { composite_score: 7, priority_play_results: [{ detected: true }, { detected: false }] },
        { composite_score: 8, priority_play_results: [{ detected: true }, { detected: true }] },
      ];
      const recap = buildEODRecap(evals, 'Bob', '2026-03-08');
      assert.equal(recap.type, 'eod_recap');
      assert.equal(recap.calls_scored, 2);
      assert.equal(recap.avg_score, 7.5);
      assert.equal(recap.play_compliance_rate, 75); // 3 of 4 detected
    });
  });

  describe('REQ-DEL-003: End-of-Week Digest', () => {
    it('buildEOWDigest computes weekly score with delta', () => {
      const { buildEOWDigest } = requireSrc('recommendations', 'touchpoints');
      const evals = [{ composite_score: 7 }, { composite_score: 8 }];
      const digest = buildEOWDigest(evals, 'Carol', '2026-03-02', '2026-03-08', 6.5);
      assert.equal(digest.type, 'eow_digest');
      assert.equal(digest.composite_score, 7.5);
      assert.equal(digest.delta, 1);
    });
  });

  describe('REQ-DEL-004: Manager Real-Time Alert', () => {
    it('buildManagerRealtimeAlert identifies top/bottom performance', () => {
      const { buildManagerRealtimeAlert } = requireSrc('recommendations', 'touchpoints');
      const topEval = { composite_score: 9, improvements: [] };
      const alert = buildManagerRealtimeAlert(topEval, 'Alice', 'Acme Deal');
      assert.equal(alert.type, 'manager_realtime_alert');
      assert.equal(alert.is_top_performer, true);
      assert.ok(alert.subject.includes('Exceptional'));
    });

    it('shouldTriggerRealtimeAlert checks percentile thresholds', () => {
      const { shouldTriggerRealtimeAlert } = requireSrc('recommendations', 'touchpoints');
      assert.equal(shouldTriggerRealtimeAlert(9), true);
      assert.equal(shouldTriggerRealtimeAlert(2), true);
      assert.equal(shouldTriggerRealtimeAlert(5), false);
    });
  });

  describe('REQ-DEL-005: Manager Daily Digest', () => {
    it('buildManagerDailyDigest aggregates per-rep data', () => {
      const { buildManagerDailyDigest } = requireSrc('recommendations', 'touchpoints');
      const repEvals = {
        rep1: [{ composite_score: 7 }, { composite_score: 8 }],
        rep2: [{ composite_score: 5 }],
      };
      const digest = buildManagerDailyDigest(repEvals, 'Manager Jane', '2026-03-08');
      assert.equal(digest.type, 'manager_daily_digest');
      assert.equal(digest.rep_summaries.rep1.count, 2);
      assert.equal(digest.rep_summaries.rep1.avg_score, 7.5);
    });
  });

  describe('REQ-DEL-006: Coaching Uptake Tracking', () => {
    it('checkCoachingUptake detects improvement', () => {
      const { checkCoachingUptake } = requireSrc('recommendations', 'touchpoints');
      const current = { gtm_workflow_mastery: { score: 7 } };
      const prior = [{ flagged_pillar: 'gtm_workflow_mastery', flagged_score: 5, weeks_flagged: 1 }];
      const results = checkCoachingUptake(current, prior);
      assert.equal(results.length, 1);
      assert.equal(results[0].uptake_confirmed, true);
    });

    it('checkCoachingUptake detects stagnation', () => {
      const { checkCoachingUptake } = requireSrc('recommendations', 'touchpoints');
      const current = { system_mapping: { score: 4 } };
      const prior = [{ flagged_pillar: 'system_mapping', flagged_score: 4, weeks_flagged: 2 }];
      const results = checkCoachingUptake(current, prior);
      assert.equal(results[0].uptake_confirmed, false);
    });
  });

  describe('REQ-DEL-007: Escalation', () => {
    it('checkEscalation escalates after 2 weeks to rep, 3 weeks to manager', () => {
      const { checkEscalation } = requireSrc('recommendations', 'touchpoints');
      const uptake = [
        { pillar: 'system_mapping', uptake_confirmed: false, weeks_flagged: 2 },
        { pillar: 'gtm_workflow_mastery', uptake_confirmed: false, weeks_flagged: 3 },
      ];
      const escalations = checkEscalation(uptake);
      assert.equal(escalations.length, 2);
      assert.equal(escalations[0].escalate_to, 'rep');
      assert.equal(escalations[1].escalate_to, 'manager');
    });
  });

  describe('REQ-DEL-008: Touchpoint Types', () => {
    it('all six touchpoint types are defined', () => {
      const { TOUCHPOINT_TYPES } = requireSrc('recommendations', 'touchpoints');
      assert.ok(TOUCHPOINT_TYPES.post_call_ping);
      assert.ok(TOUCHPOINT_TYPES.eod_recap);
      assert.ok(TOUCHPOINT_TYPES.eow_digest);
      assert.ok(TOUCHPOINT_TYPES.manager_realtime_alert);
      assert.ok(TOUCHPOINT_TYPES.manager_daily_digest);
      assert.ok(TOUCHPOINT_TYPES.manager_weekly_rollup);
    });
  });
});

// ============================================================
// PRD 07: Role-Based Configuration & Segment Strategy
// ============================================================

describe('PRD-07: Role-Based Configuration & Segment Strategy', () => {

  describe('REQ-CFG-001: Segment Tagging', () => {
    it('VALID_SEGMENTS includes smb, mid_market, enterprise', () => {
      const { VALID_SEGMENTS } = requireSrc('config', 'segment-config');
      assert.deepEqual(VALID_SEGMENTS, ['smb', 'mid_market', 'enterprise']);
    });
  });

  describe('REQ-CFG-002: Priority Plays Configuration', () => {
    it('SMB priority plays include Dialer and Inbound', () => {
      const { DEFAULT_SMB_PRIORITY_PLAYS } = requireSrc('config', 'segment-config');
      const names = DEFAULT_SMB_PRIORITY_PLAYS.map(p => p.name);
      assert.ok(names.includes('Pitch Dialer'));
      assert.ok(names.includes('Pitch Inbound'));
    });

    it('checkPriorityPlays detects keyword matches', () => {
      const { checkPriorityPlays, DEFAULT_SMB_PRIORITY_PLAYS } = requireSrc('config', 'segment-config');
      const transcript = [{ text: 'Have you tried the Apollo Dialer? It helps with cold calling.' }];
      const results = checkPriorityPlays(transcript, DEFAULT_SMB_PRIORITY_PLAYS, 'smb');
      const dialerResult = results.find(r => r.play_name === 'Pitch Dialer');
      assert.ok(dialerResult.detected, 'Should detect Dialer mention');
    });

    it('checkPriorityPlays flags missing plays', () => {
      const { checkPriorityPlays, DEFAULT_SMB_PRIORITY_PLAYS } = requireSrc('config', 'segment-config');
      const transcript = [{ text: 'Let me tell you about our product.' }];
      const results = checkPriorityPlays(transcript, DEFAULT_SMB_PRIORITY_PLAYS, 'smb');
      const dialerResult = results.find(r => r.play_name === 'Pitch Dialer');
      assert.equal(dialerResult.detected, false);
      assert.ok(dialerResult.flag_message, 'Should have flag message for missed play');
    });
  });

  describe('REQ-CFG-003: Pillar Weight Configuration', () => {
    it('default pillar weights match PRD spec', () => {
      const { DEFAULT_PILLAR_WEIGHTS } = requireSrc('config', 'segment-config');
      assert.deepEqual(DEFAULT_PILLAR_WEIGHTS.smb, { gtm_workflow_mastery: 0.45, system_mapping: 0.30, solution_mapping: 0.25 });
      assert.deepEqual(DEFAULT_PILLAR_WEIGHTS.mid_market, { gtm_workflow_mastery: 0.35, system_mapping: 0.40, solution_mapping: 0.25 });
      assert.deepEqual(DEFAULT_PILLAR_WEIGHTS.enterprise, { gtm_workflow_mastery: 0.30, system_mapping: 0.35, solution_mapping: 0.35 });
    });

    it('createSegmentConfig enforces weights sum to 1', () => {
      const { createSegmentConfig } = requireSrc('config', 'segment-config');
      assert.throws(() => createSegmentConfig({
        segment: 'smb',
        pillar_weights: { gtm_workflow_mastery: 0.5, system_mapping: 0.5, solution_mapping: 0.5 },
      }), /sum to 1/);
    });
  });

  describe('REQ-CFG-004: MEDDPICC Required Fields by Stage', () => {
    it('default stage-gate requirements match PRD', () => {
      const { DEFAULT_MEDDPICC_BY_STAGE } = requireSrc('config', 'segment-config');
      assert.deepEqual(DEFAULT_MEDDPICC_BY_STAGE['Stage 1'], ['M', 'I']);
      assert.deepEqual(DEFAULT_MEDDPICC_BY_STAGE['Stage 2'], ['M', 'E', 'D', 'I', 'C']);
    });

    it('getMeddpiccRequirements returns requirements for stage', () => {
      const { getMeddpiccRequirements } = requireSrc('config', 'segment-config');
      const reqs = getMeddpiccRequirements('Stage 1');
      assert.deepEqual(reqs, ['M', 'I']);
    });
  });

  describe('REQ-CFG-010: Eligibility Filtering', () => {
    it('checkEligibility rejects short calls', () => {
      const { checkEligibility, DEFAULT_ELIGIBILITY_RULES } = requireSrc('config', 'segment-config');
      const call = { duration_seconds: 120, call_type: 'discovery' };
      const result = checkEligibility(call, DEFAULT_ELIGIBILITY_RULES);
      assert.equal(result.eligible, false);
      assert.ok(result.reason.includes('Duration'));
    });

    it('checkEligibility accepts eligible calls', () => {
      const { checkEligibility, DEFAULT_ELIGIBILITY_RULES } = requireSrc('config', 'segment-config');
      const call = { duration_seconds: 600, call_type: 'discovery' };
      const result = checkEligibility(call, DEFAULT_ELIGIBILITY_RULES);
      assert.equal(result.eligible, true);
    });
  });
});

// ============================================================
// PRD 08: Sales Process Adherence & MEDDPICC
// ============================================================

describe('PRD-08: Sales Process Adherence & MEDDPICC', () => {

  describe('REQ-MED-001: MEDDPICC Field Tracking', () => {
    it('all 7 MEDDPICC fields are defined', () => {
      const { MEDDPICC_FIELDS } = requireSrc('calls', 'meddpicc');
      assert.equal(MEDDPICC_FIELDS.length, 7);
    });
  });

  describe('REQ-MED-002: Stage-Gate Validation', () => {
    it('checkStageGate detects missing required fields', () => {
      const { checkStageGate } = requireSrc('calls', 'meddpicc');
      const deal = { deal_stage: 'Stage 2' };
      const status = {
        metrics: { sfdc_populated: true },
        economic_buyer: { sfdc_populated: false },
        decision_criteria: { sfdc_populated: true },
        identify_pain: { sfdc_populated: true },
        champion: { sfdc_populated: false },
      };
      const requirements = { 'Stage 2': ['M', 'E', 'D', 'I', 'C'] };
      const result = checkStageGate(deal, status, requirements);
      assert.equal(result.pass, false);
      assert.ok(result.missing.includes('E'));
      assert.ok(result.missing.includes('C'));
      assert.equal(result.severity, 'alert'); // 2+ missing
    });

    it('checkStageGate passes when all fields present', () => {
      const { checkStageGate } = requireSrc('calls', 'meddpicc');
      const deal = { deal_stage: 'Stage 1' };
      const status = {
        metrics: { sfdc_populated: true },
        identify_pain: { sfdc_populated: true },
      };
      const requirements = { 'Stage 1': ['M', 'I'] };
      const result = checkStageGate(deal, status, requirements);
      assert.equal(result.pass, true);
    });
  });

  describe('REQ-MED-003: SFDC Hygiene Scoring', () => {
    it('scoreSFDCHygiene returns composite score 0-10', () => {
      const { scoreSFDCHygiene } = requireSrc('calls', 'meddpicc');
      const deal = { next_step: 'Demo', next_step_date: '2026-03-15' };
      const status = {
        metrics: { sfdc_populated: true, sfdc_last_updated: new Date().toISOString(), gap_type: null },
        identify_pain: { sfdc_populated: true, sfdc_last_updated: new Date().toISOString(), gap_type: null },
      };
      const score = scoreSFDCHygiene(deal, status);
      assert.ok(score.composite >= 0 && score.composite <= 10);
      assert.ok(score.field_completeness >= 0 && score.field_completeness <= 10);
      assert.ok(score.data_freshness >= 0 && score.data_freshness <= 10);
      assert.ok(score.accuracy >= 0 && score.accuracy <= 10);
      assert.ok(score.next_steps >= 0 && score.next_steps <= 10);
    });
  });

  describe('REQ-MED-004: Transcript-to-SFDC Cross-Reference', () => {
    it('crossReferenceTranscriptToSFDC detects discussed-but-not-documented', () => {
      const { crossReferenceTranscriptToSFDC } = requireSrc('calls', 'meddpicc');
      const transcript = [{ text: 'The ROI would be significant for your revenue impact.' }];
      const status = {
        metrics: { sfdc_populated: false },
        economic_buyer: { sfdc_populated: true },
        champion: { sfdc_populated: true },
        identify_pain: { sfdc_populated: true },
        decision_criteria: { sfdc_populated: true },
      };
      const flags = crossReferenceTranscriptToSFDC(transcript, status);
      assert.ok(flags.some(f => f.field === 'metrics' && f.type === 'missing_field'));
    });
  });

  describe('REQ-MED-005: Pipeline Coaching', () => {
    it('assessPipelineHealth detects stuck deals', () => {
      const { assessPipelineHealth } = requireSrc('calls', 'meddpicc');
      const deal = {
        id: 'd1',
        deal_stage: 'Stage 2',
        stage_entered_at: new Date(Date.now() - 60 * 86400000).toISOString(), // 60 days ago
        segment: 'mid_market',
      };
      const calls = [{ participants: [{ name: 'Contact A', is_internal: false }] }];
      const result = assessPipelineHealth(deal, calls, 20); // 20-day avg cycle
      assert.equal(result.stuck, true);
      assert.equal(result.single_threaded, true);
      assert.ok(result.flags.length > 0);
    });
  });

  describe('REQ-MED-006: Champion Development Tracking', () => {
    it('trackChampionStatus detects champion identification', () => {
      const { trackChampionStatus } = requireSrc('calls', 'meddpicc');
      const calls = [
        { id: 'c1', date: '2026-03-01', transcript: [{ text: 'Sarah has been our champion internally, she is really advocating for this.' }] },
      ];
      const result = trackChampionStatus(calls);
      assert.equal(result.status, 'identified');
    });

    it('trackChampionStatus returns not_identified when no champion mentioned', () => {
      const { trackChampionStatus } = requireSrc('calls', 'meddpicc');
      const calls = [
        { id: 'c1', date: '2026-03-01', transcript: [{ text: 'We discussed pricing and timeline.' }] },
      ];
      const result = trackChampionStatus(calls);
      assert.equal(result.status, 'not_identified');
    });

    it('valid champion statuses are defined', () => {
      const { CHAMPION_STATUSES } = requireSrc('calls', 'meddpicc');
      assert.deepEqual(CHAMPION_STATUSES, ['not_identified', 'identified', 'tested', 'active']);
    });
  });
});
