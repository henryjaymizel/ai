/**
 * Trend aggregation and recommendation generation — PRD 04
 * (REQ-REC-001, REQ-REC-002, REQ-REC-003, REQ-REC-004)
 */

const { createTrendSnapshot, createRecommendation } = require('./models');
const { getSubtree } = require('../team/models');

function getWeekBounds(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  const start = new Date(d.setDate(diff));
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
}

function getMonthBounds(date) {
  const d = new Date(date);
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
}

async function aggregateTrendsForScope(db, scopeType, scopeId, periodType, periodStart, periodEnd) {
  let repIds;

  if (scopeType === 'rep') {
    repIds = [scopeId];
  } else if (scopeType === 'org') {
    const allMembers = await db.getAllTeamMembers();
    repIds = allMembers.filter(m => ['ae', 'sdr', 'se'].includes(m.role)).map(m => m.id);
  } else {
    const allMembers = await db.getAllTeamMembers();
    const subtree = getSubtree(allMembers, scopeId);
    repIds = subtree.filter(m => ['ae', 'sdr', 'se'].includes(m.role)).map(m => m.id);
  }

  const evaluations = await db.getEvaluationsForPeriod(repIds, periodStart, periodEnd);

  if (evaluations.length === 0) {
    return createTrendSnapshot({
      id: crypto.randomUUID(),
      period_type: periodType,
      period_start: periodStart,
      period_end: periodEnd,
      scope_type: scopeType,
      scope_id: scopeId,
      metrics: { overall_score_avg: 0, deals_evaluated: 0, calls_reviewed: 0 },
    });
  }

  const overallScores = evaluations.map(e => e.overall_score);
  const avgOverall = overallScores.reduce((a, b) => a + b, 0) / overallScores.length;

  // Aggregate per-criterion
  const criterionSums = {};
  const criterionCounts = {};
  for (const eval_ of evaluations) {
    for (const [criterion, score] of Object.entries(eval_.scores || {})) {
      criterionSums[criterion] = (criterionSums[criterion] || 0) + score;
      criterionCounts[criterion] = (criterionCounts[criterion] || 0) + 1;
    }
  }
  const criterionScores = {};
  for (const criterion of Object.keys(criterionSums)) {
    criterionScores[criterion] = Math.round((criterionSums[criterion] / criterionCounts[criterion]) * 10) / 10;
  }

  // Compute delta vs prior period
  const priorEvals = await db.getEvaluationsForPriorPeriod(repIds, periodType, periodStart);
  let deltaOverall = 0;
  if (priorEvals.length > 0) {
    const priorAvg = priorEvals.reduce((a, e) => a + e.overall_score, 0) / priorEvals.length;
    deltaOverall = Math.round((avgOverall - priorAvg) * 10) / 10;
  }

  return createTrendSnapshot({
    id: crypto.randomUUID(),
    period_type: periodType,
    period_start: periodStart,
    period_end: periodEnd,
    scope_type: scopeType,
    scope_id: scopeId,
    metrics: {
      overall_score_avg: Math.round(avgOverall * 10) / 10,
      criterion_scores: criterionScores,
      deals_evaluated: evaluations.length,
      calls_reviewed: evaluations.reduce((sum, e) => sum + (e.call_count || 1), 0),
      delta_overall: deltaOverall,
    },
  });
}

const REP_RECOMMENDATION_PROMPT = `You are a sales coach providing personalized feedback to a sales rep.

## Rep: {{rep_name}}
## Period: {{period_start}} to {{period_end}}

## Current Scores:
{{score_snapshot}}

## Evaluations This Period:
{{evaluations_summary}}

## Instructions:
- Focus ONLY on this rep's performance. Do not compare to others.
- Identify the 1-2 criteria where the rep most needs improvement.
- Reference specific deals and calls with actionable advice.
- Highlight what the rep did well to reinforce good behavior.
- Be specific and constructive, not generic.

Return JSON:
{
  "summary": "1-2 sentence overview",
  "recommendations": [{"priority": 1, "criterion": "...", "observation": "...", "action": "...", "reference_deal_id": "..."}],
  "highlights": ["positive thing 1", ...]
}`;

const MANAGER_RECOMMENDATION_PROMPT = `You are a sales coach providing a team performance summary to a manager.

## Manager: {{manager_name}}
## Period: {{period_start}} to {{period_end}}

## Team Scores:
{{team_scores}}

## Per-Rep Breakdown:
{{rep_breakdown}}

## Instructions:
- Summarize team performance at a glance.
- Identify which reps need coaching and on what.
- Suggest specific 1:1 talking points per rep.
- Flag at-risk deals.
- Highlight reps who improved (for recognition).
- Do NOT include data about reps outside this manager's team.

Return JSON:
{
  "summary": "team overview",
  "recommendations": [{"priority": 1, "criterion": "...", "observation": "...", "action": "...", "reference_deal_id": null}],
  "highlights": ["positive trends"],
  "rep_coaching": [{"rep_id": "...", "rep_name": "...", "talking_points": ["..."]}]
}`;

