'use client';
import { bandBg, formatScore } from '../lib/utils';
import { getBand } from '../lib/mock-data';

const PILLARS = [
  { key: 'p1', label: 'P1: GTM Workflow' },
  { key: 'p2', label: 'P2: System Mapping' },
  { key: 'p3', label: 'P3: Solution Mapping' },
  { key: 'composite', label: 'Composite' },
];

function weekLabel(isoDate) {
  const d = new Date(isoDate + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function WeeklyPillarHeatmap({ scores }) {
  if (!scores || scores.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h3 className="text-sm font-medium text-gray-500 mb-3">Week-over-Week Pillar Heatmap</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500">
              <th className="text-left py-2 pr-4 font-medium">Pillar</th>
              {scores.map(s => (
                <th key={s.week} className="text-center py-2 px-2 font-medium whitespace-nowrap">
                  {weekLabel(s.week)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PILLARS.map(pillar => (
              <tr key={pillar.key} className={`border-t border-gray-50 ${pillar.key === 'composite' ? 'border-t-2 border-gray-200' : ''}`}>
                <td className="py-2 pr-4 font-medium text-gray-700 whitespace-nowrap">{pillar.label}</td>
                {scores.map(s => {
                  const val = s[pillar.key];
                  const band = getBand(val);
                  return (
                    <td key={s.week} className="text-center py-2 px-2">
                      <span
                        className="inline-block w-12 py-1 rounded text-white text-xs font-bold"
                        style={{ backgroundColor: bandBg(band) }}
                      >
                        {formatScore(val)}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 mt-2">Each column is the week the calls were recorded in Gong. Scores are averaged across all evaluated calls that week.</p>
    </div>
  );
}
