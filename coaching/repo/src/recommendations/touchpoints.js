/**
 * Delivery touchpoints — PRD 06
 * Defines the six structured coaching touchpoints (3 rep, 3 manager).
 */

const TOUCHPOINT_TYPES = {
  // Rep touchpoints
  post_call_ping: {
    name: 'Post-Call Ping',
    recipient: 'rep',
    trigger: 'call_scored',
    delay_minutes: 30,
    channels: ['slack_dm'],
    description: 'Quick feedback within 30 minutes of call end',
  },
  eod_recap: {
    name: 'End-of-Day Recap',
    recipient: 'rep',
    trigger: 'schedule',
    schedule_time: '18:00',
    channels: ['slack_dm', 'email'],
    description: 'Daily coaching summary at 6:00 PM local time',
  },
  eow_digest: {
    name: 'End-of-Week Digest',
    recipient: 'rep',
    trigger: 'schedule',
    schedule_time: 'Friday 16:30',
    channels: ['email', 'in_app'],
    description: 'Weekly coaching summary Friday at 4:30 PM',
  },
  // Manager touchpoints
  manager_realtime_alert: {
    name: 'Real-Time Alert',
    recipient: 'manager',
    trigger: 'score_threshold',
    delay_minutes: 5,
    channels: ['slack_dm'],
    description: 'Alert for top/bottom 10% scores within 5 minutes',
  },
  manager_daily_digest: {
    name: 'Daily Team Digest',
    recipient: 'manager',
    trigger: 'schedule',
    schedule_time: '18:30',
    channels: ['slack_channel', 'email'],
    description: 'Team coaching summary at 6:30 PM',
  },
  manager_weekly_rollup: {
    name: 'Weekly Rollup',
    recipient: 'manager',
    trigger: 'schedule',
    schedule_time: 'Friday 17:00',
    channels: ['email', 'in_app'],
    description: 'Full team weekly coaching report Friday at 5:00 PM',
  },
};

function buildPostCallPing(evaluation, repName) {
  const topStrength = evaluation.strengths?.[0] || 'Good effort on this call';
  const topImprovement = evaluation.improvements?.[0] || 'Keep building on your approach';
  const playbook = evaluation.next_call_playbook || [];

  return {
    type: 'post_call_ping',
    subject: `Call Scored: ${evaluation.composite_score || evaluation.overall_score}/10`,
    body: `Hey ${repName}, your latest call just scored ${evaluation.composite_score || evaluation.overall_score}/10.\n\n` +
      `Strength: ${topStrength}\n` +
      `Work on: ${topImprovement}\n\n` +
      (playbook.length > 0 ? `Next Call Playbook:\n${playbook.map((p, i) => `${i + 1}. ${p}`).join('\n')}` : ''),
    score: evaluation.composite_score || evaluation.overall_score,
    band: evaluation.scoring_band || null,
  };
}

function buildEODRecap(evaluations, repName, date) {
  const count = evaluations.length;
  const avgScore = count > 0
    ? Math.round(evaluations.reduce((s, e) => s + (e.composite_score || e.overall_score), 0) / count * 10) / 10
    : 0;

  const playCompliance = evaluations.flatMap(e => e.priority_play_results || []);
  const totalPlays = playCompliance.length;
  const detectedPlays = playCompliance.filter(p => p.detected).length;
  const complianceRate = totalPlays > 0 ? Math.round((detectedPlays / totalPlays) * 100) : 100;

  return {
    type: 'eod_recap',
    subject: `Your Day in Review — ${date}`,
    body: `Hi ${repName},\n\n` +
      `Today's calls scored: ${count}\n` +
      `Average score: ${avgScore}/10\n` +
      `Priority play compliance: ${complianceRate}%\n\n` +
      (count > 0 ? `Keep building momentum!` : `No calls scored today.`),
    calls_scored: count,
    avg_score: avgScore,
    play_compliance_rate: complianceRate,
  };
}

function buildEOWDigest(weekEvaluations, repName, periodStart, periodEnd, priorWeekAvg) {
  const count = weekEvaluations.length;
  const avgScore = count > 0
    ? Math.round(weekEvaluations.reduce((s, e) => s + (e.composite_score || e.overall_score), 0) / count * 10) / 10
    : 0;
  const delta = priorWeekAvg != null ? Math.round((avgScore - priorWeekAvg) * 10) / 10 : 0;
  const arrow = delta > 0 ? '▲' : delta < 0 ? '▼' : '→';

  return {
    type: 'eow_digest',
    subject: `Weekly Coaching Summary — ${periodStart} to ${periodEnd}`,
    body: `Hi ${repName},\n\n` +
      `Weekly composite score: ${avgScore}/10 (${arrow} ${delta >= 0 ? '+' : ''}${delta})\n` +
      `Calls reviewed: ${count}\n\n`,
    composite_score: avgScore,
    delta,
    calls_reviewed: count,
  };
}

