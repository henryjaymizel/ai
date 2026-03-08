'use client';
import { bandBg } from '../lib/utils';
import { getBand } from '../lib/mock-data';

export default function ScatterPlot({ reps, height = 260 }) {
  if (!reps || reps.length === 0) return null;

  const svgW = 600;
  const pad = 40;
  const maxCalls = Math.max(...reps.map(r => r.deals || 1), 10);
  const maxScore = 10;

  function xPos(calls) { return pad + (calls / maxCalls) * (svgW - 2 * pad); }
  function yPos(score) { return height - pad - (score / maxScore) * (height - 2 * pad); }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h3 className="text-sm font-medium text-gray-500 mb-3">Call Volume vs. Composite Score</h3>
      <svg viewBox={`0 0 ${svgW} ${height}`} className="w-full" style={{ height }}>
        {/* Grid */}
        {[0, 2, 4, 6, 8, 10].map(v => (
          <g key={v}>
            <line x1={pad} y1={yPos(v)} x2={svgW - pad} y2={yPos(v)} stroke="#f3f4f6" strokeWidth="1" />
            <text x={pad - 5} y={yPos(v) + 4} textAnchor="end" fill="#9ca3af" fontSize="10">{v}</text>
          </g>
        ))}
        <text x={pad} y={height - 5} fill="#9ca3af" fontSize="10">0 deals</text>
        <text x={svgW - pad} y={height - 5} textAnchor="end" fill="#9ca3af" fontSize="10">{maxCalls}</text>

        {/* Bubbles */}
        {reps.map((r, i) => (
          <g key={i}>
            <circle
              cx={xPos(r.deals || 1)}
              cy={yPos(r.score || 0)}
              r={8 + (r.deals || 1) * 1.5}
              fill={bandBg(getBand(r.score || 0))}
              opacity="0.6"
              stroke="white"
              strokeWidth="1.5"
            />
            <text
              x={xPos(r.deals || 1)}
              y={yPos(r.score || 0) + 3}
              textAnchor="middle"
              fill="white"
              fontSize="8"
              fontWeight="bold"
            >
              {r.name?.split(' ')[0]}
            </text>
          </g>
        ))}

        {/* Axis labels */}
        <text x={svgW / 2} y={height - 2} textAnchor="middle" fill="#6b7280" fontSize="11">Deals Evaluated</text>
        <text x={10} y={height / 2} textAnchor="middle" fill="#6b7280" fontSize="11" transform={`rotate(-90, 10, ${height / 2})`}>Score</text>
      </svg>
    </div>
  );
}
