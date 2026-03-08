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
| VP (Max Angell) | Entire org, director-level aggregates, segment strategy dashboard | View trends, compare teams, segment analysis |
| Director | Their reports (managers) and transitive reps, cross-team heatmap | View trends, compare managers |
| Manager | Their direct report reps | View trends, drill into deals/calls, edit prompt, add coaching notes |
| Rep | Only their own calls and scores, coaching export | View feedback, drill into deals/calls, listen to audio coaching |
| Enablement | Rubric analytics, pillar weight config | Configure coaching rubric, analyze rubric effectiveness |
| RevOps | MEDDPICC config, segment tags, eligibility rules | Configure process requirements, manage segments |
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
  - Average composite score (and trend sparkline)
  - Score distribution histogram
  - Top 5 and bottom 5 reps by composite score
  - **Pillar heatmap**: 3-column heatmap (P1/P2/P3) × reps, color-coded by band (red=Developing, yellow=Proficient, green=Elite)
  - Number of deals evaluated, calls reviewed
  - **Segment strategy dashboard**: Performance breakdown by segment (SMB/MM/Enterprise) with pillar averages
- Filterable by time period (week, month, quarter, custom range).
- Filterable by segment (SMB, Mid-Market, Enterprise).
- Groupable by director.

### REQ-UI-003: Director / Manager View
- Same structure as Org Overview but scoped to the subtree of the selected director or manager.
- Shows comparison cards for each direct report.
- Each card shows: name, role, average composite score, trend (up/down/flat), number of deals, scoring band.
- **Director cross-team heatmap**: Pillar scores across all managers' teams for cross-team comparison.
- **Manager coaching notes**: Managers can add free-text coaching notes per rep, visible in the rep's view.
- **Team leaderboard**: Ranked list of reps by composite score with sparklines.
- **Call volume vs. score scatter plot**: Bubble chart showing reps by call volume (x) vs. composite score (y), bubble size = deal count.

### REQ-UI-004: Rep View
- Shows the selected rep's evaluation history.
- **Score trend chart**: line chart of composite score over time (weekly or monthly buckets) with pillar overlay lines.
- **Pillar breakdown**: bar chart showing average for each pillar (P1, P2, P3) with scoring band colors.
- **Recent deals**: list of recent deal evaluations, sorted by date, showing composite score, band, and status.
- **Strengths & Improvement areas**: aggregated across recent evaluations.
- **Coaching export view**: Structured 5-section coaching document (see PRD-05 REQ-FW-008):
  1. Header (rep name, segment, period, manager)
  2. Score summary with verdict and band
  3. Progress trend (current vs. prior periods)
  4. Per-pillar breakdown with evidence quotes
  5. Next Call Playbook (three focus areas)
- **Audio player**: TTS-narrated coaching summary with section navigation and speed control (0.8x–1.5x).
- **Manager coaching notes**: Read-only view of notes from their manager.
- Filterable by topic (Gong auto-tags) and tenure band.

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
  - Line chart of composite score over time
  - Ability to overlay pillar-specific scores (P1, P2, P3)
  - Comparison lines (e.g., team average vs. individual, segment average)
  - Score distribution histogram showing band breakdown over time
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
/director/:id             — Director aggregate + cross-team heatmap
/manager/:id              — Manager aggregate + team leaderboard + scatter plot
/rep/:id                  — Rep detail + coaching export + audio player
/deal/:id                 — Deal evaluation detail + MEDDPICC status
/call/:id                 — Single call detail
/settings/prompt          — Prompt editor
/settings/team            — Team management
/settings/segments        — Segment configuration (RevOps)
/settings/pillars         — Pillar weight configuration (Enablement)
/settings/plays           — Priority play configuration (Sales Leadership)
/settings/meddpicc        — MEDDPICC stage requirements (RevOps)
/settings/sync            — Sync status and triggers
/analytics/rubric         — Rubric effectiveness analytics (Enablement)
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
- [ ] Org overview displays correct aggregate scores with pillar heatmap
- [ ] Drill-down from org → director → manager → rep → deal → call works
- [ ] Weekly and monthly toggle changes chart bucketing
- [ ] Date range picker filters all data
- [ ] Segment filter works on all aggregate views
- [ ] Trend charts render with correct data points and pillar overlays
- [ ] Pillar heatmap correctly color-codes by scoring band
- [ ] Call volume vs. score scatter plot renders correctly
- [ ] Team leaderboard shows ranked reps with sparklines
- [ ] Coaching export page renders the 5-section structured document
- [ ] Audio player plays TTS coaching with section navigation and speed control
- [ ] Manager coaching notes field allows adding/editing notes per rep
- [ ] Director cross-team heatmap shows pillar scores across teams
- [ ] VP segment strategy dashboard shows per-segment performance
- [ ] Prompt editor allows editing and saves new versions
- [ ] Role-based visibility is enforced (rep sees only own data)
- [ ] Enablement and RevOps settings pages are accessible by correct roles
- [ ] Pages load under 2 seconds
- [ ] Breadcrumb navigation works at all levels
- [ ] Top/bottom rep lists are accurate
