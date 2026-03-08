'use client';
import { useState } from 'react';
import Breadcrumbs from '../../../components/Breadcrumbs';

const DEFAULT_PROMPT = `You are evaluating a sales deal based on call transcripts.

## Context
- Rep: {{rep_name}}
- Manager: {{manager_name}}
- Segment: {{segment}}
- Deal Dimensions: {{deal_dimensions}}
- Company Context: {{company_context}}

## Scoring Framework: Three Pillars

Using the following pillar weights: {{pillar_weights}}

### Pillar 1 — GTM Workflow Mastery ({{pillar_weights.p1}})
Did the rep pitch/demonstrate Apollo products? (Dialer, Inbound, Sequences, AI Assist, Enrichment)

### Pillar 2 — System Mapping ({{pillar_weights.p2}})
Did the rep map the prospect's tech stack, workflows, and organizational structure?

### Pillar 3 — Solution Mapping ({{pillar_weights.p3}})
Did the rep connect Apollo capabilities to identified pain points with business impact?

## Priority Plays
Check for the following priority plays: {{priority_plays}}

## MEDDPICC Requirements
At the current stage, the following fields should be addressed: {{meddpicc_requirements}}

## Transcripts
{{transcripts}}

## Instructions
1. Score each pillar 0-10 with transcript evidence
2. Compute composite score using pillar weights
3. Assign scoring band: Developing (0-3), Proficient (4-6), Elite (7-10)
4. List strengths and improvements with specific examples
5. Create Next Call Playbook with 3 imperative focus areas
6. Check priority play compliance`;

const VARIABLES = [
  '{{transcripts}}', '{{deal_dimensions}}', '{{company_context}}',
  '{{rep_name}}', '{{manager_name}}', '{{segment}}',
  '{{pillar_weights}}', '{{priority_plays}}', '{{meddpicc_requirements}}',
  '{{scoring_criteria}}',
];

export default function PromptEditor() {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [version, setVersion] = useState(1);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setVersion(v => v + 1);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[
        { label: 'Org Overview', href: '/' },
        { label: 'Settings' },
        { label: 'Prompt Editor' },
      ]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Evaluation Prompt Editor</h1>
          <p className="text-sm text-gray-500">Version {version} — Editable by admins and managers</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleSave} className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm hover:bg-brand-700">
            {saved ? 'Saved!' : 'Save New Version'}
          </button>
          <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
            Re-evaluate Deals
          </button>
        </div>
      </div>

      {/* Template Variables */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-sm font-medium text-gray-500 mb-2">Available Variables</h3>
        <div className="flex flex-wrap gap-2">
          {VARIABLES.map(v => (
            <button
              key={v}
              onClick={() => {
                const el = document.getElementById('prompt-editor');
                if (el) {
                  const start = el.selectionStart;
                  const newPrompt = prompt.slice(0, start) + v + prompt.slice(start);
                  setPrompt(newPrompt);
                }
              }}
              className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-mono hover:bg-blue-100"
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <textarea
          id="prompt-editor"
          className="w-full h-[500px] font-mono text-sm border rounded-lg p-4 resize-none focus:ring-2 focus:ring-brand-500 focus:outline-none"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          spellCheck={false}
        />
      </div>
    </div>
  );
}
