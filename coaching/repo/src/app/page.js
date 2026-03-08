'use client';
import Link from 'next/link';
import ScoreCard from '../components/ScoreCard';
import BandDistribution from '../components/BandDistribution';
import PillarHeatmap from '../components/PillarHeatmap';
import PillarBar from '../components/PillarBar';
import Leaderboard from '../components/Leaderboard';
import { getOrgMetrics, getSegmentMetrics, getReps, getRepLatest, getDirectReports, getTeam, getBand } from '../lib/mock-data';
import { segmentLabel } from '../lib/utils';

export default function OrgOverview() {
  const metrics = getOrgMetrics();
  const segments = getSegmentMetrics();
  const reps = getReps();
  const directors = getTeam().filter(m => m.role === 'director');

  const repScores = {};
  const leaderboardData = [];
  reps.forEach(r => {
    const latest = getRepLatest(r.id);
    if (latest) {
      repScores[r.id] = latest;
      leaderboardData.push({
        id: r.id,
        name: r.name,
        score: latest.composite,
        band: latest.band,
        deals: latest.deals_evaluated,
        delta: null,
      });
    }
  });

  const sorted = [...leaderboardData].sort((a, b) => b.score - a.score);
  const top5 = sorted.slice(0, 5);
  const bottom5 = sorted.slice(-5).reverse();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Org Overview</h1>
        <div className="flex gap-2 text-sm">
          <select className="border rounded-lg px-3 py-1.5 bg-white">
            <option>Last 4 Weeks</option>
            <option>Last 8 Weeks</option>
            <option>Last Quarter</option>
          </select>
          <div className="flex border rounded-lg overflow-hidden">
            <button className="px-3 py-1.5 bg-brand-600 text-white text-sm">Weekly</button>
            <button className="px-3 py-1.5 bg-white hover:bg-gray-50 text-sm">Monthly</button>
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ScoreCard title="Avg Composite Score" score={metrics.avg_composite} delta={metrics.delta} band={getBand(metrics.avg_composite)} />
        <ScoreCard title="Total Reps" score={metrics.total_reps} subtitle={`${metrics.deals_evaluated} deals evaluated`} />
        <PillarBar pillars={metrics.pillar_avgs} title="Org Pillar Averages" />
        <BandDistribution distribution={metrics.band_distribution} />
      </div>

      {/* Segment Strategy Dashboard */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-sm font-medium text-gray-500 mb-3">Segment Strategy Dashboard</h3>
        <div className="grid grid-cols-3 gap-4">
          {segments.map(seg => (
            <div key={seg.segment} className="border rounded-lg p-4">
              <div className="font-semibold text-sm mb-2">{seg.label}</div>
              <div className="text-2xl font-bold">{seg.avg_composite.toFixed(1)}<span className="text-sm text-gray-400">/10</span></div>
              <div className="text-xs text-gray-500 mt-1">{seg.rep_count} reps</div>
              <div className="mt-3 space-y-1">
                {['p1', 'p2', 'p3'].map(key => (
                  <div key={key} className="flex justify-between text-xs">
                    <span className="text-gray-500">{key.toUpperCase()}</span>
                    <span className="font-medium">{seg[key].toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pillar Heatmap */}
      <PillarHeatmap reps={reps} scores={repScores} />

      {/* Top & Bottom + Director Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Top 5 Reps</h3>
          <div className="space-y-2">
            {top5.map((r, i) => (
              <div key={r.id} className="flex items-center justify-between py-1">
                <Link href={`/rep/${r.id}`} className="text-sm font-medium hover:text-brand-600">{i + 1}. {r.name}</Link>
                <span className="font-bold text-sm">{r.score.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Bottom 5 Reps</h3>
          <div className="space-y-2">
            {bottom5.map((r, i) => (
              <div key={r.id} className="flex items-center justify-between py-1">
                <Link href={`/rep/${r.id}`} className="text-sm font-medium hover:text-brand-600">{sorted.length - 4 + i}. {r.name}</Link>
                <span className="font-bold text-sm text-red-600">{r.score.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Director Breakdown */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-sm font-medium text-gray-500 mb-3">Director Breakdown</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {directors.map(dir => {
            const reports = getDirectReports(dir.id);
            return (
              <Link key={dir.id} href={`/director/${dir.id}`} className="block border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="font-semibold">{dir.name}</div>
                <div className="text-xs text-gray-500">{dir.team_label} — {reports.length} managers</div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
