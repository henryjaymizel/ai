'use client';
import Breadcrumbs from '../../../components/Breadcrumbs';
import PillarBar from '../../../components/PillarBar';
import { getOrgMetrics, getSegmentMetrics, getReps, getRepScores, getBand } from '../../../lib/mock-data';
import { bandBg, formatScore } from '../../../lib/utils';

export default function RubricAnalytics() {
  const metrics = getOrgMetrics();
  const segments = getSegmentMetrics();
  const reps = getReps();

  // Calculate pillar correlation data
  const pillarData = reps.map(r => {
    const scores = getRepScores(r.id);
    const latest = scores[scores.length - 1];
    return latest ? { name: r.name, ...latest } : null;
  }).filter(Boolean);

  // Score distribution by pillar
  const pillarDist = { p1: [0, 0, 0], p2: [0, 0, 0], p3: [0, 0, 0] };
  pillarData.forEach(d => {
    ['p1', 'p2', 'p3'].forEach(p => {
      const band = getBand(d[p]);
      const idx = band === 'developing' ? 0 : band === 'proficient' ? 1 : 2;
      pillarDist[p][idx]++;
    });
  });

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[
        { label: 'Org Overview', href: '/' },
        { label: 'Analytics' },
        { label: 'Rubric Effectiveness' },
      ]} />

      <div>
        <h1 className="text-2xl font-bold">Rubric Effectiveness Analytics</h1>
        <p className="text-sm text-gray-500">Analyze how the Three-Pillar framework performs across the org — Managed by Enablement</p>
      </div>

      {/* Org Pillar Averages */}
      <PillarBar pillars={metrics.pillar_avgs} title="Org-Wide Pillar Averages" />

      {/* Segment Comparison */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-sm font-medium text-gray-500 mb-3">Pillar Scores by Segment</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="text-left py-2 font-medium">Segment</th>
                <th className="text-center py-2 font-medium">P1: GTM Workflow</th>
                <th className="text-center py-2 font-medium">P2: System Mapping</th>
                <th className="text-center py-2 font-medium">P3: Solution Mapping</th>
                <th className="text-center py-2 font-medium">Composite</th>
              </tr>
            </thead>
            <tbody>
              {segments.map(seg => (
                <tr key={seg.segment} className="border-b border-gray-50">
                  <td className="py-3 font-medium">{seg.label}</td>
                  {['p1', 'p2', 'p3'].map(p => (
                    <td key={p} className="text-center py-3">
                      <span
                        className="inline-block w-14 py-1 rounded text-white text-xs font-bold"
                        style={{ backgroundColor: bandBg(getBand(seg[p])) }}
                      >
                        {formatScore(seg[p])}
                      </span>
                    </td>
                  ))}
                  <td className="text-center py-3">
                    <span
                      className="inline-block w-14 py-1 rounded text-white text-xs font-bold"
                      style={{ backgroundColor: bandBg(getBand(seg.avg_composite)) }}
                    >
                      {formatScore(seg.avg_composite)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pillar Distribution */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-sm font-medium text-gray-500 mb-3">Band Distribution by Pillar</h3>
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(pillarDist).map(([pillar, dist]) => {
            const total = dist[0] + dist[1] + dist[2];
            const labels = { p1: 'P1: GTM Workflow', p2: 'P2: System Mapping', p3: 'P3: Solution Mapping' };
            return (
              <div key={pillar}>
                <div className="text-sm font-medium mb-2">{labels[pillar]}</div>
                <div className="flex rounded-full overflow-hidden h-5">
                  {dist[0] > 0 && <div className="flex items-center justify-center text-white text-xs font-bold" style={{ width: `${(dist[0] / total) * 100}%`, backgroundColor: bandBg('developing') }}>{dist[0]}</div>}
                  {dist[1] > 0 && <div className="flex items-center justify-center text-white text-xs font-bold" style={{ width: `${(dist[1] / total) * 100}%`, backgroundColor: bandBg('proficient') }}>{dist[1]}</div>}
                  {dist[2] > 0 && <div className="flex items-center justify-center text-white text-xs font-bold" style={{ width: `${(dist[2] / total) * 100}%`, backgroundColor: bandBg('elite') }}>{dist[2]}</div>}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex gap-4 mt-3 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: bandBg('developing') }} /> Developing</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: bandBg('proficient') }} /> Proficient</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: bandBg('elite') }} /> Elite</span>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-sm font-medium text-gray-500 mb-3">Key Insights</h3>
        <div className="space-y-2 text-sm text-gray-700">
          <p>The org shows strongest performance in <strong>GTM Workflow Mastery (P1)</strong>, suggesting reps are well-trained on product demonstration.</p>
          <p><strong>Solution Mapping (P3)</strong> shows the highest variance across segments, indicating different coaching needs by segment.</p>
          <p>Enterprise reps show relatively balanced scores across all three pillars, while SMB reps tend to over-index on P1.</p>
        </div>
      </div>
    </div>
  );
}