async function generateRecommendationForRep(db, llmClient, repId, periodType, periodStart, periodEnd) {
  const rep = await db.getTeamMember(repId);
  const trend = await aggregateTrendsForScope(db, 'rep', repId, periodType, periodStart, periodEnd);
  const evaluations = await db.getEvaluationsForPeriod([repId], periodStart, periodEnd);

  const prompt = REP_RECOMMENDATION_PROMPT
    .replace('{{rep_name}}', rep.name)
    .replace('{{period_start}}', periodStart)
    .replace('{{period_end}}', periodEnd)
    .replace('{{score_snapshot}}', JSON.stringify(trend.metrics, null, 2))
    .replace('{{evaluations_summary}}', JSON.stringify(evaluations.map(e => ({
      deal_id: e.deal_id,
      overall: e.overall_score,
      scores: e.scores,
      strengths: e.strengths,
      improvements: e.improvements,
    })), null, 2));

  const llmResponse = await llmClient.evaluate(prompt);

  return createRecommendation({
    id: crypto.randomUUID(),
    recipient_id: repId,
    recipient_role: 'rep',
    period_type: periodType,
    period_start: periodStart,
    period_end: periodEnd,
    content: {
      summary: llmResponse.summary,
      score_snapshot: {
        overall: trend.metrics.overall_score_avg,
        delta: trend.metrics.delta_overall,
        criteria: trend.metrics.criterion_scores,
      },
      recommendations: llmResponse.recommendations || [],
      highlights: llmResponse.highlights || [],
      deals_referenced: evaluations.map(e => e.deal_id),
    },
    prompt_version: 1,
  });
}

async function generateRecommendationForManager(db, llmClient, managerId, periodType, periodStart, periodEnd) {
  const manager = await db.getTeamMember(managerId);
  const allMembers = await db.getAllTeamMembers();
  const directReports = allMembers.filter(m => m.reports_to === managerId && ['ae', 'sdr', 'se'].includes(m.role));

  const repBreakdown = [];
  for (const rep of directReports) {
    const trend = await aggregateTrendsForScope(db, 'rep', rep.id, periodType, periodStart, periodEnd);
    repBreakdown.push({ rep_id: rep.id, rep_name: rep.name, ...trend.metrics });
  }

  const teamTrend = await aggregateTrendsForScope(db, 'manager', managerId, periodType, periodStart, periodEnd);

  const prompt = MANAGER_RECOMMENDATION_PROMPT
    .replace('{{manager_name}}', manager.name)
    .replace('{{period_start}}', periodStart)
    .replace('{{period_end}}', periodEnd)
    .replace('{{team_scores}}', JSON.stringify(teamTrend.metrics, null, 2))
    .replace('{{rep_breakdown}}', JSON.stringify(repBreakdown, null, 2));

  const llmResponse = await llmClient.evaluate(prompt);

  return createRecommendation({
    id: crypto.randomUUID(),
    recipient_id: managerId,
    recipient_role: 'manager',
    period_type: periodType,
    period_start: periodStart,
    period_end: periodEnd,
    content: {
      summary: llmResponse.summary,
      score_snapshot: {
        overall: teamTrend.metrics.overall_score_avg,
        delta: teamTrend.metrics.delta_overall,
        criteria: teamTrend.metrics.criterion_scores,
      },
      recommendations: llmResponse.recommendations || [],
      highlights: llmResponse.highlights || [],
      deals_referenced: [],
    },
    prompt_version: 1,
  });
}

async function runWeeklyGeneration(db, llmClient) {
  const { start, end } = getWeekBounds(new Date(Date.now() - 7 * 86400000)); // prior week
  const allMembers = await db.getAllTeamMembers();

  const results = { trends: [], recommendations: [] };

  // Generate trends for all scopes
  for (const member of allMembers) {
    if (['ae', 'sdr', 'se'].includes(member.role)) {
      const trend = await aggregateTrendsForScope(db, 'rep', member.id, 'weekly', start, end);
      await db.insertTrendSnapshot(trend);
      results.trends.push(trend.id);

      const rec = await generateRecommendationForRep(db, llmClient, member.id, 'weekly', start, end);
      await db.insertRecommendation(rec);
      results.recommendations.push(rec.id);
    }
    if (member.role === 'manager') {
      const trend = await aggregateTrendsForScope(db, 'manager', member.id, 'weekly', start, end);
      await db.insertTrendSnapshot(trend);
      results.trends.push(trend.id);

      const rec = await generateRecommendationForManager(db, llmClient, member.id, 'weekly', start, end);
      await db.insertRecommendation(rec);
      results.recommendations.push(rec.id);
    }
  }

  return results;
}

module.exports = {
  getWeekBounds,
  getMonthBounds,
  aggregateTrendsForScope,
  generateRecommendationForRep,
  generateRecommendationForManager,
  runWeeklyGeneration,
};
