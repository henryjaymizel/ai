'use client';
import { formatScore, bandLabel, bandColor, pillarName, deltaArrow, deltaColor } from '../lib/utils';

export default function CoachingExport({ rep, scores, deals }) {
  const latest = scores?.[scores.length - 1];
  const prev = scores?.[scores.length - 2];
  if (!latest) return <div className="text-gray-400">No coaching data available</div>;

  const delta = prev ? Math.round((latest.composite - prev.composite) * 10) / 10 : 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
      <h3 className="text-sm font-medium text-gray-500 mb-1">Coaching Export</h3>

      {/* Section 1: Header */}
      <div className="border-b pb-4">
        <h2 className="text-xl font-bold">{rep.name}</h2>
        <div className="flex gap-4 text-sm text-gray-500 mt-1">
          <span>Segment: <strong className="text-gray-700">{rep.segment?.toUpperCase() || '—'}</strong></span>
          <span>Period: <strong className="text-gray-700">{latest.week}</strong></span>
          <span>Manager: <strong className="text-gray-700">{rep.manager_name || '—'}</strong></span>
        </div>
      </div>

      {/* Section 2: Score Summary */}
      <div className="border-b pb-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Score Summary</h4>
        <div className="flex items-baseline gap-3">
          <span className="text-4xl font-bold">{formatScore(latest.composite)}</span>
          <span className="text-lg text-gray-400">/10</span>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${bandColor(latest.band)}`}>
            {bandLabel(latest.band)}
          </span>
          <span className={`text-sm font-medium ${deltaColor(delta)}`}>
            {deltaArrow(delta)} {delta >= 0 ? '+' : ''}{delta.toFixed(1)} vs prior week
          </span>
        </div>
      </div>

      {/* Section 3: Progress Trend */}
      <div className="border-b pb-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Progress Trend (Last {scores.length} Weeks)</h4>
        <div className="flex gap-1 items-end h-16">
          {scores.map((s, i) => (
            <div key={i} className="flex-1 flex flex-col items-center">
              <div
                className="w-full rounded-t"
                style={{
                  height: `${(s.composite / 10) * 56}px`,
                  backgroundColor: i === scores.length - 1 ? '#2563eb' : '#93c5fd',
                }}
              />
              <span className="text-[9px] text-gray-400 mt-1">{s.week?.slice(5)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Section 4: Per-Pillar Breakdown */}
      <div className="border-b pb-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Pillar Breakdown</h4>
        <div className="grid grid-cols-3 gap-4">
          {['p1', 'p2', 'p3'].map(key => (
            <div key={key} className="text-center">
              <div className="text-xs text-gray-500 mb-1">{pillarName(key)}</div>
              <div className="text-2xl font-bold">{formatScore(latest[key])}</div>
              <div className="text-xs text-gray-400">/10</div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 5: Next Call Playbook */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Next Call Playbook</h4>
        {deals && deals.length > 0 && deals[0].next_call_playbook ? (
          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
            {deals[0].next_call_playbook.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ol>
        ) : (
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
            <li>Open with Dialer ROI proof point</li>
            <li>Map reporting chain above current contact</li>
            <li>Tie enrichment accuracy to pipeline conversion</li>
          </ul>
        )}
      </div>
    </div>
  );
}
