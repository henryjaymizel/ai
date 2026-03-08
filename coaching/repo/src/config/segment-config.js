/**
 * Segment-based configuration — PRD 07
 * Manages pillar weights, priority plays, eligibility rules, and MEDDPICC requirements per segment.
 */

const VALID_SEGMENTS = ['smb', 'mid_market', 'enterprise'];

const DEFAULT_PILLAR_WEIGHTS = {
  smb: { gtm_workflow_mastery: 0.45, system_mapping: 0.30, solution_mapping: 0.25 },
  mid_market: { gtm_workflow_mastery: 0.35, system_mapping: 0.40, solution_mapping: 0.25 },
  enterprise: { gtm_workflow_mastery: 0.30, system_mapping: 0.35, solution_mapping: 0.35 },
};

const DEFAULT_MEDDPICC_BY_STAGE = {
  'Stage 1': ['M', 'I'],
  'Stage 2': ['M', 'E', 'D', 'I', 'C'],
  'Stage 3': ['M', 'E', 'D', 'D', 'I', 'C', 'C'],
};

const DEFAULT_SMB_PRIORITY_PLAYS = [
  {
    name: 'Pitch Dialer',
    detection_keywords: ['apollo dialer', 'cold calling', 'outbound dialing', 'power dialer', 'call sequencing'],
    flag_message: 'Dialer was not pitched on this SMB call. Consider opening with Dialer ROI proof point.',
    suggested_script: 'Have you looked at ways to increase your outbound call volume? Our Dialer helps teams make 3x more calls per day.',
    segment_scope: ['smb'],
    active: true,
  },
  {
    name: 'Pitch Inbound',
    detection_keywords: ['inbound lead', 'website form', 'demo request', 'mql', 'inbound workflow', 'lead routing'],
    flag_message: 'Inbound product was not pitched on this SMB call. Flag for follow-up.',
    suggested_script: null,
    segment_scope: ['smb'],
    active: true,
  },
  {
    name: 'Single-Call Close',
    detection_keywords: ['next step', 'sign today', 'get started', 'pricing', 'contract', 'close'],
    flag_message: 'Call ended without a clear close attempt or next step. This SMB deal may have been closeable in one session.',
    suggested_script: null,
    segment_scope: ['smb'],
    active: true,
  },
  {
    name: 'Sequence Adoption',
    detection_keywords: ['sequence', 'outreach sequence', 'email sequence', 'cadence', 'follow-up sequence'],
    flag_message: 'SDR did not reference or discuss using Sequences for outreach.',
    suggested_script: null,
    segment_scope: ['smb'],
    active: true,
  },
];

const DEFAULT_ESCALATION_THRESHOLDS = [
  { trigger: 'single_score', score_threshold: 45, consecutive_weeks: null, notify_role: 'manager' },
  { trigger: 'consecutive_weeks', score_threshold: 50, consecutive_weeks: 3, notify_role: 'director' },
];

const DEFAULT_ELIGIBILITY_RULES = [
  { field: 'call_type', operator: 'in', value: ['discovery', 'demo', 'qbr', 'retention'] },
  { field: 'duration', operator: 'gte', value: 300 }, // 5 minutes in seconds
];

function createSegmentConfig({
  id, segment, pillar_weights, priority_plays, meddpicc_by_stage,
  escalation_thresholds, eligibility_rules, updated_by,
}) {
  if (!VALID_SEGMENTS.includes(segment)) {
    throw new Error(`Invalid segment: ${segment}. Must be one of: ${VALID_SEGMENTS.join(', ')}`);
  }

  const weights = pillar_weights || DEFAULT_PILLAR_WEIGHTS[segment];
  const weightSum = Object.values(weights).reduce((a, b) => a + b, 0);
  if (Math.abs(weightSum - 1.0) > 0.01) {
    throw new Error(`Pillar weights must sum to 1.0, got ${weightSum}`);
  }

  return {
    id: id || crypto.randomUUID(),
    segment,
    pillar_weights: weights,
    priority_plays: priority_plays || (segment === 'smb' ? DEFAULT_SMB_PRIORITY_PLAYS : []),
    meddpicc_by_stage: meddpicc_by_stage || DEFAULT_MEDDPICC_BY_STAGE,
    escalation_thresholds: escalation_thresholds || DEFAULT_ESCALATION_THRESHOLDS,
    eligibility_rules: eligibility_rules || DEFAULT_ELIGIBILITY_RULES,
    updated_by: updated_by || null,
    updated_at: new Date().toISOString(),
  };
}

function getPillarWeights(segment) {
  return DEFAULT_PILLAR_WEIGHTS[segment] || DEFAULT_PILLAR_WEIGHTS.mid_market;
}

function checkEligibility(call, rules) {
  for (const rule of rules) {
    if (rule.field === 'duration' && rule.operator === 'gte') {
      if (call.duration_seconds < rule.value) return { eligible: false, reason: `Duration ${call.duration_seconds}s < minimum ${rule.value}s` };
    }
    if (rule.field === 'call_type' && rule.operator === 'in') {
      if (!rule.value.includes(call.call_type)) return { eligible: false, reason: `Call type "${call.call_type}" not in eligible types` };
    }
  }
  return { eligible: true };
}

function checkPriorityPlays(transcript, plays, segment) {
  const text = (typeof transcript === 'string' ? transcript : transcript.map(s => s.text).join(' ')).toLowerCase();
  const results = [];

  for (const play of plays) {
    if (!play.active) continue;
    if (!play.segment_scope.includes(segment)) continue;

    const detected = play.detection_keywords.some(kw => text.includes(kw.toLowerCase()));
    results.push({
      play_name: play.name,
      detected,
      evidence: detected ? play.detection_keywords.find(kw => text.includes(kw.toLowerCase())) : null,
      flag_message: detected ? null : play.flag_message,
    });
  }

  return results;
}

function getMeddpiccRequirements(stage, config) {
  const reqs = config || DEFAULT_MEDDPICC_BY_STAGE;
  return reqs[stage] || [];
}

module.exports = {
  VALID_SEGMENTS,
  DEFAULT_PILLAR_WEIGHTS,
  DEFAULT_MEDDPICC_BY_STAGE,
  DEFAULT_SMB_PRIORITY_PLAYS,
  DEFAULT_ESCALATION_THRESHOLDS,
  DEFAULT_ELIGIBILITY_RULES,
  createSegmentConfig,
  getPillarWeights,
  checkEligibility,
  checkPriorityPlays,
  getMeddpiccRequirements,
};
