'use client';
import Link from 'next/link';
import { bandColor, bandLabel, formatScore, deltaArrow, deltaColor } from '../lib/utils';

export default function Leaderboard({ reps, title = 'Team Leaderboard' }) {
  const sorted = [...reps].sort((a, b) => (b.score || 0) - (a.score || 0));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h3 className="text-sm font-medium text-gray-500 mb-3">{title}</h3>
      <div className="space-y-2">
        {sorted.map((rep, i) => (
          <div key={rep.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              i === 0 ? 'bg-yellow-100 text-yellow-700' :
              i === 1 ? 'bg-gray-100 text-gray-600' :
              i === 2 ? 'bg-orange-100 text-orange-700' :
              'bg-gray-50 text-gray-400'
            }`}>
              {i + 1}
            </span>
            <Link href={`/rep/${rep.id}`} className="flex-1 font-medium text-sm hover:text-brand-600">
              {rep.name}
            </Link>
            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${bandColor(rep.band)}`}>
              {bandLabel(rep.band)}
            </span>
            <span className="font-bold text-sm w-10 text-right">{formatScore(rep.score)}</span>
            {rep.delta != null && (
              <span className={`text-xs ${deltaColor(rep.delta)}`}>
                {deltaArrow(rep.delta)}
              </span>
            )}
            {/* Mini sparkline */}
            {rep.sparkline && (
              <svg viewBox="0 0 60 20" className="w-14 h-5">
                <polyline
                  points={rep.sparkline.map((v, j) => `${j * (60 / (rep.sparkline.length - 1))},${20 - (v / 10) * 18}`).join(' ')}
                  fill="none" stroke="#3b82f6" strokeWidth="1.5"
                />
              </svg>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
