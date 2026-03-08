/**
 * Gong API integration — PRD 02 (REQ-CALL-001, REQ-CALL-002)
 */

const { createCall, groupCallsByDeal } = require('./models');

const GONG_API_BASE = process.env.GONG_API_BASE || 'https://api.gong.io/v2';

async function fetchGongCalls(apiKey, { fromDate, toDate, cursor } = {}) {
  const body = {};
  if (fromDate || toDate) {
    body.filter = {};
    if (fromDate) body.filter.fromDateTime = fromDate;
    if (toDate) body.filter.toDateTime = toDate;
  }
  if (cursor) body.cursor = cursor;

  const response = await fetch(`${GONG_API_BASE}/calls/extensive`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Gong API error: ${response.status}`);
  return response.json();
}

async function fetchGongTranscript(apiKey, callId) {
  const response = await fetch(`${GONG_API_BASE}/calls/transcript`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ filter: { callIds: [callId] } }),
  });
  if (!response.ok) throw new Error(`Gong transcript API error: ${response.status}`);
  return response.json();
}

function mapGongCallToCall(gongCall, transcript, teamMembersByEmail) {
  const participants = (gongCall.parties || []).map(p => ({
    name: p.name,
    email: p.emailAddress,
    is_internal: !!teamMembersByEmail.get(p.emailAddress?.toLowerCase()),
  }));

  const internalParticipant = participants.find(p => p.is_internal);
  const repMember = internalParticipant ? teamMembersByEmail.get(internalParticipant.email.toLowerCase()) : null;

  return createCall({
    id: crypto.randomUUID(),
    gong_call_id: gongCall.metaData?.id || gongCall.id,
    date: gongCall.metaData?.started,
    duration_seconds: gongCall.metaData?.duration || 0,
    participants,
    transcript: transcript?.transcript || [],
    deal_id: gongCall.context?.crmDealId || null,
    account_id: gongCall.context?.crmAccountId || gongCall.context?.companyName || null,
    rep_id: repMember?.id || null,
  });
}

async function syncGongCalls(db, gongApiKey, teamMembers, options = {}) {
  const teamByEmail = new Map(teamMembers.map(m => [m.email.toLowerCase(), m]));
  const teamEmails = new Set(teamByEmail.keys());

  let cursor = null;
  let totalSynced = 0;
  const allCalls = [];

  do {
    const response = await fetchGongCalls(gongApiKey, { ...options, cursor });
    const calls = response.calls || [];

    for (const gongCall of calls) {
      // REQ-CALL-001: filter to calls involving sales team members
      const hasTeamMember = (gongCall.parties || []).some(
        p => p.emailAddress && teamEmails.has(p.emailAddress.toLowerCase())
      );
      if (!hasTeamMember) continue;

      const transcriptData = await fetchGongTranscript(gongApiKey, gongCall.metaData?.id);
      const callTranscript = transcriptData.callTranscripts?.[0];
      const call = mapGongCallToCall(gongCall, callTranscript, teamByEmail);

      await db.upsertCall(call);
      allCalls.push(call);
      totalSynced++;
    }

    cursor = response.records?.cursor;
  } while (cursor);

  // REQ-CALL-002: Group calls by deal
  const { byDeal, byAccount } = groupCallsByDeal(allCalls);

  // Upsert deal groups
  for (const [dealId, dealCalls] of byDeal) {
    await db.upsertDealGroup({
      id: dealId,
      crm_deal_id: dealId,
      calls: dealCalls.map(c => c.id),
    });
  }
  for (const [accountId, accountCalls] of byAccount) {
    await db.upsertDealGroup({
      id: `account-${accountId}`,
      account_name: accountId,
      calls: accountCalls.map(c => c.id),
    });
  }

  return { synced: totalSynced, deals: byDeal.size, orphan_groups: byAccount.size };
}

module.exports = { fetchGongCalls, fetchGongTranscript, mapGongCallToCall, syncGongCalls };
