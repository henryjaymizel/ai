'use client';
import { useState } from 'react';
import Breadcrumbs from '../../../components/Breadcrumbs';

const DEFAULT_SEGMENTS = [
  {
    id: 'smb', name: 'SMB', pillar_weights: { p1: 0.45, p2: 0.30, p3: 0.25 },
    min_duration: 300, call_types: ['discovery', 'demo'],
    priority_plays: ['Pitch Dialer', 'Pitch Inbound', 'Single-Call Close', 'Sequence Adoption'],
  },
  {
    id: 'mid_market', name: 'Mid-Market', pillar_weights: { p1: 0.35, p2: 0.40, p3: 0.25 },
    min_duration: 300, call_types: ['discovery', 'demo', 'qbr'],
    priority_plays: ['Multi-Thread', 'Executive Alignment', 'ROI Framework'],
  },
  {
    id: 'enterprise', name: 'Enterprise', pillar_weights: { p1: 0.30, p2: 0.35, p3: 0.35 },
    min_duration: 600, call_types: ['discovery', 'demo', 'qbr', 'retention'],
    priority_plays: ['Multi-Thread', 'MEDDPICC Adherence', 'Executive Sponsor', 'Competitive Trap'],
  },
];

export default function SegmentConfig() {
  const [segments, setSegments] = useState(DEFAULT_SEGMENTS);
  const [saved, setSaved] = useState(false);

  function updateWeight(segIdx, pillar, value) {
    const updated = [...segments];
    updated[segIdx] = { ...updated[segIdx], pillar_weights: { ...updated[segIdx].pillar_weights, [pillar]: parseFloat(value) || 0 } };
    setSegments(updated);
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[
        { label: 'Org Overview', href: '/' },
        { label: 'Settings' },
        { label: 'Segment Configuration' },
      ]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Segment Configuration</h1>
          <p className="text-sm text-gray-500">Configure pillar weights, eligibility rules, and priority plays per segment</p>
        </div>
        <button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }} className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm hover:bg-brand-700">
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {segments.map((seg, sIdx) => (
        <div key={seg.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
          <h3 className="text-lg font-semibold">{seg.name}</h3>

          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Pillar Weights</h4>
            <div className="grid grid-cols-3 gap-4">
              {['p1', 'p2', 'p3'].map(p => (
                <div key={p}>
                  <label className="text-xs text-gray-500">{p === 'p1' ? 'GTM Workflow' : p === 'p2' ? 'System Mapping' : 'Solution Mapping'}</label>
                  <input
                    type="number" step="0.05" min="0" max="1"
                    className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
                    value={seg.pillar_weights[p]}
                    onChange={e => updateWeight(sIdx, p, e.target.value)}
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Sum: {(seg.pillar_weights.p1 + seg.pillar_weights.p2 + seg.pillar_weights.p3).toFixed(2)}
              {Math.abs(seg.pillar_weights.p1 + seg.pillar_weights.p2 + seg.pillar_weights.p3 - 1.0) > 0.01 && (
                <span className="text-red-500 ml-2">Weights must sum to 1.0</span>
              )}
            </p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Eligibility Rules</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">Min Duration (seconds)</label>
                <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm mt-1" value={seg.min_duration} readOnly />
              </div>
              <div>
                <label className="text-xs text-gray-500">Call Types</label>
                <input type="text" className="w-full border rounded-lg px-3 py-2 text-sm mt-1" value={seg.call_types.join(', ')} readOnly />
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Priority Plays</h4>
            <div className="flex flex-wrap gap-2">
              {seg.priority_plays.map((play, i) => (
                <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">{play}</span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
