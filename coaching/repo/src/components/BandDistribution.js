'use client';
import { bandBg } from '../lib/utils';

export default function BandDistribution({ distribution }) {
  const total = (distribution.developing || 0) + (distribution.proficient || 0) + (distribution.elite || 0);
  if (total === 0) return null;

  const segments = [
    { key: 'developing', label: 'Developing (0-3)', count: distribution.developing || 0 },
    { key: 'proficient', label: 'Proficient (4-6)', count: distribution.proficient || 0 },
    { key: 'elite', label: 'Elite (7-10)', count: distribution.elite || 0 },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h3 className="text-sm font-medium text-gray-500 mb-3">Score Distribution</h3>
      <div className="flex rounded-full overflow-hidden h-6 mb-3">
        {segments.map(seg => (
          seg.count > 0 && (
            <div
              key={seg.key}
              className="flex items-center justify-center text-white text-xs font-bold"
              style={{ width: `${(seg.count / total) * 100}%`, backgroundColor: bandBg(seg.key) }}
            >
              {seg.count}
            </div>
          )
        ))}
      </div>
      <div className="flex gap-4 text-xs text-gray-500">
        {segments.map(seg => (
          <span key={seg.key} className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: bandBg(seg.key) }} />
            {seg.label}: {seg.count}
          </span>
        ))}
      </div>
    </div>
  );
}
