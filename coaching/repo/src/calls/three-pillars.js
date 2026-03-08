/**
 * Three-Pillar Coaching Framework — PRD 05
 * Defines the three evaluation pillars and scoring band logic.
 */

const PILLARS = {
  gtm_workflow_mastery: {
    name: 'GTM Workflow Mastery',
    shortName: 'P1',
    description: 'Did the rep demonstrate and pitch Apollo products effectively?',
    sub_criteria: [
      'dialer_pitch',
      'inbound_pitch',
      'sequence_usage',
      'ai_assist_mention',
      'enrichment_mention',
    ],
  },
  system_mapping: {
    name: 'System Mapping',
    shortName: 'P2',
    description: 'Did the rep map the prospect\'s tech stack, workflows, and organizational structure?',
    sub_criteria: [
      'tech_stack_discovery',
      'workflow_mapping',
      'org_structure_mapping',
      'champion_development',
      'stakeholder_identification',
    ],
  },
  solution_mapping: {
    name: 'Solution Mapping',
    shortName: 'P3',
    description: 'Did the rep connect Apollo capabilities to identified pain points with business impact?',
    sub_criteria: [
      'pain_to_solution_connection',
      'business_impact_quantification',
      'competitive_differentiation',
      'roi_articulation',
      'use_case_specificity',
    ],
  },
};

const SCORING_BANDS = {
  developing: { min: 0, max: 3, label: 'Developing' },
  proficient: { min: 4, max: 6, label: 'Proficient' },
  elite: { min: 7, max: 10, label: 'Elite' },
};

function getScoreBand(score) {
  if (score <= 3) return 'developing';
  if (score <= 6) return 'proficient';
  return 'elite';
}

function getBandLabel(score) {
  return SCORING_BANDS[getScoreBand(score)].label;
}

function computeCompositeScore(pillarScores, pillarWeights) {
  const p1 = pillarScores.gtm_workflow_mastery?.score || 0;
  const p2 = pillarScores.system_mapping?.score || 0;
  const p3 = pillarScores.solution_mapping?.score || 0;

  const w1 = pillarWeights.gtm_workflow_mastery || 0.33;
  const w2 = pillarWeights.system_mapping || 0.33;
  const w3 = pillarWeights.solution_mapping || 0.34;

  const composite = (p1 * w1) + (p2 * w2) + (p3 * w3);
  return Math.round(composite * 10) / 10;
}

function buildVerdict(compositeScore, pillarScores) {
  const band = getBandLabel(compositeScore);
  const pillarDetails = Object.entries(pillarScores)
    .map(([key, val]) => `${PILLARS[key]?.shortName || key}: ${getBandLabel(val.score)}`)
    .join(', ');
  return `${band} — ${pillarDetails}`;
}

function validatePillarScores(pillarScores) {
  const errors = [];
  for (const [pillar, data] of Object.entries(pillarScores)) {
    if (!PILLARS[pillar]) {
      errors.push(`Unknown pillar: ${pillar}`);
      continue;
    }
    if (typeof data.score !== 'number' || data.score < 0 || data.score > 10) {
      errors.push(`${pillar} score must be 0-10, got ${data.score}`);
    }
    if (!data.evidence || data.evidence.length === 0) {
      errors.push(`${pillar} requires at least one transcript evidence quote`);
    }
  }
  return { valid: errors.length === 0, errors };
}

function buildThreePillarPromptSection(segment, pillarWeights) {
  return `## Three-Pillar Evaluation Framework

Score each pillar 0-10. Every score MUST include at least one supporting quote from the transcript.

### Pillar 1: GTM Workflow Mastery (Weight: ${Math.round(pillarWeights.gtm_workflow_mastery * 100)}%)
${PILLARS.gtm_workflow_mastery.description}
Sub-criteria: ${PILLARS.gtm_workflow_mastery.sub_criteria.join(', ')}

### Pillar 2: System Mapping (Weight: ${Math.round(pillarWeights.system_mapping * 100)}%)
${PILLARS.system_mapping.description}
Sub-criteria: ${PILLARS.system_mapping.sub_criteria.join(', ')}

### Pillar 3: Solution Mapping (Weight: ${Math.round(pillarWeights.solution_mapping * 100)}%)
${PILLARS.solution_mapping.description}
Sub-criteria: ${PILLARS.solution_mapping.sub_criteria.join(', ')}

Scoring Bands: Developing (0-3), Proficient (4-6), Elite (7-10)
Segment: ${segment}`;
}

module.exports = {
  PILLARS,
  SCORING_BANDS,
  getScoreBand,
  getBandLabel,
  computeCompositeScore,
  buildVerdict,
  validatePillarScores,
  buildThreePillarPromptSection,
};
