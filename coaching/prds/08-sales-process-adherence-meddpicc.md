# PRD 08: Sales Process Adherence & MEDDPICC

## Overview
Coaching is only effective when it is grounded in the actual sales process being run. This PRD defines how the AI Coaching Agent evaluates process adherence — specifically MEDDPICC qualification rigor and Salesforce (SFDC) hygiene — at each stage of the pipeline. The agent cross-references Gong call data with SFDC field completeness to ensure reps are both executing well on calls AND maintaining accurate CRM records.

## Stage-by-Stage Coaching Focus

| Stage | Coaching Focus | MEDDPICC Fields Required | SFDC Hygiene Checks |
|-------|---------------|-------------------------|---------------------|
| Stage 0 (Prospecting) | Outreach quality, research depth, ICP fit | None | Lead source populated, ICP fit field tagged |
| Stage 1 (Discovery) | Pain identification, qualification depth, multi-threading started | M + I | Next steps populated, close date realistic, amount entered |
| Stage 2 (Scoping) | Champion development, decision criteria mapped, technical validation | M + E + D + I + C | Champion contact linked, decision criteria notes, technical requirements captured |
| Stage 3 (Proposal) | Exec alignment, mutual action plan, competition addressed | All 7 fields | Mutual action plan attached, competition field populated, procurement contact identified |
| Stage 4 (Negotiation) | Legal/procurement navigation, risk mitigation, close plan | All 7 fields + validated | Legal contact linked, redlines tracked, close plan documented |
| Stage 5 (Closed Won/Lost) | Win/loss analysis, retrospective coaching | All 7 fields | Win/loss reason populated, retrospective notes, competitive intelligence captured |

## Requirements

### REQ-MED-001: MEDDPICC Field Tracking
- The agent SHALL track completion of all 7 MEDDPICC fields for every deal:
  - **M**etrics: Quantified business outcomes the prospect expects
  - **E**conomic Buyer: Identified decision-maker with budget authority
  - **D**ecision Criteria: Technical and business requirements for selection
  - **D**ecision Process: Steps, timeline, and stakeholders for purchase decision
  - **I**dentify Pain: Specific business challenges driving the initiative
  - **C**hampion: Internal advocate who is actively selling on your behalf
  - **C**ompetition: Known alternatives the prospect is evaluating
- Field completion SHALL be sourced from SFDC opportunity fields.
- The agent SHALL also infer MEDDPICC evidence from Gong transcripts (e.g., "The rep discussed metrics in the call but the SFDC Metrics field is empty").

### REQ-MED-002: Stage-Gate Validation
- At each deal stage, the agent SHALL validate that required MEDDPICC fields are complete per the stage-gate table above.
- Missing required fields at a given stage SHALL generate a coaching flag:
  - **Severity**: Warning if 1 field missing, Alert if 2+ fields missing
  - **Message**: Specific, actionable (e.g., "Deal is in Stage 2 but no Champion has been identified in SFDC. In the last call, [Rep] mentioned Sarah as a supporter — consider formalizing her as Champion.")
- Stage-gate requirements SHALL be configurable by RevOps (see PRD-07 REQ-CFG-004).

### REQ-MED-003: SFDC Hygiene Scoring
- The agent SHALL score SFDC hygiene for each deal on a 0-10 scale:
  - **Field completeness** (40%): Are required fields populated at the current stage?
  - **Data freshness** (20%): When were key fields last updated? Stale data (>14 days for active deals) is penalized.
  - **Accuracy** (20%): Does SFDC data match what was discussed on Gong calls? (e.g., close date mentioned on call vs. SFDC close date)
  - **Next steps** (20%): Is there a concrete next step with a date?
- Hygiene score SHALL be included in the overall evaluation as a component of the P2 (System Mapping) pillar.

### REQ-MED-004: Transcript-to-SFDC Cross-Reference
- For each scored call, the agent SHALL compare key topics discussed against SFDC field state:
  - If the rep discusses a metric/outcome on the call but the Metrics field is empty in SFDC → flag as "Discussed but not documented"
  - If the rep identifies a new stakeholder on the call but no corresponding contact is linked in SFDC → flag as "Contact gap"
  - If the rep mentions a timeline/close date that conflicts with the SFDC close date → flag as "Date mismatch"
  - If competition is mentioned on the call but the Competition field is empty → flag as "Competitive intelligence gap"
- Cross-reference findings SHALL be included in the coaching output with specific quotes from the transcript.

### REQ-MED-005: Pipeline Coaching
- The agent SHALL provide pipeline-level coaching tied to open opportunities:
  - **Stuck deals**: Flag deals that haven't advanced stage in >2x the average cycle time for their segment
  - **Stage skipping**: Alert when deals jump stages without completing prior MEDDPICC requirements
  - **Close date slippage**: Track deals where the close date has been pushed >2 times
  - **Single-threaded risk**: Flag deals where only 1 contact from the prospect org has been engaged (per Gong participant data)
  - **Coverage gaps**: For Mid-Market and Enterprise deals, flag if fewer than 3 contacts from the prospect org have been engaged
- Pipeline coaching SHALL be included in the Manager Daily Digest and Weekly Rollup (see PRD-06).

