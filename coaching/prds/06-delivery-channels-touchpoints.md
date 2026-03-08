# PRD 06: Delivery Channels & Touchpoints

## Overview
The coaching agent delivers feedback through three recurring touchpoints per rep and three per manager, each calibrated to a different purpose and cadence. Coaching comes to the rep — they should never have to seek it out. All Slack and email notifications link through to the full coaching export on the coaching website.

## Rep Touchpoints

| Touchpoint | Timing | Channel | Purpose |
|------------|--------|---------|---------|
| Post-Call Ping | Within ~30 min of call end | Slack DM | Immediate, actionable feedback while the call is fresh |
| End-of-Day Recap | 6:00 PM local time (weekdays) | Slack DM + optional email | Daily themes, business priority alignment, what to do tomorrow |
| End-of-Week Digest | Friday 4:30 PM local time | Slack DM + optional email | Progress vs. prior weeks, coaching uptake, wins to celebrate |

## Manager Touchpoints

| Touchpoint | Timing | Channel | Purpose |
|------------|--------|---------|---------|
| Real-Time Alert | Within 5 min of call end | Slack DM and/or email | Something exceptional just happened (top/bottom 10% calls) |
| Daily Team Digest | 6:30 PM local time | Slack channel + email | Team performance today, who needs attention tomorrow |
| Weekly Rollup | Friday 5:00 PM | Slack DM + email | Who is improving, who is stalling, what needs direct intervention |

## Requirements

### REQ-DEL-001: Post-Call Ping (Rep)
- The system SHALL deliver a Slack DM to the rep within 30 minutes of an eligible call completing.
- The message SHALL be short — designed to be read in 60 seconds.
- Structure (fixed order):
  1. **Praise first**: at least one specific thing the rep did well, with timestamp/quote
  2. **Development second**: 1-2 highest-signal coaching observations
  3. **Link third**: link to full coaching export
- The message SHALL reference actual moments — timestamps, exact phrases, or specific decisions. No generic observations.
- Example format:
  ```
  ✅ Strong opener — you led with a specific pain point from their last QBR instead of a generic intro. That earned you an extra 8 minutes.
  ⚠️ Discovery gap — you moved to demo at minute 11 without confirming budget authority.
  ⚠️ Missed cross-sell — prospect mentioned 'we still cold-call' at 14:22 but you didn't introduce Dialer.
  🔗 Full coaching report → [link]
  ```

### REQ-DEL-002: End-of-Day Recap (Rep)
- The system SHALL deliver a consolidated Slack DM (and optionally email) at 6:00 PM in the rep's local timezone, weekdays only.
- The recap SHALL cover all calls scored that day and shift from individual call feedback to **patterns**.
- Structure:
  1. Call count and overall score with delta vs. 30-day average
  2. Win of the day (best moment across all calls)
  3. Recurring theme across calls (same gap appearing multiple times)
  4. **Business Priority Alignment**: segment-specific priority play compliance check (see PRD-07)
  5. Link to full day breakdown
- The business priority section SHALL be fed by the role-specific configuration layer (PRD-07).

### REQ-DEL-003: End-of-Week Digest (Rep)
- The system SHALL deliver a comprehensive digest every Friday at 4:30 PM local time.
- The digest SHALL cover:
  1. Full week call volume and aggregate pillar scores
  2. Biggest improvement (which pillar improved most)
  3. Persistent coaching themes (same gap for 2+ consecutive weeks)
  4. **Coaching Uptake Tracking**: compare current sub-scores against areas flagged in prior weeks
  5. Team highlight (anonymized positive comparison, e.g., "top P1 score on the team")
  6. Link to full weekly report
- **Coaching Application Alert**: If a gap flagged 2+ consecutive weeks shows no improvement, the digest SHALL explicitly flag it AND notify the rep's manager separately.

### REQ-DEL-004: Real-Time Manager Alert
- The system SHALL notify the manager within 5 minutes when a call scores in the **top 10%** or **bottom 10%** of the team's rolling score distribution.
- Alert includes: 1-paragraph summary, composite score, primary flags or standout moments, recommended action, link to full report.
- Top-score alerts suggest sharing the call as a coaching model.
- Low-score alerts recommend specific manager intervention (e.g., "Manager 1:1 review before next touchpoint").

### REQ-DEL-005: Daily Team Digest (Manager)
- Delivered to the manager's designated Slack channel + email at 6:30 PM local time.
- Structure:
  1. **Team scorecard**: rep count, calls scored, team average with delta
  2. **Top performers and needs-support**: ranked reps for the day
  3. **Team coaching theme**: most common gap across all reps
  4. **Business priority compliance**: segment-level priority play rates (e.g., Dialer 62%, Inbound 45%)
  5. **Calls-I-was-on**: for every call the manager personally attended, provide structured debrief with coaching recs for the rep, including specific language and playbook steps the manager can use

### REQ-DEL-006: Weekly Manager Rollup
- Delivered Friday 5:00 PM local time via Slack DM + email.
- Structure:
  1. Team composite average with delta vs. prior week
  2. **Reps improving** (3+ pt gain): names, delta, what improved
  3. **Reps plateauing** (within 1 pt): count, suggest coaching format review
  4. **Reps regressing** (3+ pt decline): names, delta, specific gap, recommended intervention
  5. **Priority play compliance**: bottom 3 reps per priority play
  6. Link to full rollup dashboard
