# PRD 02: Call Transcript Collection & Evaluation

## Overview
Ingest sales call transcripts from Gong, group them by customer/deal, evaluate them using an editable AI prompt, and produce both numeric scores and qualitative feedback. Enrich evaluation context with deal dimensions (seats, ARR) and validate against external sources (Apollo, web).

## Goals
- Pull all relevant call recordings and transcripts from Gong
- Group calls by deal/customer so an entire deal arc is evaluated holistically
- Score calls numerically AND qualitatively via an LLM prompt editable in the UI
- Cross-reference deal sizing against external data

## Data Sources
| Source | Data | Purpose |
|--------|------|---------|
| Gong | Call recordings, transcripts, participants, CRM links | Primary call data |
| CRM (via Gong) | Deal name, stage, ARR, seat count, account | Deal context |
| Apollo | Company employee count, headcount by dept, revenue | Validate deal sizing |
| Web (enrichment) | Company info, recent news, hiring signals | Additional context |

## Requirements

### REQ-CALL-001: Gong Ingestion
- The system SHALL pull calls via the Gong API on a configurable schedule (default: every 6 hours).
- For each call, the system SHALL store:
  - Transcript (speaker-labeled)
  - Duration, date, participants
  - Gong call ID
  - Linked CRM opportunity/deal ID
- The system SHALL support filtering calls to only those involving sales team members (from PRD-01).

### REQ-CALL-002: Deal Grouping
- Calls SHALL be grouped by CRM deal/opportunity.
- If no CRM link exists, calls SHALL be grouped by account (company name or domain).
- A "deal review" evaluates ALL calls in a deal group together, NOT each call in isolation.
- The evaluation prompt receives the full ordered sequence of transcripts for the deal.

### REQ-CALL-003: Deal Dimensions
- For each deal group, the system SHALL collect and present:
  - **ARR** (annual recurring revenue)
  - **Seat count** (number of licenses)
  - **Deal stage** (from CRM)
  - **Account name and domain**
  - **Company size** (from Apollo: total employees, sales team headcount)
  - **Industry** (from Apollo)
  - **Revenue** (from Apollo)
- These dimensions are passed to the evaluation prompt as context.

### REQ-CALL-004: External Validation
- The system SHALL enrich each deal with Apollo data for the account.
- The evaluation prompt SHALL explicitly be asked to assess:
  - **Deal sizing accuracy**: Is the quoted seat count / ARR reasonable given the company's size? (e.g., if they have 200 sales reps, are we selling to all of them or just a team?)
  - **Competitive positioning**: Based on web/Apollo signals, are there competitive threats?
  - **Sales process quality**: Did we follow MEDDPICC or equivalent? Did we multi-thread? Did we address key stakeholders?

### REQ-CALL-005: Evaluation Prompt (Editable)
- The evaluation prompt SHALL be stored as a configurable text template in the database.
- The prompt SHALL be editable directly in the UI by admins and managers.
- The prompt receives these variables:
  - `{{transcripts}}` — ordered call transcripts for the deal
  - `{{deal_dimensions}}` — ARR, seats, stage, etc.
  - `{{company_context}}` — Apollo enrichment data
  - `{{rep_name}}`, `{{manager_name}}`
  - `{{scoring_criteria}}` — the criteria definitions
- Default prompt template SHALL cover:
  1. Discovery quality
  2. Objection handling
  3. Next steps / follow-up commitment
  4. Multi-threading / stakeholder engagement
  5. Value articulation
  6. Deal sizing appropriateness
  7. Sales process adherence
  8. Overall effectiveness

### REQ-CALL-006: Scoring
- Each deal evaluation SHALL produce:
  - **Numeric scores** (1-10) for each criterion defined in the prompt
  - **Overall score** (weighted average, weights configurable)
  - **Qualitative summary** (2-3 paragraph narrative)
  - **Strengths** (bulleted list)
  - **Areas for improvement** (bulleted list with specific, actionable recommendations)
  - **Key moments** (timestamps + quotes from transcripts that were notable)
- Scores SHALL be stored historically so trends can be tracked.

### REQ-CALL-007: Single-Call Drill-Down
- Although evaluation happens at deal level, the UI SHALL allow drilling into individual calls.
- Each call within a deal SHALL have:
  - Its own sub-scores (derived from the deal evaluation)
  - Notable moments specific to that call
  - Duration, date, participants, Gong link

### REQ-CALL-008: Re-evaluation
- When the prompt is edited, existing evaluations are NOT automatically re-run.
- Admins SHALL be able to trigger re-evaluation for specific deals or date ranges.
- Re-evaluation SHALL store a new version, keeping the old score for comparison.

### REQ-CALL-009: API Contract
```
GET    /api/calls                     — list calls (filters: rep, date, deal)
GET    /api/calls/:id                 — single call detail
GET    /api/deals                     — list deal groups
GET    /api/deals/:id                 — deal detail with all calls + evaluation
POST   /api/deals/:id/evaluate        — trigger evaluation for a deal
GET    /api/evaluations               — list evaluations (filters: rep, date, score range)
GET    /api/evaluations/:id           — single evaluation detail
GET    /api/prompt                    — get current prompt template
PUT    /api/prompt                    — update prompt template
POST   /api/evaluations/re-evaluate   — bulk re-evaluate
POST   /api/sync/gong                 — trigger Gong sync
```

## Data Model

```
Call {
  id: string
  gong_call_id: string
  date: datetime
  duration_seconds: int
  participants: Participant[]
  transcript: TranscriptSegment[]
  deal_id: string | null
  account_id: string
  rep_id: string  // FK to TeamMember
}

DealGroup {
  id: string
  crm_deal_id: string | null
  account_name: string
  account_domain: string
  arr: number | null
  seat_count: int | null
  deal_stage: string | null
  calls: Call[]
  company_context: CompanyContext
}

CompanyContext {
  apollo_company_id: string
  total_employees: int
  sales_headcount: int | null
  industry: string
  revenue: number | null
  enriched_at: datetime
}

Evaluation {
  id: string
  deal_id: string
  prompt_version: int
  scores: { [criterion: string]: number }  // 1-10
  overall_score: number
  qualitative_summary: string
  strengths: string[]
  improvements: string[]
  key_moments: KeyMoment[]
  evaluated_at: datetime
  evaluated_by_prompt_hash: string
}

KeyMoment {
  call_id: string
  timestamp_seconds: int
  quote: string
  category: string  // e.g., "strong_discovery", "missed_objection"
}

PromptTemplate {
  id: string
  version: int
  template: string
  scoring_criteria: ScoringCriterion[]
  updated_by: string
  updated_at: datetime
}

ScoringCriterion {
  name: string
  description: string
  weight: number  // 0-1, all weights sum to 1
}
```

## Acceptance Criteria
- [ ] Gong calls are ingested and associated with the correct sales rep
- [ ] Calls are grouped by deal; orphan calls are grouped by account
- [ ] Deal dimensions (ARR, seats, stage) are populated from CRM
- [ ] Apollo enrichment runs for each account and data is stored
- [ ] Evaluation prompt is editable in the UI and changes are versioned
- [ ] Evaluations produce numeric scores (1-10) for each criterion
- [ ] Evaluations produce qualitative narrative with strengths/improvements
- [ ] Deal sizing is validated against Apollo data (e.g., "company has 200 reps, deal covers 50 seats")
- [ ] Sales process quality is assessed (MEDDPICC, multi-threading, etc.)
- [ ] Re-evaluation works and preserves history
- [ ] Individual calls are drillable within a deal evaluation
