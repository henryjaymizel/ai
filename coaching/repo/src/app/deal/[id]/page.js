'use client';
import { use } from 'react';
import Link from 'next/link';
import Breadcrumbs from '../../../components/Breadcrumbs';
import PillarBar from '../../../components/PillarBar';
import MeddpiccStatus from '../../../components/MeddpiccStatus';
import { getDeal, getDealCalls, getMember } from '../../../lib/mock-data';
import { formatScore, formatCurrency, formatDuration, bandColor, bandLabel } from '../../../lib/utils';

export default function DealView({ params }) {
  const { id } = use(params);
  const deal = getDeal(id);
  const calls = deal ? getDealCalls(id) : [];

  if (!deal) return <div className="text-gray-400">Deal not found</div>;

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[
        { label: 'Org Overview', href: '/' },
        { label: deal.name },
      ]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{deal.name}</h1>
          <p className="text-sm text-gray-500">{deal.account_name} — {deal.stage} — {formatCurrency(deal.arr)} ARR — {deal.seat_count} seats</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold">{formatScore(deal.composite_score)}<span className="text-sm text-gray-400">/10</span></div>
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${bandColor(deal.scoring_band)}`}>
            {bandLabel(deal.scoring_band)}
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <PillarBar pillars={{ p1: deal.p1, p2: deal.p2, p3: deal.p3 }} title="Pillar Scores" />
        <MeddpiccStatus meddpicc={deal.meddpicc} />
      </div>

      {/* Strengths & Improvements */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-medium text-green-600 mb-3">Strengths</h3>
          <ul className="space-y-1.5">
            {deal.strengths.map((s, i) => (
              <li key={i} className="text-sm text-gray-700">+ {s}</li>
            ))}
          </ul>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-medium text-red-600 mb-3">Areas for Improvement</h3>
          <ul className="space-y-1.5">
            {deal.improvements.map((s, i) => (
              <li key={i} className="text-sm text-gray-700">- {s}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Next Call Playbook */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-sm font-medium text-gray-500 mb-3">Next Call Playbook</h3>
        <ol className="list-decimal list-inside space-y-1.5 text-sm text-gray-700">
          {deal.next_call_playbook.map((item, i) => (
            <li key={i} className="font-medium">{item}</li>
          ))}
        </ol>
      </div>

      {/* Calls List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-sm font-medium text-gray-500 mb-3">Calls ({calls.length})</h3>
        <div className="space-y-2">
          {calls.map(call => (
            <Link key={call.id} href={`/call/${call.id}`} className="flex items-center justify-between p-3 border rounded-lg hover:shadow-sm transition-shadow">
              <div>
                <div className="font-medium text-sm">{new Date(call.date).toLocaleDateString()}</div>
                <div className="text-xs text-gray-500">{call.participants.join(', ')}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">{formatDuration(call.duration_seconds)}</div>
                <div className="text-xs text-gray-500">{call.key_moments.length} key moments</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
