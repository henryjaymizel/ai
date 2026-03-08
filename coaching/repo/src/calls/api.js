/**
 * Calls & Evaluation API routes — PRD 02 (REQ-CALL-009)
 */

function createCallRoutes(db, llmClient) {
  return {
    async listCalls(req, res) {
      const filters = {
        rep_id: req.query.rep_id,
        deal_id: req.query.deal_id,
        from_date: req.query.from_date,
        to_date: req.query.to_date,
      };
      const calls = await db.getCalls(filters);
      res.json({ calls, count: calls.length });
    },

    async getCall(req, res) {
      const call = await db.getCall(req.params.id);
      if (!call) return res.status(404).json({ error: 'Call not found' });
      res.json(call);
    },

    async listDeals(req, res) {
      const deals = await db.getDealGroups(req.query);
      res.json({ deals, count: deals.length });
    },

    async getDeal(req, res) {
      const deal = await db.getDealGroup(req.params.id);
      if (!deal) return res.status(404).json({ error: 'Deal not found' });
      const calls = await db.getCallsForDeal(req.params.id);
      const evaluations = await db.getEvaluationsForDeal(req.params.id);
      res.json({ deal, calls, evaluations });
    },

    async evaluateDeal(req, res) {
      const { evaluateDeal } = require('./evaluate');
      try {
        const evaluation = await evaluateDeal(db, llmClient, req.params.id);
        res.json(evaluation);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    },

    async listEvaluations(req, res) {
      const evaluations = await db.getEvaluations(req.query);
      res.json({ evaluations, count: evaluations.length });
    },

    async getEvaluation(req, res) {
      const evaluation = await db.getEvaluation(req.params.id);
      if (!evaluation) return res.status(404).json({ error: 'Evaluation not found' });
      res.json(evaluation);
    },

    async getPrompt(req, res) {
      const prompt = await db.getPromptTemplate();
      res.json(prompt || { template: '', scoring_criteria: [], version: 0 });
    },

    async updatePrompt(req, res) {
      const { template, scoring_criteria } = req.body;
      const updated = await db.updatePromptTemplate({ template, scoring_criteria, updated_by: req.user?.id });
      res.json(updated);
    },

    async reEvaluate(req, res) {
      const { evaluateDeal } = require('./evaluate');
      const { deal_ids, from_date, to_date } = req.body;
      let dealIds = deal_ids;
      if (!dealIds && (from_date || to_date)) {
        const deals = await db.getDealGroups({ from_date, to_date });
        dealIds = deals.map(d => d.id);
      }
      const results = [];
      for (const dealId of (dealIds || [])) {
        try {
          const evaluation = await evaluateDeal(db, llmClient, dealId);
          results.push({ deal_id: dealId, status: 'ok', evaluation_id: evaluation.id });
        } catch (err) {
          results.push({ deal_id: dealId, status: 'error', error: err.message });
        }
      }
      res.json({ results });
    },

    async syncGong(req, res) {
      const { syncGongCalls } = require('./gong-sync');
      try {
        const members = await db.getAllTeamMembers();
        const result = await syncGongCalls(db, process.env.GONG_API_KEY, members, req.body);
        res.json({ status: 'ok', ...result });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    },
  };
}

module.exports = { createCallRoutes };