- For regressing reps, the rollup SHALL include escalation recommendations (e.g., "PIP conversation" or "direct ride-along").

### REQ-DEL-007: Coaching Uptake Tracking
- The system SHALL compare current-week sub-scores against areas flagged in the prior 2-4 weeks of coaching.
- A gap that persists after 2 consecutive weeks of coaching SHALL trigger an "application alert" in the rep's end-of-week digest.
- After 3 consecutive weeks, the alert SHALL also be sent to the rep's manager as a separate notification.
- This creates accountability without requiring manual tracking from the manager.

### REQ-DEL-008: Audio Coaching Delivery
- The full coaching export SHALL be available as a narrated audio experience via TTS.
- Audio SHALL be divided into sections (one per pillar + intro/playbook).
- Playback controls SHALL include:
  - Play / pause
  - Skip between sections
  - Speed control (0.8x / 1x / 1.25x / 1.5x)
  - Seek within section
  - Resume where left off
- Audio utilization (% of exports where rep initiates playback) SHALL be tracked as a success metric.

### REQ-DEL-009: Delivery Channel Configuration
- Each user (rep and manager) SHALL be able to configure their preferred delivery channels:
  - Slack DM, Slack channel (managers), email, in-product notification
- Managers set: Slack channel for team updates, Slack DM for personal alerts, email for summaries.
- Email delivery can be toggled on/off per touchpoint per user.
- The coaching website is always the destination for full reports — all notifications link through.

### REQ-DEL-010: Delivery Timing
- Post-call ping: within 30 minutes of call completion. Target: same-session delivery.
- End-of-day recap: 6:00 PM local time for reps, 6:30 PM for managers.
- End-of-week digest: Friday 4:30 PM for reps, 5:00 PM for managers.
- Real-time manager alert: within 5 minutes.
- All timing SHALL respect the user's configured timezone.

### REQ-DEL-011: Escalation Rules
- Configurable escalation thresholds:
  - Alert manager if composite score < configurable threshold (default: 45/100)
  - Alert director if rep is below threshold for 3 consecutive weeks
- Escalation notifications SHALL be separate from regular coaching touchpoints.
- Thresholds SHALL be configurable per segment by the manager or program owner.

## Data Model

```
DeliveryPreference {
  user_id: string
  touchpoint: string          // "post_call" | "eod_recap" | "eow_digest" | "realtime_alert" | "daily_team" | "weekly_rollup"
  slack_dm: boolean
  slack_channel_id: string | null
  email: boolean
  in_app: boolean
  timezone: string            // IANA timezone
}

TouchpointDelivery {
  id: string
  touchpoint_type: string
  recipient_id: string
  channel: string             // "slack_dm" | "slack_channel" | "email" | "in_app"
  content: object             // Touchpoint-specific payload
  delivered_at: datetime
  opened_at: datetime | null
  audio_played: boolean
  link_clicked: boolean
}

EscalationEvent {
  id: string
  rep_id: string
  escalation_type: string     // "low_score" | "persistent_gap" | "regression"
  threshold: number
  consecutive_weeks: int
  escalated_to: string        // manager_id or director_id
  escalated_at: datetime
  resolved_at: datetime | null
}

CoachingUptakeCheck {
  rep_id: string
  week_start: date
  flagged_areas: string[]     // Pillar keys or sub-criteria flagged in prior weeks
  current_scores: { [area: string]: number }
  prior_scores: { [area: string]: number }
  uptake_detected: boolean    // Did the score improve?
  consecutive_weeks_flagged: int
}
```

## Success Metrics
| Metric | Target | Definition |
|--------|--------|------------|
| Coaching Coverage | >= 80% | % of eligible calls that receive a coaching export within 30 minutes |
| Rep Engagement Rate | >= 70% | % of reps who open/engage with their export within 48 hours |
| Time to Coaching | < 30 min | Time from call completion to coaching export delivery |
| Audio Utilization | Baseline TBD | % of exports where rep initiates audio playback |

## Acceptance Criteria
- [ ] Post-call ping is delivered within 30 minutes of call completion
- [ ] Post-call ping leads with praise, then development, then link
- [ ] End-of-day recap is delivered at 6:00 PM local time on weekdays
- [ ] End-of-day recap includes business priority alignment section
- [ ] End-of-week digest includes coaching uptake tracking
- [ ] Coaching application alert fires after 2 consecutive weeks of persistent gap
- [ ] Manager notification fires after 3 consecutive weeks
- [ ] Real-time manager alerts fire within 5 minutes for top/bottom 10% calls
- [ ] Daily team digest includes calls-I-was-on with structured debrief
- [ ] Weekly manager rollup identifies improving, plateauing, and regressing reps
- [ ] Audio delivery works with section navigation and speed control
- [ ] Delivery channel preferences are configurable per user per touchpoint
- [ ] Escalation thresholds are configurable and fire correctly
- [ ] All notifications link through to the coaching website
