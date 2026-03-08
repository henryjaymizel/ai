# PRD 05: Coaching Framework & Three-Pillar Methodology

## Overview
The coaching agent evaluates every eligible call against three core pillars drawn from the Force Management methodology. Each pillar is scored on a 0–10 scale with three performance bands. No score is generated without a supporting quote from the actual transcript. The agent writes and speaks as an elite sales leader — direct, specific, respectful, and uncompromising on standards.

## The Three Pillars

### Pillar 1: GTM Workflow Mastery
**Question**: Does the rep demonstrate deep fluency in Apollo's go-to-market workflows, sequences, and product capabilities as they apply to the customer's specific use case?

**Evaluates**: Ability to connect Apollo features to the customer's workflow; fluency in product positioning; confidence navigating objections with product-grounded responses.

| Band | Score | Description |
|------|-------|-------------|
| Developing | 0–3 | Limited product fluency, generic feature walk |
| Proficient | 4–6 | Connects features to use case, handles common objections |
| Elite | 7–10 | Guides the customer through a tailored workflow, anticipates questions, positions with precision |

### Pillar 2: System Mapping
**Question**: Does the rep accurately identify the customer's current tech stack, process gaps, and workflow inefficiencies — and connect these to Apollo's solution architecture?

**Evaluates**: Discovery quality; ability to map the customer's existing tools and process gaps; linking pain points to Apollo's differentiated capabilities.

| Band | Score | Description |
|------|-------|-------------|
| Developing | 0–3 | Skips discovery, assumes pain |
| Proficient | 4–6 | Asks discovery questions, maps the basic stack |
| Elite | 7–10 | Builds a complete picture of the customer's environment and connects specific gaps to Apollo's solution |

### Pillar 3: Solution Mapping
**Question**: Does the rep articulate clear, measurable business outcomes — and build a compelling case for change that connects Apollo's value to the customer's specific pain?

**Evaluates**: Ability to quantify value and ROI; business case construction; urgency creation; alignment of Apollo's solution to the customer's strategic priorities.

| Band | Score | Description |
|------|-------|-------------|
| Developing | 0–3 | Focuses on features, not outcomes |
| Proficient | 4–6 | Ties product to business goal with some ROI framing |
| Elite | 7–10 | Builds a full business case with quantified outcomes, clear urgency, and a compelling change narrative |

## Requirements

### REQ-FW-001: Pillar Rubric Storage
- The system SHALL store pillar rubric definitions (name, description, scoring bands, band thresholds) in the database.
- Rubrics SHALL be editable by Product and Sales Leadership roles via the admin UI.
- Rubric changes SHALL be versioned so evaluations reference the rubric version they were scored against.

### REQ-FW-002: Three-Pillar Scoring
- Every evaluation SHALL produce a score (0–10) for each of the three pillars.
- Every pillar score SHALL be accompanied by a band label: Developing (0–3), Proficient (4–6), Elite (7–10).
- Every pillar score SHALL be paired with at least one direct transcript quote that grounds the score rationale.
- No pillar SHALL receive a score without a supporting quote from the actual transcript.

### REQ-FW-003: Composite Score
- A composite score (0–10) SHALL be calculated as a weighted average of the three pillar scores.
- Pillar weights SHALL be configurable per segment (see PRD-07 Role-Based Configuration):
  - SMB default: P1 45%, P2 30%, P3 25%
  - Mid-Market default: P1 35%, P2 40%, P3 25%
  - Enterprise default: P1 30%, P2 35%, P3 35%
- The composite score SHALL also be expressed on a 0–100 scale (score × 10) for display contexts that require it.

### REQ-FW-004: Coaching Voice & Tone
- The evaluation prompt SHALL instruct the LLM to write as an elite sales leader.
- Feedback SHALL be:
  - **Grounded**: tied to specific quotes and moments from the transcript
  - **Structured**: scored consistently against the three-pillar rubric
  - **Actionable**: every observation comes with a specific, concrete next step (not a suggestion)
  - **Specific**: names the exact behavior, explains the impact, prescribes the correction
- The agent SHALL NOT produce generic feedback (e.g., "work on your close"). All feedback must reference actual call moments.

### REQ-FW-005: Coaching Export Structure
Each evaluation SHALL produce a structured coaching export containing:

