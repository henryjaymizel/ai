# PRD 01: Team Roles and Grouping

## Overview
Define the organizational hierarchy for the sales team reporting to Max Angell. The system must ingest team structure from Glean and Notion, maintain reporting lines, and allow filtering at every level of the hierarchy.

## Goals
- Accurately represent the sales org chart from VP down to individual contributor
- Enable filtering and aggregation at any level (team, director, manager, rep)
- Stay in sync with source-of-truth systems (Glean, Notion)

## Data Sources
| Source | Data | Sync Frequency |
|--------|------|----------------|
| Glean | Employee directory, reporting lines, titles | Daily |
| Notion | Team rosters, role definitions, territories | Daily |

## Hierarchy Model

```
VP Sales (Max Angell)
  |
  +-- Director(s)
        |
        +-- Manager(s)
              |
              +-- Sales Rep(s) (AE, SDR, etc.)
```

## Requirements

### REQ-TEAM-001: Org Ingestion
- The system SHALL ingest the full reporting tree under Max Angell from Glean and/or Notion.
- The system SHALL resolve conflicts between Glean and Notion by treating Glean as the primary source for reporting lines and Notion as the primary source for role metadata.

### REQ-TEAM-002: Role Classification
- Every person in the tree SHALL have exactly one of the following roles:
  - `vp` — Vice President (Max Angell)
  - `director` — Director-level reports to VP
  - `manager` — Manager-level reports to Director
  - `ae` — Account Executive
  - `sdr` — Sales Development Rep
  - `se` — Sales Engineer
  - `other` — Any other IC role within the sales org
- Role SHALL be derived from title in Glean, overridable via Notion.

### REQ-TEAM-003: Reporting Lines
- The system SHALL maintain `reports_to` relationships for every person.
- `reports_to` MUST form a directed acyclic tree rooted at Max Angell.
- The system SHALL support querying all transitive reports for any person.

### REQ-TEAM-004: Filtering
- The API SHALL support filtering the team by:
  - `role` (e.g., all AEs)
  - `manager_id` (direct reports of a given manager)
  - `subtree_of` (all transitive reports of a given person)
  - `name` (partial match)
- Filters MUST be composable (AND logic).

### REQ-TEAM-005: Team Groups
- Managers and Directors MAY define named "teams" (e.g., "Enterprise West").
- A team is simply a label applied to a subtree or explicit member list.
- Teams SHALL be stored in Notion and synced.

### REQ-TEAM-006: Data Freshness
- Org data SHALL be refreshed at least once daily.
- The UI SHALL display the `last_synced_at` timestamp.

### REQ-TEAM-007: API Contract
The team service SHALL expose:
```
GET  /api/team/tree          — full org tree
GET  /api/team/members       — flat list with filters
GET  /api/team/member/:id    — single member detail
POST /api/team/sync          — trigger manual sync
```

## Data Model

```
TeamMember {
  id: string (UUID)
  name: string
  email: string
  role: enum (vp | director | manager | ae | sdr | se | other)
  title: string  // raw title from Glean
  reports_to: string | null  // id of manager
  team_label: string | null
  glean_id: string
  notion_id: string | null
  last_synced_at: datetime
}
```

## Acceptance Criteria
- [ ] Full org tree under Max Angell is importable and renders correctly
- [ ] Filtering by role, manager, subtree all return correct results
- [ ] Reporting line integrity: no cycles, single root
- [ ] Sync from Glean/Notion succeeds and updates `last_synced_at`
- [ ] Team labels are assignable and queryable
