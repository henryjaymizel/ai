# PRD 03: UI Dashboard

## Overview
A web-based dashboard that surfaces coaching insights at every level of the org — from a single call to aggregate team trends. Users can drill down from team-wide metrics to individual deal evaluations, and view trends over time by week or month.

## Goals
- Provide a single pane of glass for coaching data across the sales org
- Support drill-down from team → director → manager → rep → deal → call
- Show weekly and monthly trends by every scoring criterion
- Be responsive, fast, and intuitive

## User Personas
| Persona | Sees | Actions |
|---------|------|---------|
| VP (Max Angell) | Entire org, director-level aggregates | View trends, compare teams |
| Director | Their reports (managers) and transitive reps | View trends, compare managers |
| Manager | Their direct report reps | View trends, drill into deals/calls, edit prompt |
| Rep | Only their own calls and scores | View feedback, drill into deals/calls |
| Admin | Everything + system config | Edit prompt, trigger syncs, manage users |

## Requirements

### REQ-UI-001: Navigation Hierarchy
- The dashboard SHALL present a drill-down navigation:
  ```
  Org Overview → Director View → Manager View → Rep View → Deal View → Call View
  ```
- Each level shows aggregate metrics for that scope.
- Clicking into a level narrows the scope.
- Breadcrumbs SHALL show the current drill-down path.

### REQ-UI-002: Org Overview (VP Level)
- Shows aggregate scores across the entire sales org.
- Metrics displayed:
  - Average overall score (and trend sparkline)
  - Score distribution (histogram)
  - Top 5 and bottom 5 reps by overall score
  - Criterion-level averages (radar chart or bar chart)
  - Number of deals evaluated, calls reviewed
- Filterable by time period (week, month, quarter, custom range).
- Groupable by director.

### REQ-UI-003: Director / Manager View
- Same structure as Org Overview but scoped to the subtree of the selected director or manager.
- Shows comparison cards for each direct report.
- Each card shows: name, role, average score, trend (up/down/flat), number of deals.

### REQ-UI-004: Rep View
- Shows the selected rep's evaluation history.
- **Score trend chart**: line chart of overall score over time (weekly or monthly buckets).
- **Criterion breakdown**: bar chart showing average for each criterion.
- **Recent deals**: list of recent deal evaluations, sorted by date, showing overall score and status.
- **Strengths & Improvement areas**: aggregated across recent evaluations.

### REQ-UI-005: Deal View
- Shows the full evaluation for a single deal group.
- Displays:
  - Deal name, account, stage, ARR, seat count
  - Company context (Apollo data: employees, sales headcount, industry)
  - Deal sizing assessment
  - Overall score + criterion scores (bar chart)
  - Qualitative summary
  - Strengths and improvements
  - Key moments (with links to Gong playback timestamps)
  - List of all calls in the deal (with date, duration, participants)

### REQ-UI-006: Call View
- Shows a single call within a deal.
- Displays:
  - Call date, duration, participants
  - Transcript (searchable, speaker-labeled)
  - Key moments highlighted in the transcript
  - Sub-scores for this call (from the deal evaluation)
  - Link to Gong recording

### REQ-UI-007: Time Period Controls
- ALL aggregate views SHALL support toggling between:
  - **Weekly** view: scores bucketed by ISO week
  - **Monthly** view: scores bucketed by calendar month
- Date range picker for custom ranges.
- Default view: last 4 weeks.

### REQ-UI-008: Trend Charts
- Trend charts SHALL show:
  - Line chart of overall score over time
  - Ability to overlay criterion-specific scores
  - Comparison lines (e.g., team average vs. individual)
- Trend direction indicator (arrow up/down/flat) based on last period vs. prior period.

### REQ-UI-009: Prompt Editor
- Accessible from the admin/settings area.
- Full-text editor for the evaluation prompt template.
- Syntax highlighting for template variables (`{{transcripts}}`, etc.).
- Shows current scoring criteria with editable weights.
- Save button creates a new version; old versions are accessible.
- "Re-evaluate" button to re-run evaluations with the new prompt.

### REQ-UI-010: Responsive Design
- The dashboard SHALL be usable on desktop (primary) and tablet.
- Mobile is not a hard requirement but layouts should degrade gracefully.

### REQ-UI-011: Authentication & Authorization
- Users log in via SSO.
- Visibility is scoped by role:
  - Reps see only their own data.
  - Managers see their direct reports.
  - Directors see their subtree.
  - VP and Admin see everything.
- Unauthorized access attempts show a "not authorized" page, not a data leak.

### REQ-UI-012: Performance
- Dashboard pages SHALL load in under 2 seconds for typical data volumes.
- Trend charts SHALL render without visible lag for up to 52 weeks of data.
- Pagination or virtualization for lists > 50 items.

## Page Map

```
/                         — Org Overview (VP level)
/director/:id             — Director aggregate
/manager/:id              — Manager aggregate
/rep/:id                  — Rep detail
/deal/:id                 — Deal evaluation detail
/call/:id                 — Single call detail
/settings/prompt          — Prompt editor
/settings/team            — Team management
/settings/sync            — Sync status and triggers
```

## Wireframe Descriptions

### Org Overview
```
+-----------------------------------------------+
| [Logo] Sales Coaching     [User] [Settings]   |
+-----------------------------------------------+
| Period: [Last 4 Weeks v]  [Weekly|Monthly]    |
+-----------------------------------------------+
| Overall Score   | Score Distribution          |
| 7.2 (+0.3) ▲   | [Histogram]                |
+-----------------------------------------------+
| Criterion Averages         | Top/Bottom Reps  |
| [Radar/Bar Chart]          | 1. Alice  8.1    |
|                            | 2. Bob    7.9    |
|                            | ...              |
|                            | 18. Eve   4.2   |
+-----------------------------------------------+
| Director Breakdown                            |
| [Director A: 7.5] [Director B: 6.8] [Dir C]  |
+-----------------------------------------------+
```

### Rep View
```
+-----------------------------------------------+
| < Manager Name > Rep Name                     |
+-----------------------------------------------+
| Period: [Last 4 Weeks v]  [Weekly|Monthly]    |
+-----------------------------------------------+
| Score Trend         | Criterion Breakdown     |
| [Line Chart]        | [Bar Chart]             |
|                     | Discovery: 7.8          |
|                     | Objection: 6.2          |
|                     | ...                     |
+-----------------------------------------------+
| Strengths           | Areas to Improve        |
| - Good discovery    | - Follow-up commitment  |
| - Multi-threading   | - Deal sizing           |
+-----------------------------------------------+
| Recent Deals                                  |
| Deal A | Acme Corp | 7.5 | $120k | Stage 3   |
| Deal B | Beta Inc  | 6.1 | $45k  | Stage 2   |
+-----------------------------------------------+
```

## Acceptance Criteria
- [ ] Org overview displays correct aggregate scores
- [ ] Drill-down from org → director → manager → rep → deal → call works
- [ ] Weekly and monthly toggle changes chart bucketing
- [ ] Date range picker filters all data
- [ ] Trend charts render with correct data points
- [ ] Prompt editor allows editing and saves new versions
- [ ] Role-based visibility is enforced (rep sees only own data)
- [ ] Pages load under 2 seconds
- [ ] Breadcrumb navigation works at all levels
- [ ] Top/bottom rep lists are accurate
