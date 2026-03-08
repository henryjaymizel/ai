'use client';
import { bandBg } from '../lib/utils';
import { getBand } from '../lib/mock-data';

export default function TrendChart({ data, height = 200, showPillars = false }) {
  if (!data || data.length === 0) return <div className="text-gray-400 text-sm">No trend data</div>;

  const maxScore = 10;
  const w = 100 / data.length;
  const pad = 20;

  function yPos(val) {
    return height - pad - ((val / maxScore) * (height - 2 * pad));
  }

  function buildLine(key, color) {
    return data.map((d, i) => {
      const x = pad + i * ((100 - 2 * pad) / (data.length - 1)) + '%';
      const xNum = pad + i * ((600 - 2 * pad) / (data.length - 1));
      const y = yPos(d[key]);
      return `${xNum},${y}`;
    }).join(' ');
  }

  const svgW = 600;
  function xPos(i) { return pad + i * ((svgW - 2 * pad) / (data.length - 1)); }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h3 className="text-sm font-medium text-gray-500 mb-3">Score Trend</h3>
      <svg viewBox={`0 0 ${svgW} ${height}`} className="w-full" style={{ height }}>
        {/* Grid lines */}
        {[0, 2, 4, 6, 8, 10].map(v => (
          <g key={v}>
            <line x1={pad} y1={yPos(v)} x2={svgW - pad} y2={yPos(v)} stroke="#e5e7eb" strokeWidth="1" />
            <text x={pad - 5} y={yPos(v) + 4} textAnchor="end" fill="#9ca3af" fontSize="10">{v}</text>
          </g>
        ))}

        {/* Band backgrounds */}
        <rect x={pad} y={yPos(10)} width={svgW - 2 * pad} height={yPos(7) - yPos(10)} fill="#22c55e" opacity="0.06" />
        <rect x={pad} y={yPos(6)} width={svgW - 2 * pad} height={yPos(4) - yPos(6)} fill="#eab308" opacity="0.06" />
        <rect x={pad} y={yPos(3)} width={svgW - 2 * pad} height={yPos(0) - yPos(3)} fill="#ef4444" opacity="0.06" />

        {/* Pillar lines */}
        {showPillars && (
          <>
            <polyline points={data.map((d, i) => `${xPos(i)},${yPos(d.p1)}`).join(' ')} fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="4,3" opacity="0.6" />
            <polyline points={data.map((d, i) => `${xPos(i)},${yPos(d.p2)}`).join(' ')} fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeDasharray="4,3" opacity="0.6" />
            <polyline points={data.map((d, i) => `${xPos(i)},${yPos(d.p3)}`).join(' ')} fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4,3" opacity="0.6" />
          </>
        )}

        {/* Composite line */}
        <polyline
          points={data.map((d, i) => `${xPos(i)},${yPos(d.composite)}`).join(' ')}
          fill="none" stroke="#1d4ed8" strokeWidth="2.5"
        />

        {/* Data points */}
        {data.map((d, i) => (
          <circle key={i} cx={xPos(i)} cy={yPos(d.composite)} r="4" fill={bandBg(getBand(d.composite))} stroke="white" strokeWidth="2" />
        ))}

        {/* X labels */}
        {data.map((d, i) => (
          <text key={i} x={xPos(i)} y={height - 4} textAnchor="middle" fill="#9ca3af" fontSize="9">
            {d.week?.slice(5) || `W${i + 1}`}
          </text>
        ))}
      </svg>

      {showPillars && (
        <div className="flex gap-4 mt-2 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-500 inline-block" /> P1: GTM</span>
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-purple-500 inline-block" /> P2: System</span>
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-amber-500 inline-block" /> P3: Solution</span>
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-800 inline-block" /> Composite</span>
        </div>
      )}
    </div>
  );
}
