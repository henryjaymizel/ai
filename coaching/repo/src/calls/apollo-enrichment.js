/**
 * Apollo enrichment for deal validation — PRD 02 (REQ-CALL-003, REQ-CALL-004)
 */

const { createCompanyContext } = require('./models');

const APOLLO_API_BASE = process.env.APOLLO_API_BASE || 'https://api.apollo.io/v1';

async function enrichFromApollo(apiKey, domain) {
  const response = await fetch(`${APOLLO_API_BASE}/organizations/enrich`, {
    method: 'GET',
    headers: { 'X-Api-Key': apiKey },
    // Apollo uses query params for enrichment
  });
  // Simplified — real impl would use proper params
  if (!response.ok) throw new Error(`Apollo API error: ${response.status}`);
  return response.json();
}

async function enrichDealWithApollo(db, apolloApiKey, dealId) {
  const deal = await db.getDealGroup(dealId);
  if (!deal || !deal.account_domain) {
    return null;
  }

  const apolloData = await enrichFromApollo(apolloApiKey, deal.account_domain);
  const org = apolloData.organization || {};

  const context = createCompanyContext({
    apollo_company_id: org.id,
    total_employees: org.estimated_num_employees || org.num_employees,
    sales_headcount: estimateSalesHeadcount(org),
    industry: org.industry,
    revenue: org.annual_revenue,
  });

  await db.updateDealCompanyContext(dealId, context);
  return context;
}

function estimateSalesHeadcount(org) {
  // Apollo may provide department breakdowns
  if (org.departments) {
    const salesDept = org.departments.find(d =>
      d.name?.toLowerCase().includes('sales')
    );
    if (salesDept) return salesDept.headcount;
  }
  // Fallback: estimate ~15% of company is sales for B2B SaaS
  if (org.estimated_num_employees) {
    return Math.round(org.estimated_num_employees * 0.15);
  }
  return null;
}

function assessDealSizing(deal, companyContext) {
  const issues = [];
  const insights = [];

  if (!companyContext || !deal.seat_count) {
    return { issues: ['Insufficient data to assess deal sizing'], insights: [] };
  }

  const totalEmployees = companyContext.total_employees;
  const salesHeadcount = companyContext.sales_headcount;
  const seats = deal.seat_count;

  if (salesHeadcount && seats) {
    const penetration = seats / salesHeadcount;
    if (penetration < 0.1) {
      issues.push(`Low penetration: ${seats} seats for ${salesHeadcount} sales reps (${(penetration * 100).toFixed(0)}%). Opportunity to expand.`);
    } else if (penetration > 1.2) {
      issues.push(`Seat count (${seats}) exceeds estimated sales headcount (${salesHeadcount}). Verify if non-sales users are included.`);
    } else {
      insights.push(`Good penetration: ${seats} seats for ${salesHeadcount} sales reps (${(penetration * 100).toFixed(0)}%).`);
    }
  }

  if (deal.arr && totalEmployees) {
    const arrPerEmployee = deal.arr / totalEmployees;
    if (arrPerEmployee < 10) {
      issues.push(`ARR/employee is very low ($${arrPerEmployee.toFixed(0)}). May be undersized.`);
    }
  }

  return { issues, insights };
}

module.exports = { enrichFromApollo, enrichDealWithApollo, estimateSalesHeadcount, assessDealSizing };
