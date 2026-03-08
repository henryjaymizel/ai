# PRD 04: Weekly Trends & Actionable Recommendations

## Overview
Aggregate evaluation data into weekly and monthly trend reports, then generate and deliver personalized, actionable coaching recommendations to managers and reps. Each person receives only the feedback relevant to them and their scope.

## Goals
- Automatically compute weekly/monthly trend summaries per rep, manager, director, and org
- Generate AI-powered coaching recommendations tailored to each recipient
- Deliver recommendations via email and in-app notification
- Ensure strict scoping: reps see only their data, managers see only their reports

## Requirements

### REQ-REC-001: Trend Aggregation
- The system SHALL compute the following aggregates on a weekly cadence (Monday morning) and monthly cadence (1st of month):
  - **Per Rep**: average scores by criterion, overall score, number of deals evaluated, delta vs. prior period
  - **Per Manager**: same metrics aggregated across their direct reports, plus per-rep breakdown
  - **Per Director**: same metrics aggregated across their managers
  - **Org-wide**: same metrics across all reps
- Aggregation SHALL use evaluations completed within the period.

### REQ-REC-002: Trend Storage
- Trend snapshots SHALL be stored persistently so historical comparisons are possible.
- Data model:
  ```
  TrendSnapshot {
    id: string
    period_type: "weekly" | "monthly"
    period_start: date
    period_end: date
    scope_type: "rep" | "manager" | "director" | "org"
    scope_id: string  // TeamMember ID or "org"
    metrics: {
      overall_score_avg: number
      criterion_scores: { [criterion: string]: number }
      deals_evaluated: int
      calls_reviewed: int
      delta_overall: number  // vs prior period
      delta_criteria: { [criterion: string]: number }
    }
    generated_at: datetime
  }
  ```

### REQ-REC-003: Recommendation Generation
- After trend aggregation, the system SHALL generate personalized recommendations using an LLM.
- The recommendation prompt receives:
  - The recipient's trend data (current + prior periods)
  - The recipient's role and scope
  - The specific deals/evaluations that contributed to the trends
  - The scoring criteria definitions
- Recommendations SHALL be different based on recipient type:

#### For Reps:
- Focus on the rep's own scores and specific deals.
- Identify the 1-2 criteria where the rep declined or is below team average.
- Reference specific deals/calls where improvement was needed.
- Provide concrete, actionable tips (e.g., "In your call with Acme on 3/1, you missed asking about budget timeline. Try using the BANT framework in discovery calls.")
- Highlight what the rep did well to reinforce positive behavior.

#### For Managers:
- Summarize their team's performance at a glance.
- Identify which reps need coaching and on what criteria.
- Suggest specific 1:1 talking points per rep.
- Flag deals that are at risk based on evaluation scores.
- Highlight reps who improved significantly (for recognition).
- Provide aggregate trends: "Your team's discovery scores dropped 0.5 points this week — consider running a team workshop on qualification."

#### For Directors:
- Summarize manager-level performance.
- Identify which teams/managers are trending up or down.
- Strategic recommendations: "Manager X's team is consistently weak on multi-threading. Consider enablement resources."
- Org-level patterns and systemic issues.

### REQ-REC-004: Recommendation Scoping (Strict)
- A rep SHALL ONLY receive recommendations about their own calls and scores.
- A rep SHALL NOT see other reps' scores, names, or comparisons.
- A manager SHALL see their direct reports' data but NOT other managers' reports.
- A director SHALL see their managers and transitive reports.
- Recommendations SHALL be generated per-recipient; they are NOT a single report filtered by role.

### REQ-REC-005: Delivery Channels
- **Email**: Weekly digest email sent Monday morning. Monthly digest sent 1st of month.
  - Email SHALL include:
    - Subject: "Your Weekly Sales Coaching Summary — [date range]"
    - Overall score and trend arrow
    - Top 3 recommendations (brief)
    - Link to full report in the dashboard
  - Email SHALL NOT include full transcripts or raw scores for other reps.
- **In-App**: A notification badge + dedicated "Recommendations" tab in the dashboard.
  - Full recommendations viewable in the app.
  - Marked as read/unread.

### REQ-REC-006: Recommendation History
- All generated recommendations SHALL be stored and viewable historically.
- Users can view past weeks' recommendations from the dashboard.
- This enables tracking whether recommendations were acted on (future feature).

### REQ-REC-007: Configurability
- The recommendation prompt SHALL be editable by admins (similar to the evaluation prompt).
- Delivery schedule SHALL be configurable (default: weekly on Monday 8am, monthly on 1st 8am).
- Email delivery can be toggled on/off per user.

### REQ-REC-008: API Contract
```
GET  /api/trends                    — list trend snapshots (filters: period, scope)
GET  /api/trends/:id                — single trend snapshot
GET  /api/recommendations           — list recommendations for current user
GET  /api/recommendations/:id       — single recommendation detail
POST /api/recommendations/generate  — trigger recommendation generation
GET  /api/recommendations/prompt    — get recommendation prompt template
PUT  /api/recommendations/prompt    — update recommendation prompt template
```

## Data Model

```
Recommendation {
  id: string
  recipient_id: string        // TeamMember ID
  recipient_role: string      // rep | manager | director
  period_type: "weekly" | "monthly"
  period_start: date
  period_end: date
  content: {
    summary: string           // 1-2 sentence overview
    score_snapshot: {
      overall: number
      delta: number
      criteria: { [name: string]: { score: number, delta: number } }
    }
    recommendations: RecommendationItem[]
    highlights: string[]      // positive reinforcement
    deals_referenced: string[] // deal IDs mentioned
  }
  delivered_via: string[]     // ["email", "in_app"]
  delivered_at: datetime | null
  read_at: datetime | null
  generated_at: datetime
  prompt_version: int
}

RecommendationItem {
  priority: int               // 1 = most important
  criterion: string           // which scoring criterion
  observation: string         // what was observed
  action: string              // what to do differently
  reference_deal_id: string | null
  reference_call_id: string | null
}
```

## Email Template Structure

```
Subject: Your Weekly Sales Coaching Summary — Mar 1-7, 2026

Hi {{rep_name}},

Your overall coaching score this week: {{overall_score}}/10 ({{delta_direction}} {{delta_value}} from last week)

TOP RECOMMENDATIONS:
1. {{rec_1_action}}
2. {{rec_2_action}}
3. {{rec_3_action}}

WHAT YOU DID WELL:
{{highlights}}

View your full coaching report: [Dashboard Link]

---
This email was generated by the Sales Coaching Tool.
```

## Acceptance Criteria
- [ ] Weekly trend aggregation runs automatically on Monday morning
- [ ] Monthly trend aggregation runs on the 1st of each month
- [ ] Trend snapshots are stored and historically queryable
- [ ] Recommendations are generated per-recipient with correct scoping
- [ ] Rep recommendations reference only their own calls/deals
- [ ] Manager recommendations include per-rep coaching suggestions
- [ ] Director recommendations include per-manager summaries
- [ ] Email delivery works with correct content and links
- [ ] In-app recommendations appear with unread badge
- [ ] Recommendation prompt is editable by admins
- [ ] Delivery schedule is configurable
- [ ] No data leakage: rep cannot see other reps' data in recommendations
