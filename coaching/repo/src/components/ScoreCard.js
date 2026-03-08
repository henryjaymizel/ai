'use client';
import { bandColor, bandLabel, formatScore, deltaArrow, deltaColor } from '../lib/utils';

export default function ScoreCard({ title, score, delta, band, subtitle, className = '' }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-5 ${className}`}>
      {title && <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>}
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold">{formatScore(score)}</span>
        <span className="text-lg text-gray-400">/10</span>
        {delta != null && (
          <span className={`text-sm font-medium ${deltaColor(delta)}`}>
            {deltaArrow(delta)} {delta >= 0 ? '+' : ''}{delta.toFixed(1)}
          </span>
        )}
      </div>
      {band && (
        <span className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-semibold ${bandColor(band)}`}>
          {bandLabel(band)}
        </span>
      )}
      {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
    </div>
  );
}
