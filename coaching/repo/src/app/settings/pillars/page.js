'use client';
import { useState } from 'react';
import Breadcrumbs from '../../../components/Breadcrumbs';

const PILLAR_DEFS = [
  {
    key: 'gtm_workflow_mastery', name: 'P1: GTM Workflow Mastery',
    description: 'Did the rep pitch/demonstrate Apollo products?',
    sub_criteria: ['Dialer proficiency', 'Inbound Router usage', 'Sequence design', 'AI Assist integration', 'Enrichment/data quality positioning'],
  },
  {
    key: 'system_mapping', name: 'P2: System Mapping',
    description: 'Did the rep map the prospect\'s tech stack, workflows, and organizational structure?',
    sub_criteria: ['Tech stack discovery', 'Workflow documentation', 'Org chart mapping', 'Integration landscape', 'Data flow understanding'],
  },
  {
    key: 'solution_mapping', name: 'P3: Solution Mapping',
    description: 'Did the rep connect Apollo capabilities to identified pain points with business impact?',
    sub_criteria: ['Pain point articulation', 'Solution alignment', 'Business impact quantification', 'ROI framing', 'Competitive differentiation'],
  },
];

export default function PillarConfig() {
  const [pillars] = useState(PILLAR_DEFS);

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[
        { label: 'Org Overview', href: '/' },
        { label: 'Settings' },
        { label: 'Pillar Configuration' },
      ]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pillar Configuration</h1>
          <p className="text-sm text-gray-500">Three-Pillar Coaching Framework — Managed by Enablement</p>
        </div>
      </div>

      {pillars.map(pillar => (
        <div key={pillar.key} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-lg font-semibold mb-1">{pillar.name}</h3>
          <p className="text-sm text-gray-500 mb-4">{pillar.description}</p>

          <h4 className="text-sm font-medium text-gray-500 mb-2">Sub-Criteria</h4>
          <div className="space-y-2">
            {pillar.sub_criteria.map((sc, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                <input
                  type="text"
                  className="flex-1 bg-transparent text-sm font-medium focus:outline-none"
                  defaultValue={sc}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
