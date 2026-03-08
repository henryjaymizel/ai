'use client';
import { use, useState } from 'react';
import Link from 'next/link';
import Breadcrumbs from '../../../components/Breadcrumbs';
import ScoreCard from '../../../components/ScoreCard';
import PillarHeatmap from '../../../components/PillarHeatmap';
import Leaderboard from '../../../components/Leaderboard';
import ScatterPlot from '../../../components/ScatterPlot';
import { getMember, getDirectReports, getRepLatest, getRepScores, getBand } from '../../../lib/mock-data';

export default function ManagerView({ params }) {
  const { id } = use(params);
  const manager = getMember(id);
  const reps = getDirectReports(id).filter(r => ['ae', 'sdr'].includes(r.role));
  const [notes, setNotes] = useState({});

  const repScores = {};
  const leaderboardData = [];
  const scatterData = [];
  reps.forEach(r => {
    const latest = getRepLatest(r.id);
    const history = getRepScores(r.id);
    if (latest) {
      repScores[r.id] = latest;
      leaderboardData.push({
        id: r.id, name: r.name, score: latest.composite, band: latest.band,
        deals: latest.deals_evaluated,
        sparkline: history.map(h => h.composite),
        delta: history.length >= 2 ? Math.round((history[history.length - 1].composite - history[history.length - 2].composite) * 10) / 10 : null,
      });
      scatterData.push({ name: r.name, score: latest.composite, deals: latest.deals_evaluated });
    }
  });

  const avgScore = leaderboardData.length
    ? Math.round(leaderboardData.reduce((s, r) => s + r.score, 0) / leaderboardData.length * 10) / 10
    : 0;

  const dir = manager ? getMember(manager.reports_to) : null;

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[
        { label: 'Org Overview', href: '/' },
        ...(dir ? [{ label: dir.name, href: `/director/${dir.id}` }] : []),
        { label: manager?.name || 'Manager' },
      ]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{manager?.name}</h1>
          <p className="text-sm text-gray-500">{manager?.team_label} — {reps.length} reps — {manager?.segment?.toUpperCase()}</p>
        </div>
        <ScoreCard title="Team Average" score={avgScore} band={getBand(avgScore)} />
      </div>

      {/* Rep Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reps.map(rep => {
          const latest = getRepLatest(rep.id);
          return (
            <Link key={rep.id} href={`/rep/${rep.id}`} className="block bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
              <div className="font-semibold">{rep.name}</div>
              <div className="text-xs text-gray-500 mb-2">{rep.role.toUpperCase()} — {rep.segment}</div>
              {latest && (
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{latest.composite.toFixed(1)}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    latest.band === 'elite' ? 'bg-green-50 text-green-600' :
                    latest.band === 'proficient' ? 'bg-yellow-50 text-yellow-600' :
                    'bg-red-50 text-red-600'
                  }`}>{latest.band}</span>
                </div>
              )}
            </Link>
          );
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <PillarHeatmap reps={reps} scores={repScores} />
        <ScatterPlot reps={scatterData} />
      </div>

      <Leaderboard reps={leaderboardData} title="Team Leaderboard" />

      {/* Coaching Notes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-sm font-medium text-gray-500 mb-3">Coaching Notes</h3>
        <div className="space-y-3">
          {reps.map(rep => (
            <div key={rep.id} className="flex gap-3 items-start">
              <span className="text-sm font-medium w-28 pt-2">{rep.name}</span>
              <textarea
                className="flex-1 border rounded-lg p-2 text-sm resize-none"
                rows={2}
                placeholder={`Add coaching notes for ${rep.name}...`}
                value={notes[rep.id] || ''}
                onChange={e => setNotes({ ...notes, [rep.id]: e.target.value })}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