1. **Call Header**: rep name, account, call date, type, duration, topic classification
2. **Overall Score & Verdict**: composite score (0–10), band label, 2–3 sentence verdict
3. **Rep Progress Trend**: pillar scores across the last 6 coaching sessions, with delta indicators
4. **Per-Pillar Breakdown** (for each pillar):
   - Score (0–10) with band label
   - Direct transcript quote grounding the score
   - Coaching points using traffic-light system (strong / opportunity / critical gap)
   - Single action box specifying exact behavior change
5. **Next Call Playbook**: three specific focus areas as direct imperatives, each tied to a pillar

### REQ-FW-006: Next Call Playbook
- Every coaching export SHALL close with a Next Call Playbook.
- The playbook SHALL contain exactly three focus areas.
- Each focus area SHALL be:
  - Written as a direct imperative (not a suggestion)
  - Tied to a specific pillar
  - Prescribing the exact behavior the rep should exhibit on their next call
- Example: "On your next call, open by confirming the Economic Buyer before minute 5. Use: 'Who ultimately signs off on a decision like this?'"

### REQ-FW-007: Transcript-Grounded Evidence
- Every coaching observation and score rationale SHALL be anchored to a direct quote from the call.
- Quotes SHALL include the approximate timestamp (minute:second) so reps know exactly which moment is referenced.
- The system SHALL surface these as "Key Moments" linked to Gong playback.

### REQ-FW-008: Progress Tracking
- Pillar scores SHALL be stored across all coaching sessions per rep.
- Each coaching export SHALL include a visual trend of the rep's pillar scores across the last 6 sessions.
- Trend data SHALL include:
  - Per-pillar score history
  - Delta indicators (improvement/decline vs. prior session)
  - Overall average, strongest pillar, current focus area, call count

## Data Model

```
PillarRubric {
  id: string
  version: int
  pillars: Pillar[]
  updated_by: string
  updated_at: datetime
}

Pillar {
  key: string             // "gtm_workflow_mastery", "system_mapping", "solution_mapping"
  name: string
  question: string        // The evaluation question
  evaluates: string       // What it evaluates
  bands: ScoringBand[]
  weight_default: number  // Default weight (overridable per segment)
}

ScoringBand {
  label: string           // "Developing", "Proficient", "Elite"
  min_score: number       // 0, 4, 7
  max_score: number       // 3, 6, 10
  description: string
}

PillarScore {
  pillar_key: string
  score: number           // 0-10
  band: string            // "Developing" | "Proficient" | "Elite"
  evidence_quote: string  // Direct transcript quote
  evidence_timestamp: int // Seconds into the call
  coaching_points: CoachingPoint[]
  action_item: string     // Single specific behavior change
}

CoachingPoint {
  signal: string          // "strong" | "opportunity" | "critical_gap"
  observation: string
  transcript_quote: string | null
  timestamp_seconds: int | null
}

NextCallPlaybook {
  focus_areas: PlaybookItem[]
}

PlaybookItem {
  pillar_key: string
  imperative: string      // Direct instruction, not suggestion
  context: string         // Why this matters for the next call
}

CoachingExport {
  id: string
  evaluation_id: string
  call_id: string
  rep_id: string
  call_header: CallHeader
  composite_score: number
  composite_band: string
  verdict: string         // 2-3 sentence summary
  pillar_scores: PillarScore[]
  progress_trend: ProgressTrend
  playbook: NextCallPlaybook
  generated_at: datetime
  rubric_version: int
}
```

## Acceptance Criteria
- [ ] Three-pillar rubric is stored and version-controlled
- [ ] Every evaluation produces scores for all three pillars
- [ ] Every pillar score has a band label (Developing/Proficient/Elite)
- [ ] Every pillar score is grounded in at least one transcript quote with timestamp
- [ ] Composite score is calculated with configurable per-segment weights
- [ ] Coaching export contains all 5 sections (header, score, trend, per-pillar, playbook)
- [ ] Next Call Playbook contains exactly 3 imperative focus areas tied to pillars
- [ ] Coaching voice is specific and grounded — no generic feedback passes validation
- [ ] Progress trend shows last 6 sessions with delta indicators
- [ ] Rubric edits are versioned and auditable
