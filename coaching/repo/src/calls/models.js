/**
 * Call and Deal data models — PRD 02
 */

function createCall({ id, gong_call_id, date, duration_seconds, participants, transcript, deal_id, account_id, rep_id }) {
  if (!id || !gong_call_id) throw new Error('Call requires id and gong_call_id');
  return {
    id,
    gong_call_id,
    date: date || new Date().toISOString(),
    duration_seconds: duration_seconds || 0,
    participants: participants || [],
    transcript: transcript || [],
    deal_id: deal_id || null,
    account_id: account_id || null,
    rep_id: rep_id || null,
  };
}

function createDealGroup({ id, crm_deal_id, account_name, account_domain, arr, seat_count, deal_stage }) {
  if (!id) throw new Error('DealGroup requires id');
  return {
    id,
    crm_deal_id: crm_deal_id || null,
    account_name: account_name || '',
    account_domain: account_domain || '',
    arr: arr || null,
    seat_count: seat_count || null,
    deal_stage: deal_stage || null,
    calls: [],
    company_context: null,
  };
}

function createCompanyContext({ apollo_company_id, total_employees, sales_headcount, industry, revenue }) {
  return {
    apollo_company_id: apollo_company_id || null,
    total_employees: total_employees || null,
    sales_headcount: sales_headcount || null,
    industry: industry || null,
    revenue: revenue || null,
    enriched_at: new Date().toISOString(),
  };
}

function createEvaluation({ id, deal_id, prompt_version, scores, overall_score, qualitative_summary, strengths, improvements, key_moments }) {
  if (!id || !deal_id) throw new Error('Evaluation requires id and deal_id');
  return {
    id,
    deal_id,
    prompt_version: prompt_version || 1,
    scores: scores || {},
    overall_score: overall_score || 0,
    qualitative_summary: qualitative_summary || '',
    strengths: strengths || [],
    improvements: improvements || [],
    key_moments: key_moments || [],
    evaluated_at: new Date().toISOString(),
    evaluated_by_prompt_hash: '',
  };
}

function groupCallsByDeal(calls) {
  const byDeal = new Map();
  const byAccount = new Map();

  for (const call of calls) {
    if (call.deal_id) {
      if (!byDeal.has(call.deal_id)) byDeal.set(call.deal_id, []);
      byDeal.get(call.deal_id).push(call);
    } else if (call.account_id) {
      if (!byAccount.has(call.account_id)) byAccount.set(call.account_id, []);
      byAccount.get(call.account_id).push(call);
    }
  }

  return { byDeal, byAccount };
}

module.exports = { createCall, createDealGroup, createCompanyContext, createEvaluation, groupCallsByDeal };
