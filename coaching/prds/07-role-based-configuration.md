# PRD 07: Role-Based Configuration & Segment Strategy

## Overview
A single coaching rubric applied uniformly across all roles produces mediocre results. The AI Coaching Agent supports per-role, per-segment configuration so that the coaching each person receives is relevant to the plays they are actually running. Configuration is managed by sales leadership and RevOps — no engineering changes required to update priorities.

## Segment × Role Matrix

| Segment | Role | Priority Plays | Pillar Weights |
|---------|------|---------------|----------------|
| SMB | AE / SDR | Pitch Dialer on every deal; pitch Inbound on every deal; qualify to single-call close where possible; use Sequences as primary outbound motion | P1 45%, P2 30%, P3 25% |
| SMB | Manager | Monitor Dialer + Inbound pitch compliance; coach next-step confirmation rate; flag single-call-close opportunities missed | N/A (observation layer) |
| Mid-Market | AE | Multi-thread to 3+ contacts; establish Champion before Stage 2; prioritize Dialer + Inbound in discovery; use Sequences + AI Assist for follow-up | P1 35%, P2 40%, P3 25% |
| Mid-Market | Manager | Track MEDDPICC completion by stage; monitor Champion development; coach multi-threading cadence | N/A |
| Enterprise | AE | Executive alignment required before Stage 3; full MEDDPICC by Stage 2; mutual action plan shared with prospect; legal and procurement mapped early | P1 30%, P2 35%, P3 35% |
| Enterprise | Manager | Monitor exec alignment progress; coach procurement and legal navigation; track mutual action plan usage | N/A |

## Requirements

### REQ-CFG-001: Segment & Role Tagging
- Every rep and manager SHALL be tagged with a segment (SMB, Mid-Market, Enterprise) and a role (SDR, AE, Manager, Director, VP).
- Tags SHALL be sourced from Salesforce (rep profile or team assignment) and synced at call scoring time.
- Tags SHALL be overridable in the coaching admin UI for edge cases.

### REQ-CFG-002: Priority Plays Configuration
- Sales leadership SHALL be able to define priority plays per segment via the admin UI or structured config files.
- Priority plays are injected into the scoring prompt so the agent evaluates every call against them automatically.
- A priority play definition includes:
  - Play name (e.g., "Pitch Dialer")
  - Detection rule: keywords/phrases the agent scans for in the transcript (e.g., "Apollo Dialer", "cold calling", "power dialer", "call sequencing")
  - Flagging behavior: what happens when the play is NOT detected (e.g., "Flag as missed play with suggested intro script")
  - Segment scope: which segments this play applies to
- Changes to priority plays take effect on the next scored call — no model retraining required.

### REQ-CFG-003: Pillar Weight Configuration
- Pillar weights SHALL be configurable per segment.
- Defaults:
  - SMB: P1 45%, P2 30%, P3 25%
  - Mid-Market: P1 35%, P2 40%, P3 25%
  - Enterprise: P1 30%, P2 35%, P3 35%
- Weights SHALL sum to 100% and be enforced at save time.
- Enablement / program owner manages pillar weights.

### REQ-CFG-004: MEDDPICC Required Fields by Stage
- RevOps SHALL be able to define which MEDDPICC fields are required at each deal stage.
- Defaults:
  - Stage 1: M + I required
  - Stage 2: M + E + D + I + C required
  - Stage 3: All 7 fields required
- The evaluation prompt SHALL check SFDC field completeness against these requirements (see PRD-08).

### REQ-CFG-005: Escalation Thresholds
- Configurable per manager or program owner:
  - Alert manager if composite score < threshold (default: 45/100)
  - Alert Director if rep is below threshold for N consecutive weeks (default: 3 weeks at < 50)
- Thresholds SHALL be segment-aware (SMB reps may have different thresholds than Enterprise).

### REQ-CFG-006: Notification Channel Preferences
- Each manager SHALL self-configure their notification channels:
  - Slack channel: for team-level updates (daily team digest)
  - Slack DM: for personal real-time alerts
  - Email: for daily and weekly summaries
