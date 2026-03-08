'use client';
import Breadcrumbs from '../../../components/Breadcrumbs';

const STAGES = [
  { stage: 'Stage 0 — Prospect', required: ['identify_pain'], coaching: 'Confirm pain before advancing' },
  { stage: 'Stage 1 — Discovery', required: ['identify_pain', 'metrics'], coaching: 'Quantify pain with metrics' },
  { stage: 'Stage 2 — Qualification', required: ['identify_pain', 'metrics', 'economic_buyer', 'decision_criteria'], coaching: 'Identify EB and decision criteria' },
  { stage: 'Stage 3 — Demo/Eval', required: ['identify_pain', 'metrics', 'economic_buyer', 'decision_criteria', 'decision_process', 'champion'], coaching: 'Map decision process, test champion' },
  { stage: 'Stage 4 — Proposal', required: ['identify_pain', 'metrics', 'economic_buyer', 'decision_criteria', 'decision_process', 'champion', 'competition'], coaching: 'Address competition, solidify champion' },
  { stage: 'Stage 5 — Negotiation', required: ['identify_pain', 'metrics', 'economic_buyer', 'decision_criteria', 'decision_process', 'champion', 'competition'], coaching: 'All fields required for close' },
];

const FIELD_LABELS = {
  identify_pain: 'Identify Pain',
  metrics: 'Metrics',
  economic_buyer: 'Economic Buyer',
  decision_criteria: 'Decision Criteria',
  decision_process: 'Decision Process',
  champion: 'Champion',
  competition: 'Competition',
};

const ALL_FIELDS = Object.keys(FIELD_LABELS);

export default function MeddpiccConfig() {
  return (
    <div className="space-y-6">
      <Breadcrumbs items={[
        { label: 'Org Overview', href: '/' },
        { label: 'Settings' },
        { label: 'MEDDPICC Configuration' },
      ]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">MEDDPICC Stage Requirements</h1>
          <p className="text-sm text-gray-500">Configure required MEDDPICC fields per deal stage — Managed by RevOps</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 pr-4 font-medium text-gray-500">Stage</th>
                {ALL_FIELDS.map(f => (
                  <th key={f} className="text-center py-3 px-2 font-medium text-gray-500 text-xs">{FIELD_LABELS[f]}</th>
                ))}
                <th className="text-left py-3 pl-4 font-medium text-gray-500">Coaching Focus</th>
              </tr>
            </thead>
            <tbody>
              {STAGES.map((s, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="py-3 pr-4 font-medium">{s.stage}</td>
                  {ALL_FIELDS.map(f => (
                    <td key={f} className="text-center py-3 px-2">
                      {s.required.includes(f) ? (
                        <span className="inline-block w-5 h-5 rounded bg-green-100 text-green-600 text-xs font-bold leading-5">✓</span>
                      ) : (
                        <span className="inline-block w-5 h-5 rounded bg-gray-50 text-gray-300 text-xs leading-5">—</span>
                      )}
                    </td>
                  ))}
                  <td className="py-3 pl-4 text-gray-600 text-xs">{s.coaching}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Champion Development */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-lg font-semibold mb-3">Champion Development Stages</h3>
        <div className="grid grid-cols-4 gap-3">
          {[
            { status: 'Not Identified', color: 'bg-red-50 text-red-700 border-red-200', desc: 'No champion mentioned in transcripts' },
            { status: 'Identified', color: 'bg-yellow-50 text-yellow-700 border-yellow-200', desc: 'Champion name found in transcript' },
            { status: 'Tested', color: 'bg-blue-50 text-blue-700 border-blue-200', desc: 'Champion validated through testing language' },
            { status: 'Active', color: 'bg-green-50 text-green-700 border-green-200', desc: 'Champion actively selling internally' },
          ].map(c => (
            <div key={c.status} className={`border rounded-lg p-3 ${c.color}`}>
              <div className="font-semibold text-sm">{c.status}</div>
              <div className="text-xs mt-1 opacity-75">{c.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
