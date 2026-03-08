'use client';
import { useState } from 'react';
import Breadcrumbs from '../../../components/Breadcrumbs';

const DEFAULT_PLAYS = {
  smb: [
    { name: 'Pitch Dialer', keywords: ['dialer', 'power dialer', 'click-to-dial'], pillar: 'P1' },
    { name: 'Pitch Inbound', keywords: ['inbound', 'inbound router', 'lead routing'], pillar: 'P1' },
    { name: 'Single-Call Close', keywords: ['close', 'sign', 'contract', 'next steps'], pillar: 'P3' },
    { name: 'Sequence Adoption', keywords: ['sequence', 'cadence', 'automation', 'workflow'], pillar: 'P1' },
  ],
  mid_market: [
    { name: 'Multi-Thread', keywords: ['other stakeholders', 'decision maker', 'executive'], pillar: 'P2' },
    { name: 'Executive Alignment', keywords: ['VP', 'C-level', 'executive sponsor'], pillar: 'P2' },
    { name: 'ROI Framework', keywords: ['ROI', 'return', 'savings', 'payback'], pillar: 'P3' },
  ],
  enterprise: [
    { name: 'Multi-Thread', keywords: ['other stakeholders', 'decision maker', 'executive'], pillar: 'P2' },
    { name: 'MEDDPICC Adherence', keywords: ['metrics', 'economic buyer', 'decision criteria'], pillar: 'P2' },
    { name: 'Executive Sponsor', keywords: ['executive sponsor', 'champion', 'internal advocate'], pillar: 'P2' },
    { name: 'Competitive Trap', keywords: ['competitor', 'alternative', 'comparison'], pillar: 'P3' },
  ],
};

export default function PlaysConfig() {
  const [plays] = useState(DEFAULT_PLAYS);
  const segments = ['smb', 'mid_market', 'enterprise'];
  const labels = { smb: 'SMB', mid_market: 'Mid-Market', enterprise: 'Enterprise' };

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[
        { label: 'Org Overview', href: '/' },
        { label: 'Settings' },
        { label: 'Priority Plays' },
      ]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Priority Play Configuration</h1>
          <p className="text-sm text-gray-500">Define priority plays per segment — Managed by Sales Leadership</p>
        </div>
      </div>

      {segments.map(seg => (
        <div key={seg} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-lg font-semibold mb-3">{labels[seg]}</h3>
          <div className="space-y-3">
            {plays[seg].map((play, i) => (
              <div key={i} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{play.name}</span>
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-semibold">{play.pillar}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {play.keywords.map((kw, j) => (
                    <span key={j} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{kw}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
