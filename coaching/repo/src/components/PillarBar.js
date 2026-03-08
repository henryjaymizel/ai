'use client';
import { bandBg, formatScore, pillarName } from '../lib/utils';
import { getBand } from '../lib/mock-data';

export default function PillarBar({ pillars, title = 'Pillar Breakdown' }) {
  const entries = Object.entries(pillars || {});

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h3 className="text-sm font-medium text-gray-500 mb-3">{title}</h3>
      <div className="space-y-3">
        {entries.map(([key, value]) => {
          const band = getBand(value);
          return (
            <div key={key}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">{pillarName(key)}</span>
                <span className="font-bold">{formatScore(value)}/10</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${(value / 10) * 100}%`, backgroundColor: bandBg(band) }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
