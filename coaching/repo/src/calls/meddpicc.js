/**
 * MEDDPICC tracking and SFDC hygiene scoring — PRD 08
 */

const MEDDPICC_FIELDS = ['M', 'E', 'D', 'D', 'I', 'C', 'C'];
const MEDDPICC_LABELS = {
  M: 'Metrics',
  E: 'Economic Buyer',
  D: 'Decision Criteria / Decision Process',
  I: 'Identify Pain',
  C: 'Champion / Competition',
};

const CHAMPION_STATUSES = ['not_identified', 'identified', 'tested', 'active'];

function checkStageGate(deal, meddpiccStatus, requirements) {
  const requiredFields = requirements[deal.deal_stage] || [];
  const uniqueRequired = [...new Set(requiredFields)];
  const missing = [];

  for (const field of uniqueRequired) {
    const fieldKey = meddpiccFieldKey(field);
    if (!meddpiccStatus[fieldKey]?.sfdc_populated) {
      missing.push(field);
    }
  }

  const severity = missing.length === 0 ? null : missing.length === 1 ? 'warning' : 'alert';

  return {
    stage: deal.deal_stage,
    required: uniqueRequired,
    missing,
    pass: missing.length === 0,
    severity,
    message: missing.length > 0
      ? `Deal is in ${deal.deal_stage} but missing MEDDPICC fields: ${missing.join(', ')}`
      : null,
  };
}

function meddpiccFieldKey(letter) {
  const map = {
    M: 'metrics',
    E: 'economic_buyer',
    D: 'decision_criteria',
    I: 'identify_pain',
    C: 'champion',
  };
  return map[letter] || letter.toLowerCase();
}

function scoreSFDCHygiene(deal, meddpiccStatus) {
  // Field completeness (40%)
  const totalFields = Object.keys(meddpiccStatus).length || 1;
  const populatedFields = Object.values(meddpiccStatus).filter(f => f.sfdc_populated).length;
  const fieldCompleteness = (populatedFields / totalFields) * 10;

  // Data freshness (20%)
  const now = Date.now();
  const staleThreshold = 14 * 24 * 60 * 60 * 1000; // 14 days
  const freshFields = Object.values(meddpiccStatus).filter(f => {
    if (!f.sfdc_last_updated) return false;
    return (now - new Date(f.sfdc_last_updated).getTime()) < staleThreshold;
  }).length;
  const dataFreshness = totalFields > 0 ? (freshFields / totalFields) * 10 : 0;

  // Accuracy (20%) — checks for mismatches between call and SFDC
  const mismatches = Object.values(meddpiccStatus).filter(f => f.gap_type === 'date_mismatch').length;
  const accuracy = Math.max(0, 10 - (mismatches * 3));

  // Next steps (20%)
  const hasNextStep = deal.next_step && deal.next_step_date;
  const nextSteps = hasNextStep ? 10 : 0;

  const composite = Math.round(
    (fieldCompleteness * 0.4 + dataFreshness * 0.2 + accuracy * 0.2 + nextSteps * 0.2) * 10
  ) / 10;

  return {
    field_completeness: Math.round(fieldCompleteness * 10) / 10,
    data_freshness: Math.round(dataFreshness * 10) / 10,
    accuracy: Math.round(accuracy * 10) / 10,
    next_steps: nextSteps,
    composite,
  };
}

