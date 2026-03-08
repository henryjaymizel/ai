'use client';
import { use } from 'react';
import Link from 'next/link';
import Breadcrumbs from '../../../components/Breadcrumbs';
import ScoreCard from '../../../components/ScoreCard';
import TrendChart from '../../../components/TrendChart';
import PillarBar from '../../../components/PillarBar';
import CoachingExport from '../../../components/CoachingExport';
import AudioPlayer from '../../../components/AudioPlayer';
import { getMember, getRepScores, getRepDeals, getRepLatest, getBand } from '../../../lib/mock-data';
import { formatScore, bandColor, bandLabel, formatCurrency, segmentLabel } from '../../../lib/utils';

export default function RepView({ params }) {
  const { id } = use(params);
  const rep = getMember(id);
  const scores = getRepScores(id);
  const deals = getRepDeals(id);
  const latest = getRepLatest(id);

  const manager = rep ? getMember(rep.reports_to) : null;
  const director = manager ? getMember(manager.reports_to) : null;

  const delta = scores.length >= 2
    ? Math.round((scores[scores.length - 1].composite - scores[scores.length - 2].composite) * 10) / 10
    : 0;

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[
        { label: 'Org Overview', href: '/' },
        ...(director ? [{ label: director.name, href: `/director/${director.id}` }] : []),
        ...(manager ? [{ label: manager.name, href: `/manager/${manager.id}` }] : []),
        { label: rep?.name || 'Rep' },
      ]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{rep?.name}</h1>
          <p className="text-sm text-gray-500">
            {rep?.role?.toUpperCase()} — {segmentLabel(rep?.segment)} — Reports to {manager?.name || '—'}
          </p>
        </div>
        {latest && (
          <ScoreCard
            title="Current Score"
            score={latest.composite}
            delta={delta}
            band={latest.band}
          />
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <TrendChart data={scores} showPillars />
        {latest && <PillarBar pillars={{ p1: latest.p1, p2: latest.p2, p3: latest.p3 }} />}
      </div>

      {/* Strengths & Improvements */}
      {deals.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-medium text-green-600 mb-3">Strengths</h3>
            <ul className="space-y-1.5">
              {deals[0].strengths.map((s, i) => (
                <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">+</span> {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-medium text-red-600 mb-3">Areas for Improvement</h3>
            <ul className="space-y-1.5">
              {deals[0].improvements.map((s, i) => (
                <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">-</span> {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Recent Deals */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-sm font-medium text-gray-500 mb-3">Recent Deals</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 border-b">
                <th className="text-left py-2 font-medium">Deal</th>
                <th className="text-left py-2 font-medium">Account</th>
                <th className="text-center py-2 font-medium">Score</th>
                <th className="text-center py-2 font-medium">Band</th>
                <th className="text-right py-2 font-medium">ARR</th>
                <th className="text-center py-2 font-medium">Stage</th>
                <th className="text-center py-2 font-medium">Calls</th>
              </tr>
            </thead>
            <tbody>
              {deals.map(deal => (
                <tr key={deal.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2.5">
                    <Link href={`/deal/${deal.id}`} className="font-medium hover:text-brand-600">{deal.name}</Link>
                  </td>
                  <td className="py-2.5 text-gray-600">{deal.account_name}</td>
                  <td className="py-2.5 text-center font-bold">{formatScore(deal.composite_score)}</td>
                  <td className="py-2.5 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${bandColor(deal.scoring_band)}`}>
                      {bandLabel(deal.scoring_band)}
                    </span>
                  </td>
                  <td className="py-2.5 text-right text-gray-600">{formatCurrency(deal.arr)}</td>
                  <td className="py-2.5 text-center text-gray-600">{deal.stage}</td>
                  <td className="py-2.5 text-center text-gray-600">{deal.calls_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Coaching Export */}
      <CoachingExport
        rep={{ ...rep, manager_name: manager?.name }}
        scores={scores}
        deals={deals}
      />

      {/* Audio Player */}
      {latest && (
        <AudioPlayer
          repName={rep?.name}
          score={latest.composite}
          band={latest.band}
        />
      )}

      {/* Manager Notes (read-only for rep) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-sm font-medium text-gray-500 mb-3">Manager Coaching Notes</h3>
        <p className="text-sm text-gray-400 italic">No coaching notes from your manager yet.</p>
      </div>
    </div>
  );
}