function buildManagerRealtimeAlert(evaluation, repName, dealName) {
  const score = evaluation.composite_score || evaluation.overall_score;
  const isTop = score >= 8;
  const prefix = isTop ? 'Exceptional call' : 'Needs attention';

  return {
    type: 'manager_realtime_alert',
    subject: `${prefix}: ${repName} scored ${score}/10`,
    body: `${repName} just scored ${score}/10 on ${dealName}.\n\n` +
      (isTop
        ? `Consider recognizing this performance in your next 1:1.`
        : `Suggested coaching: ${evaluation.improvements?.[0] || 'Review the call together'}`),
    score,
    is_top_performer: isTop,
    rep_name: repName,
  };
}

function buildManagerDailyDigest(repEvaluations, managerName, date) {
  const reps = {};
  for (const [repId, evals] of Object.entries(repEvaluations)) {
    const avg = evals.length > 0
      ? Math.round(evals.reduce((s, e) => s + (e.composite_score || e.overall_score), 0) / evals.length * 10) / 10
      : null;
    reps[repId] = { count: evals.length, avg_score: avg };
  }

  return {
    type: 'manager_daily_digest',
    subject: `Team Digest — ${date}`,
    body: `Hi ${managerName},\n\nTeam activity today:\n` +
      Object.entries(reps).map(([id, data]) =>
        `  ${id}: ${data.count} calls, avg ${data.avg_score || 'N/A'}/10`
      ).join('\n'),
    rep_summaries: reps,
  };
}

function buildManagerWeeklyRollup(teamTrend, repBreakdown, managerName, periodStart, periodEnd) {
  return {
    type: 'manager_weekly_rollup',
    subject: `Team Weekly Rollup — ${periodStart} to ${periodEnd}`,
    body: `Hi ${managerName},\n\n` +
      `Team average: ${teamTrend.metrics?.overall_score_avg || 0}/10\n` +
      `Deals evaluated: ${teamTrend.metrics?.deals_evaluated || 0}\n\n` +
      `Per-rep breakdown:\n` +
      repBreakdown.map(r => `  ${r.rep_name}: ${r.overall_score_avg || 0}/10`).join('\n'),
    team_metrics: teamTrend.metrics,
    rep_breakdown: repBreakdown,
  };
}

function shouldTriggerRealtimeAlert(score, percentileThresholds) {
  const top = percentileThresholds?.top || 8;
  const bottom = percentileThresholds?.bottom || 3;
  return score >= top || score <= bottom;
}

// REQ-DEL-006 / REQ-REC-009: Coaching uptake tracking
function checkCoachingUptake(currentPillarScores, priorRecommendations) {
  const uptakeResults = [];

  for (const rec of priorRecommendations) {
    if (!rec.flagged_pillar || !rec.flagged_score) continue;

    const currentScore = currentPillarScores[rec.flagged_pillar]?.score;
    if (currentScore == null) continue;

    const improvement = currentScore - rec.flagged_score;
    const confirmed = improvement >= 1;

    uptakeResults.push({
      pillar: rec.flagged_pillar,
      prior_score: rec.flagged_score,
      current_score: currentScore,
      improvement,
      uptake_confirmed: confirmed,
      weeks_flagged: rec.weeks_flagged || 1,
    });
  }

  return uptakeResults;
}

function checkEscalation(uptakeResults, thresholds) {
  const escalations = [];

  for (const result of uptakeResults) {
    if (!result.uptake_confirmed && result.weeks_flagged >= 2) {
      escalations.push({
        pillar: result.pillar,
        weeks_without_improvement: result.weeks_flagged,
        escalate_to: result.weeks_flagged >= 3 ? 'manager' : 'rep',
        message: result.weeks_flagged >= 3
          ? `Rep has not improved on ${result.pillar} for ${result.weeks_flagged} consecutive weeks. Manager intervention recommended.`
          : `${result.pillar} was flagged ${result.weeks_flagged} weeks ago with no improvement. Increasing emphasis.`,
      });
    }
  }

  return escalations;
}

module.exports = {
  TOUCHPOINT_TYPES,
  buildPostCallPing,
  buildEODRecap,
  buildEOWDigest,
  buildManagerRealtimeAlert,
  buildManagerDailyDigest,
  buildManagerWeeklyRollup,
  shouldTriggerRealtimeAlert,
  checkCoachingUptake,
  checkEscalation,
};
