'use client';
import { use } from 'react';
import Link from 'next/link';
import Breadcrumbs from '../../../components/Breadcrumbs';
import ScoreCard from '../../../components/ScoreCard';
import PillarHeatmap from '../../../components/PillarHeatmap';
import Leaderboard from '../../../components/Leaderboard';
import { getMember, getDirectReports, getSubtree, getRepLatest, getBand } from '../../../lib/mock-data';

export default function DirectorView({ params }) {
  const { id } = use(params);
  const director = getMember(id);
  const managers = getDirectReports(id);
  const allReps = getSubtree(id).filter(m => ['ae', 'sdr'].includes(m.role));

  const repScores = {};
  const leaderboardData = [];
  allReps.forEach(r => {
    const latest = getRepLatest(r.id);
    if (latest) {
      repScores[r.id] = latest;
      leaderboardData.push({
        id: r.id, name: r.name, score: latest.composite, band: latest.band,
        deals: latest.deals_evaluated, sparkline: null,
      });
    }
  });

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[
        { label: 'Org Overview', href: '/' },
        { label: director?.name || 'Director' },
      ]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{director?.name}</h1>
          <p className="text-sm text-gray-500">{director?.team_label} — {managers.length} managers, {allReps.length} reps</p>
        </div>
      </div>

      {/* Manager Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {managers.map(mgr => {
          const mgrReps = getDirectReports(mgr.id).filter(r => ['ae', 'sdr'].includes(r.role));
          const scores = mgrReps.map(r => getRepLatest(r.id)).filter(Boolean);
          const avg = scores.length ? Math.round(scores.reduce((s, r) => s + r.composite, 0) / scores.length * 10) / 10 : 0;
          return (
            <Link key={mgr.id} href={`/manager/${mgr.id}`} className="block bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
              <div className="font-semibold">{mgr.name}</div>
              <div className="text-xs text-gray-500 mb-3">{mgr.team_label} — {mgrReps.length} reps</div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{avg.toFixed(1)}</span>
                <span className="text-sm text-gray-400">/10 avg</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Cross-Team Heatmap */}
      <PillarHeatmap reps={allReps} scores={repScores} />

      {/* Leaderboard */}
      <Leaderboard reps={leaderboardData} title="Cross-Team Leaderboard" />
    </div>
  );
}