function crossReferenceTranscriptToSFDC(transcript, meddpiccStatus) {
  const text = (typeof transcript === 'string' ? transcript : transcript.map(s => s.text).join(' ')).toLowerCase();
  const flags = [];

  // Check each MEDDPICC field for discussed-but-not-documented gaps
  const checks = [
    { field: 'metrics', keywords: ['roi', 'revenue impact', 'cost savings', 'metric', 'kpi', 'outcome'] },
    { field: 'economic_buyer', keywords: ['budget', 'vp', 'cfo', 'decision maker', 'approve', 'sign off'] },
    { field: 'champion', keywords: ['champion', 'advocate', 'internal sponsor', 'supporter'] },
    { field: 'identify_pain', keywords: ['pain point', 'challenge', 'problem', 'struggle', 'frustrat'] },
    { field: 'decision_criteria', keywords: ['criteria', 'requirement', 'must have', 'deal breaker', 'evaluation'] },
  ];

  for (const check of checks) {
    const discussed = check.keywords.some(kw => text.includes(kw));
    const status = meddpiccStatus[check.field];
    if (discussed && status && !status.sfdc_populated) {
      flags.push({
        type: 'missing_field',
        severity: 'warning',
        field: check.field,
        message: `${check.field} was discussed in the call but not documented in SFDC`,
        transcript_quote: null,
      });
    }
  }

  return flags;
}

function assessPipelineHealth(deal, calls, segmentAvgCycleDays) {
  const daysInStage = deal.stage_entered_at
    ? Math.floor((Date.now() - new Date(deal.stage_entered_at).getTime()) / (86400000))
    : 0;

  const contactsEngaged = new Set();
  for (const call of calls) {
    for (const p of (call.participants || [])) {
      if (!p.is_internal) contactsEngaged.add(p.email || p.name);
    }
  }

  const stuck = daysInStage > (segmentAvgCycleDays * 2);
  const singleThreaded = contactsEngaged.size <= 1;
  const closeDatePushes = deal.close_date_pushes || 0;

  const flags = [];
  if (stuck) flags.push(`Deal stuck in ${deal.deal_stage} for ${daysInStage} days (avg: ${segmentAvgCycleDays})`);
  if (singleThreaded) flags.push('Single-threaded: only 1 external contact engaged');
  if (closeDatePushes > 2) flags.push(`Close date pushed ${closeDatePushes} times`);
  if (contactsEngaged.size < 3 && deal.segment !== 'smb') flags.push(`Only ${contactsEngaged.size} contacts engaged (recommend 3+)`);

  return {
    deal_id: deal.id,
    stuck,
    days_in_stage: daysInStage,
    avg_days_for_segment: segmentAvgCycleDays,
    close_date_pushes: closeDatePushes,
    contacts_engaged: contactsEngaged.size,
    single_threaded: singleThreaded,
    flags,
    assessed_at: new Date().toISOString(),
  };
}

function trackChampionStatus(calls) {
  let status = 'not_identified';
  let championName = null;
  const evidence = [];

  const champKeywords = {
    identified: ['champion', 'advocate', 'supporter', 'internal sponsor', 'ally'],
    tested: ['asked .* to', 'schedule internal', 'share with', 'present to', 'get buy-in'],
    active: ['they scheduled', 'she presented', 'he shared', 'champion did', 'took it to'],
  };

  for (const call of calls) {
    const text = call.transcript?.map(s => s.text).join(' ') || '';
    const lower = text.toLowerCase();

    if (status === 'not_identified') {
      if (champKeywords.identified.some(kw => lower.includes(kw))) {
        status = 'identified';
        evidence.push({ call_id: call.id, date: call.date, type: 'mention', quote: '' });
      }
    }
    if (status === 'identified') {
      if (champKeywords.tested.some(kw => new RegExp(kw).test(lower))) {
        status = 'tested';
        evidence.push({ call_id: call.id, date: call.date, type: 'action_requested', quote: '' });
      }
    }
    if (status === 'tested') {
      if (champKeywords.active.some(kw => lower.includes(kw))) {
        status = 'active';
        evidence.push({ call_id: call.id, date: call.date, type: 'action_taken', quote: '' });
      }
    }
  }

  return {
    status,
    champion_name: championName,
    evidence,
    last_assessed: new Date().toISOString(),
  };
}

module.exports = {
  MEDDPICC_FIELDS,
  MEDDPICC_LABELS,
  CHAMPION_STATUSES,
  checkStageGate,
  scoreSFDCHygiene,
  crossReferenceTranscriptToSFDC,
  assessPipelineHealth,
  trackChampionStatus,
  meddpiccFieldKey,
};