- The system SHALL support all three simultaneously.
- Defaults SHALL be sensible (Slack DM for alerts, email for weekly, Slack channel for daily team).

### REQ-CFG-007: Configuration Ownership Model
| Layer | Owner | Example |
|-------|-------|---------|
| Segment tag | RevOps / CRM admin | "SMB", "MM", "Enterprise" from SFDC |
| Priority plays | Sales leadership (per segment) | "Pitch Dialer on every call" |
| Pillar weights | Enablement / program owner | SMB: P1 45%, P2 30%, P3 25% |
| MEDDPICC fields by stage | RevOps | Stage 1: M + I required |
| Escalation thresholds | Manager / program owner | Alert if < 45/100 |
| Notification channels | Manager self-service | Slack channel: #smb-coaching |

### REQ-CFG-008: Configuration Change Propagation
- Configuration changes SHALL take effect on the **next scored call** after the change is saved.
- No model retraining, no engineering deployment required.
- Configuration changes SHALL be audit-logged (who changed what, when).

### REQ-CFG-009: SMB Priority Plays (Detailed)
Because SMB has specific Dialer + Inbound cross-sell priorities:
- **Dialer pitch check**: Scan transcript for mentions of Apollo Dialer, cold calling, outbound dialing, power dialer, call sequencing. If none found for an SMB opportunity, flag as missed play with suggested intro script.
- **Inbound pitch check**: Scan for mentions of inbound lead routing, website forms, demo requests, MQL, inbound workflow. If none found, flag as missed play.
- **Single-call close awareness**: Flag when a call with an SMB prospect ends without a clear close attempt or next step, noting if the deal could have been advanced in a single session.
- **Sequence adoption**: For SDRs, check whether the rep referenced or used an Apollo Sequence in their outreach discussion.

### REQ-CFG-010: Eligibility Filtering
- Not every call warrants coaching. The agent SHALL filter calls by:
  - **Call type**: discovery, demo, QBR, retention (configurable list)
  - **Minimum duration**: configurable threshold (default: 5 minutes)
  - **Rep segment**: only reps in eligible segments
  - **Topic classification**: Gong auto-tags or custom classification
- Calls that do not meet criteria SHALL be skipped without analysis.
- Eligibility rules SHALL be configurable by Product / Sales Leadership.

## Data Model

```
SegmentConfig {
  id: string
  segment: string           // "smb" | "mid_market" | "enterprise"
  pillar_weights: {
    gtm_workflow_mastery: number
    system_mapping: number
    solution_mapping: number
  }
  priority_plays: PriorityPlay[]
  meddpicc_by_stage: { [stage: string]: string[] }
  escalation_thresholds: EscalationThreshold[]
  eligibility_rules: EligibilityRule[]
  updated_by: string
  updated_at: datetime
}

PriorityPlay {
  name: string
  detection_keywords: string[]
  flag_message: string
  suggested_script: string | null
  segment_scope: string[]
  active: boolean
}

EscalationThreshold {
  trigger: string            // "single_score" | "consecutive_weeks"
  score_threshold: number
  consecutive_weeks: int | null
  notify_role: string        // "manager" | "director"
}

EligibilityRule {
  field: string              // "call_type" | "duration" | "segment" | "topic"
  operator: string           // "in" | "gte" | "eq"
  value: any
}

RepSegmentTag {
  rep_id: string
  segment: string
  role: string
  source: string             // "sfdc" | "manual_override"
  synced_at: datetime
}
```

## Acceptance Criteria
- [ ] Every rep is tagged with segment + role from Salesforce
- [ ] Priority plays are configurable per segment without engineering changes
- [ ] Priority play compliance is checked on every scored call
- [ ] SMB calls check for Dialer and Inbound mentions
- [ ] Pillar weights vary by segment and are applied to composite score correctly
- [ ] MEDDPICC required fields are defined per stage and checked
- [ ] Escalation thresholds are configurable and fire correctly
- [ ] Notification preferences are self-service for managers
- [ ] Configuration changes propagate to the next scored call
- [ ] All config changes are audit-logged
- [ ] Eligibility filter skips calls that don't meet criteria
