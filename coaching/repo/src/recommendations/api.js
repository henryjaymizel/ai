/**
 * Recommendations API routes — PRD 04 (REQ-REC-008)
 */

function createRecommendationRoutes(db, llmClient) {
  return {
    async listTrends(req, res) {
      const trends = await db.getTrendSnapshots(req.query);
      res.json({ trends, count: trends.length });
    },

    async getTrend(req, res) {
      const trend = await db.getTrendSnapshot(req.params.id);
      if (!trend) return res.status(404).json({ error: 'Trend not found' });
      res.json(trend);
    },

    // REQ-REC-004: Scoped to current user
    async listRecommendations(req, res) {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const recs = await db.getRecommendationsForRecipient(userId, req.query);
      res.json({ recommendations: recs, count: recs.length });
    },

    async getRecommendation(req, res) {
      const rec = await db.getRecommendation(req.params.id);
      if (!rec) return res.status(404).json({ error: 'Recommendation not found' });

      // REQ-REC-004: Enforce scoping
      if (rec.recipient_id !== req.user?.id) {
        return res.status(403).json({ error: 'Not authorized to view this recommendation' });
      }

      // Mark as read
      if (!rec.read_at) {
        await db.markRecommendationRead(req.params.id);
      }

      res.json(rec);
    },

    async triggerGeneration(req, res) {
      const { runWeeklyGeneration } = require('./generate');
      try {
        const results = await runWeeklyGeneration(db, llmClient);
        res.json({ status: 'ok', ...results });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    },

    async getRecommendationPrompt(req, res) {
      const prompt = await db.getRecommendationPromptTemplate();
      res.json(prompt || { template: '', version: 0 });
    },

    async updateRecommendationPrompt(req, res) {
      const updated = await db.updateRecommendationPromptTemplate({
        template: req.body.template,
        updated_by: req.user?.id,
      });
      res.json(updated);
    },
  };
}

module.exports = { createRecommendationRoutes };
