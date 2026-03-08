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

### REQ-CALL-004a: Eligibility Filtering
- Not every call warrants coaching evaluation. The system SHALL filter calls by:
  - **Call type**: discovery, demo, QBR, retention (configurable list)
  - **Minimum duration**: configurable threshold (default: 5 minutes)
  - **Rep segment**: only reps in eligible segments
  - **Topic classification**: Gong auto-tags or custom classification
- Calls that do not meet criteria SHALL be skipped without analysis.
- Eligibility rules SHALL be configurable by Product / Sales Leadership (see PRD-07 REQ-CFG-010).

### REQ-CALL-005: Evaluation Prompt (Editable)
- The evaluation prompt SHALL be stored as a configurable text template in the database.
- The prompt SHALL be editable directly in the UI by admins and managers.
- The prompt receives these variables:
  - `{{transcripts}}` — ordered call transcripts for the deal
  - `{{deal_dimensions}}` — ARR, seats, stage, etc.
  - `{{company_context}}` — Apollo enrichment data
  - `{{rep_name}}`, `{{manager_name}}`
  - `{{segment}}` — rep's market segment (smb, mid_market, enterprise)
  - `{{pillar_weights}}` — segment-specific pillar weights
  - `{{priority_plays}}` — segment-specific priority plays to check
  - `{{meddpicc_requirements}}` — stage-specific required MEDDPICC fields
  - `{{scoring_criteria}}` — the three-pillar criteria definitions
- Default prompt template SHALL be structured around the **Three-Pillar Framework** (see PRD-05):
  1. **Pillar 1 — GTM Workflow Mastery**: Did the rep pitch/demonstrate Apollo products? (Dialer, Inbound, Sequences, AI Assist, Enrichment)
  2. **Pillar 2 — System Mapping**: Did the rep map the prospect's tech stack, workflows, and organizational structure?
  3. **Pillar 3 — Solution Mapping**: Did the rep connect Apollo capabilities to identified pain points with business impact?
- The prompt SHALL also check **Priority Plays** for the rep's segment (see PRD-07 REQ-CFG-002).
- The prompt SHALL check **MEDDPICC adherence** at the current deal stage (see PRD-08).

### REQ-CALL-006: Scoring
- Each deal evaluation SHALL produce:
  - **Pillar scores** (0-10) for each of the three pillars (GTM Workflow Mastery, System Mapping, Solution Mapping)
  - **Composite score** (0-10, weighted average using segment-specific pillar weights from PRD-07)
  - **Scoring bands**: Developing (0–3), Proficient (4–6), Elite (7–10)
  - **Verdict label**: Based on composite score band (e.g., "Proficient — strong system mapping, needs work on solution mapping")
  - **Qualitative summary** (2-3 paragraph narrative)
  - **Strengths** (bulleted list)
  - **Areas for improvement** (bulleted list with specific, actionable recommendations)
  - **Key moments** (timestamps + quotes from transcripts that were notable)
  - **Transcript-grounded evidence**: Every pillar score MUST include at least one supporting quote from the transcript with timestamp. No score shall be assigned without evidence.
  - **Next Call Playbook**: Three imperative-form focus areas (one per pillar), e.g., "Open with Dialer ROI proof point", "Map reporting chain above current contact", "Tie enrichment accuracy to pipeline conversion"
  - **Priority play compliance**: For each priority play defined for the rep's segment, report whether it was detected or missed (see PRD-07).
  - **Process adherence score**: MEDDPICC and SFDC hygiene score (see PRD-08).
- Scores SHALL be stored historically so trends can be tracked.
- Pillar weights SHALL vary by segment and be applied automatically (see PRD-07 REQ-CFG-003).

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
  pillar_scores: {
    gtm_workflow_mastery: PillarScore
    system_mapping: PillarScore
    solution_mapping: PillarScore
  }
  composite_score: number              // 0-10, weighted by segment pillar weights
  scoring_band: string                 // "developing" | "proficient" | "elite"
  verdict: string                      // human-readable band + explanation
  qualitative_summary: string
  strengths: string[]
  improvements: string[]
  key_moments: KeyMoment[]
  next_call_playbook: string[]         // 3 imperative focus areas
  priority_play_results: PriorityPlayResult[]
  process_adherence_score: number | null  // from PRD-08
  segment: string                      // smb | mid_market | enterprise
  pillar_weights_used: { p1: number, p2: number, p3: number }
  evaluated_at: datetime
  evaluated_by_prompt_hash: string
}

PillarScore {
  score: number                        // 0-10
  band: string                         // developing | proficient | elite
  evidence: TranscriptEvidence[]       // at least 1 required
  sub_criteria: { [name: string]: number }
}

TranscriptEvidence {
  call_id: string
  timestamp_seconds: int
  quote: string
  relevance: string                    // why this quote supports the score
}

PriorityPlayResult {
  play_name: string
  detected: boolean
  evidence: string | null              // quote if detected
  flag_message: string | null          // coaching message if not detected
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
- [ ] Evaluations produce pillar scores (0-10) for each of the three pillars
- [ ] Composite score uses segment-specific pillar weights
- [ ] Scoring bands (Developing/Proficient/Elite) are assigned correctly
- [ ] Every pillar score includes at least one transcript-grounded evidence quote
- [ ] Next Call Playbook contains three imperative focus areas
- [ ] Priority play compliance is checked per the rep's segment configuration
- [ ] Evaluations produce qualitative narrative with strengths/improvements
- [ ] Deal sizing is validated against Apollo data
- [ ] Sales process quality is assessed (MEDDPICC, multi-threading, etc.)
- [ ] Eligibility filter skips calls that don't meet criteria (type, duration, segment, topic)
- [ ] Re-evaluation works and preserves history
- [ ] Individual calls are drillable within a deal evaluation
