/**
 * Recommendation and Trend data models — PRD 04
 */

function createTrendSnapshot({ id, period_type, period_start, period_end, scope_type, scope_id, metrics }) {
  if (!id) throw new Error('TrendSnapshot requires id');
  if (!['weekly', 'monthly'].includes(period_type)) throw new Error('period_type must be weekly or monthly');
  if (!['rep', 'manager', 'director', 'org'].includes(scope_type)) throw new Error('Invalid scope_type');

  return {
    id,
    period_type,
    period_start,
    period_end,
    scope_type,
    scope_id,
    metrics: {
      overall_score_avg: metrics?.overall_score_avg || 0,
      criterion_scores: metrics?.criterion_scores || {},
      deals_evaluated: metrics?.deals_evaluated || 0,
      calls_reviewed: metrics?.calls_reviewed || 0,
      delta_overall: metrics?.delta_overall || 0,
      delta_criteria: metrics?.delta_criteria || {},
    },
    generated_at: new Date().toISOString(),
  };
}

function createRecommendation({
  id, recipient_id, recipient_role, period_type, period_start, period_end,
  content, prompt_version,
}) {
  if (!id || !recipient_id) throw new Error('Recommendation requires id and recipient_id');

  return {
    id,
    recipient_id,
    recipient_role: recipient_role || 'rep',
    period_type: period_type || 'weekly',
    period_start,
    period_end,
    content: {
      summary: content?.summary || '',
      score_snapshot: content?.score_snapshot || { overall: 0, delta: 0, criteria: {} },
      recommendations: content?.recommendations || [],
      highlights: content?.highlights || [],
      deals_referenced: content?.deals_referenced || [],
    },
    delivered_via: [],
    delivered_at: null,
    read_at: null,
    generated_at: new Date().toISOString(),
    prompt_version: prompt_version || 1,
  };
}

module.exports = { createTrendSnapshot, createRecommendation };
