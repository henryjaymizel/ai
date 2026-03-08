/**
 * Deal evaluation engine — PRD 02 (REQ-CALL-004, REQ-CALL-005, REQ-CALL-006)
 */

const { createEvaluation } = require('./models');

const DEFAULT_SCORING_CRITERIA = [
  { name: 'discovery_quality', description: 'How well did the rep uncover needs, pain, and priorities?', weight: 0.15 },
  { name: 'objection_handling', description: 'How effectively were objections addressed?', weight: 0.12 },
  { name: 'next_steps', description: 'Were clear, committed next steps established?', weight: 0.12 },
  { name: 'multi_threading', description: 'Were multiple stakeholders engaged?', weight: 0.12 },
  { name: 'value_articulation', description: 'How well was value communicated relative to the prospect\'s needs?', weight: 0.12 },
  { name: 'deal_sizing', description: 'Is the deal sized appropriately for the company? (seats, ARR vs. company size)', weight: 0.12 },
  { name: 'sales_process', description: 'Was the sales methodology (MEDDPICC) followed?', weight: 0.13 },
  { name: 'overall_effectiveness', description: 'Overall call effectiveness and professionalism', weight: 0.12 },
];

const DEFAULT_PROMPT_TEMPLATE = `You are an expert sales coach evaluating a deal.

## Deal Context
- Account: {{account_name}} ({{account_domain}})
- Deal Stage: {{deal_stage}}
- ARR: {{arr}}
- Seat Count: {{seat_count}}
- Rep: {{rep_name}} | Manager: {{manager_name}}

## Company Context (from Apollo)
- Total Employees: {{total_employees}}
- Sales Headcount: {{sales_headcount}}
- Industry: {{industry}}
- Revenue: {{company_revenue}}

## Scoring Criteria
{{scoring_criteria}}

## Call Transcripts (ordered chronologically)
{{transcripts}}

## Instructions
Evaluate this deal holistically across all calls. For each scoring criterion, provide:
1. A numeric score (1-10)
2. Specific evidence from the transcripts

Additionally assess:
- **Deal Sizing**: Given the company has {{total_employees}} employees and {{sales_headcount}} in sales, is {{seat_count}} seats at {{arr}} ARR appropriately sized? Are we leaving money on the table or over-estimating?
- **Sales Process**: Did the rep follow MEDDPICC? Identify any gaps in Metrics, Economic Buyer, Decision Criteria, Decision Process, Identify Pain, Champion, Competition.
- **Multi-threading**: How many stakeholders were engaged? Were economic buyers involved?

Return your evaluation as JSON:
{
  "scores": { "criterion_name": score, ... },
  "overall_score": weighted_average,
  "qualitative_summary": "2-3 paragraph narrative",
  "strengths": ["strength 1", ...],
  "improvements": ["specific actionable improvement 1", ...],
  "key_moments": [{ "call_id": "...", "timestamp_seconds": N, "quote": "...", "category": "..." }, ...]
}`;

function buildEvaluationPrompt(template, deal, calls, companyContext, repName, managerName, criteria) {
  const transcriptText = calls
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((call, i) => {
      const segments = call.transcript.map(seg =>
        `[${seg.speaker}] ${seg.text}`
      ).join('\n');
      return `### Call ${i + 1} — ${call.date} (${Math.round(call.duration_seconds / 60)} min)\n${segments}`;
    })
    .join('\n\n---\n\n');

  const criteriaText = (criteria || DEFAULT_SCORING_CRITERIA)
    .map(c => `- **${c.name}** (weight: ${c.weight}): ${c.description}`)
    .join('\n');

  let prompt = template || DEFAULT_PROMPT_TEMPLATE;
  const subs = {
    '{{account_name}}': deal.account_name || 'Unknown',
    '{{account_domain}}': deal.account_domain || '',
    '{{deal_stage}}': deal.deal_stage || 'Unknown',
    '{{arr}}': deal.arr ? `$${deal.arr.toLocaleString()}` : 'Unknown',
    '{{seat_count}}': String(deal.seat_count || 'Unknown'),
    '{{rep_name}}': repName || 'Unknown',
    '{{manager_name}}': managerName || 'Unknown',
    '{{total_employees}}': String(companyContext?.total_employees || 'Unknown'),
    '{{sales_headcount}}': String(companyContext?.sales_headcount || 'Unknown'),
    '{{industry}}': companyContext?.industry || 'Unknown',
    '{{company_revenue}}': companyContext?.revenue ? `$${companyContext.revenue.toLocaleString()}` : 'Unknown',
    '{{scoring_criteria}}': criteriaText,
    '{{transcripts}}': transcriptText,
  };
  for (const [key, val] of Object.entries(subs)) {
    prompt = prompt.replaceAll(key, val);
  }

  return prompt;
}

function computeWeightedScore(scores, criteria) {
  const criteriaMap = new Map((criteria || DEFAULT_SCORING_CRITERIA).map(c => [c.name, c.weight]));
  let totalWeight = 0;
  let weightedSum = 0;

  for (const [criterion, score] of Object.entries(scores)) {
    const weight = criteriaMap.get(criterion) || 0;
    weightedSum += score * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 10) / 10 : 0;
}

async function evaluateDeal(db, llmClient, dealId, options = {}) {
  const deal = await db.getDealGroup(dealId);
  if (!deal) throw new Error(`Deal not found: ${dealId}`);

  const calls = await db.getCallsForDeal(dealId);
  if (calls.length === 0) throw new Error(`No calls found for deal: ${dealId}`);

  const promptConfig = await db.getPromptTemplate();
  const template = promptConfig?.template || DEFAULT_PROMPT_TEMPLATE;
  const criteria = promptConfig?.scoring_criteria || DEFAULT_SCORING_CRITERIA;

  const rep = calls[0].rep_id ? await db.getTeamMember(calls[0].rep_id) : null;
  const manager = rep?.reports_to ? await db.getTeamMember(rep.reports_to) : null;

  const prompt = buildEvaluationPrompt(
    template, deal, calls,
    deal.company_context,
    rep?.name, manager?.name, criteria
  );

  const llmResponse = await llmClient.evaluate(prompt);

  const evaluation = createEvaluation({
    id: crypto.randomUUID(),
    deal_id: dealId,
    prompt_version: promptConfig?.version || 1,
    scores: llmResponse.scores,
    overall_score: computeWeightedScore(llmResponse.scores, criteria),
    qualitative_summary: llmResponse.qualitative_summary,
    strengths: llmResponse.strengths,
    improvements: llmResponse.improvements,
    key_moments: llmResponse.key_moments,
  });

  await db.insertEvaluation(evaluation);
  return evaluation;
}

module.exports = {
  DEFAULT_SCORING_CRITERIA,
  DEFAULT_PROMPT_TEMPLATE,
  buildEvaluationPrompt,
  computeWeightedScore,
  evaluateDeal,
};