### REQ-MED-006: Champion Development Tracking
- The agent SHALL specifically track Champion development across calls:
  - Has a Champion been identified? (Named individual mentioned as advocate)
  - Has the Champion been tested? (Rep asked Champion to take an action, e.g., schedule an internal meeting, share materials)
  - Is the Champion active? (Champion mentioned taking actions on the rep's behalf in subsequent calls)
- Champion status SHALL be one of: Not Identified → Identified → Tested → Active
- Champion development progress SHALL be surfaced in the P2 (System Mapping) pillar score.

### REQ-MED-007: Competition Intelligence Coaching
- When competition is detected in a call transcript, the agent SHALL:
  - Identify the competitor(s) mentioned
  - Assess whether the rep positioned against the competitor effectively
  - Flag if the Competition field in SFDC is empty or incomplete
  - Include competitive positioning in the coaching recommendations
- Known competitors SHALL be configurable (list maintained by Sales Leadership).

### REQ-MED-008: Win/Loss Retrospective
- For Closed Won and Closed Lost deals, the agent SHALL generate a retrospective analysis:
  - **For Won deals**: What worked well? Which MEDDPICC elements were strongest? What can be replicated?
  - **For Lost deals**: Where did the process break down? Which MEDDPICC elements were weakest? What competitive factors contributed?
- Retrospectives SHALL be generated within 48 hours of deal closure.
- Retrospectives SHALL be shared with the rep and their manager.
- Aggregated win/loss patterns SHALL feed into the weekly team digest.

### REQ-MED-009: MEDDPICC Coaching Prompts
- The evaluation prompt SHALL include MEDDPICC-specific coaching guidance:
  - For each incomplete or weak MEDDPICC element, suggest specific questions the rep should ask in the next call
  - Reference the prospect's specific situation (not generic MEDDPICC questions)
  - Tie suggestions to the deal stage and segment
- Example: "For Discovery stage with SMB prospect: 'You identified pain around manual data entry, but haven't quantified it yet. In your next call, ask: What does manual data entry cost your team in hours per week? How does that translate to revenue impact?'"

### REQ-MED-010: Process Adherence Scoring
- Process adherence SHALL be scored as a composite:
  - MEDDPICC completion vs. stage requirements (40%)
  - SFDC hygiene score (30%)
  - Pipeline health indicators (20%)
  - Win/loss learning application (10%)
- This composite feeds into the overall coaching score alongside the three pillars (see PRD-05).
- Process adherence coaching is primarily surfaced in the EOD Recap and EOW Digest.

## Data Model

```
MEDDPICCStatus {
  deal_id: string
  stage: string
  metrics: FieldStatus
  economic_buyer: FieldStatus
  decision_criteria: FieldStatus
  decision_process: FieldStatus
  identify_pain: FieldStatus
  champion: FieldStatus
  competition: FieldStatus
  overall_completion: number        // 0-100%
  stage_gate_pass: boolean
  missing_fields: string[]
  evaluated_at: datetime
}

FieldStatus {
  sfdc_populated: boolean
  sfdc_last_updated: datetime | null
  discussed_in_calls: boolean
  last_discussed_at: datetime | null
  transcript_evidence: string | null  // quote from transcript
  gap_type: string | null            // "not_documented" | "contact_gap" | "date_mismatch" | "stale"
}

SFDCHygieneScore {
  deal_id: string
  field_completeness: number         // 0-10
  data_freshness: number             // 0-10
  accuracy: number                   // 0-10
  next_steps: number                 // 0-10
  composite: number                  // weighted 0-10
  flags: HygieneFlag[]
  scored_at: datetime
}

HygieneFlag {
  type: string                       // "missing_field" | "stale_data" | "mismatch" | "no_next_step"
  severity: string                   // "warning" | "alert"
  field: string
  message: string
  transcript_quote: string | null
}

PipelineHealth {
  deal_id: string
  stuck: boolean
  days_in_stage: number
  avg_days_for_segment: number
  stage_skipped: boolean
  close_date_pushes: number
  contacts_engaged: number
  single_threaded: boolean
  flags: string[]
  assessed_at: datetime
}

ChampionStatus {
  deal_id: string
  status: string                     // "not_identified" | "identified" | "tested" | "active"
  champion_name: string | null
  champion_contact_id: string | null
  evidence: ChampionEvidence[]
  last_assessed: datetime
}

ChampionEvidence {
  call_id: string
  date: datetime
  type: string                       // "mention" | "action_requested" | "action_taken"
  quote: string
}

WinLossRetrospective {
  deal_id: string
  outcome: string                    // "won" | "lost"
  closed_at: datetime
  generated_at: datetime
  strongest_meddpicc: string[]       // top MEDDPICC elements
  weakest_meddpicc: string[]
  competitive_factors: string[]
  process_breakdown_stage: string | null  // for losses: which stage had issues
  replicable_patterns: string[]           // for wins: what to repeat
  coaching_takeaways: string[]
  shared_with: string[]              // rep_id, manager_id
}
```

## Acceptance Criteria
- [ ] MEDDPICC fields are tracked per deal and sourced from SFDC
- [ ] Stage-gate validation fires for missing required fields at each stage
- [ ] SFDC hygiene is scored on a 0-10 scale with four components
- [ ] Transcript-to-SFDC cross-reference identifies gaps with specific quotes
- [ ] Pipeline coaching flags stuck deals, stage skips, date slippage, single-threading
- [ ] Champion development is tracked through four stages
- [ ] Competition intelligence is captured and coached
- [ ] Win/loss retrospectives are generated within 48 hours of deal closure
- [ ] MEDDPICC coaching prompts are specific to deal context, not generic
- [ ] Process adherence score is computed and integrated with overall coaching score
- [ ] All stage-gate and MEDDPICC requirements are configurable by RevOps
