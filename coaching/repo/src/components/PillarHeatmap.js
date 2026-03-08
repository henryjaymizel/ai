'use client';
import Link from 'next/link';
import { bandBg, formatScore } from '../lib/utils';
import { getBand } from '../lib/mock-data';

export default function PillarHeatmap({ reps, scores }) {
  const pillars = [
    { key: 'p1', label: 'P1: GTM Workflow' },
    { key: 'p2', label: 'P2: System Mapping' },
    { key: 'p3', label: 'P3: Solution Mapping' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h3 className="text-sm font-medium text-gray-500 mb-3">Pillar Heatmap</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500">
              <th className="text-left py-2 pr-4 font-medium">Rep</th>
              {pillars.map(p => (
                <th key={p.key} className="text-center py-2 px-3 font-medium">{p.label}</th>
              ))}
              <th className="text-center py-2 px-3 font-medium">Composite</th>
            </tr>
          </thead>
          <tbody>
            {reps.map(rep => {
              const s = scores[rep.id];
              if (!s) return null;
              return (
                <tr key={rep.id} className="border-t border-gray-50">
                  <td className="py-2 pr-4">
                    <Link href={`/rep/${rep.id}`} className="hover:text-brand-600 font-medium">
                      {rep.name}
                    </Link>
                  </td>
                  {pillars.map(p => {
                    const val = s[p.key];
                    const band = getBand(val);
                    return (
                      <td key={p.key} className="text-center py-2 px-3">
                        <span
                          className="inline-block w-12 py-1 rounded text-white text-xs font-bold"
                          style={{ backgroundColor: bandBg(band) }}
                        >
                          {formatScore(val)}
                        </span>
                      </td>
                    );
                  })}
                  <td className="text-center py-2 px-3">
                    <span
                      className="inline-block w-12 py-1 rounded text-white text-xs font-bold"
                      style={{ backgroundColor: bandBg(getBand(s.composite)) }}
                    >
                      {formatScore(s.composite)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
