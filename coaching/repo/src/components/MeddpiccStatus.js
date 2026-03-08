'use client';

const FIELDS = [
  { key: 'metrics', label: 'Metrics' },
  { key: 'economic_buyer', label: 'Economic Buyer' },
  { key: 'decision_criteria', label: 'Decision Criteria' },
  { key: 'decision_process', label: 'Decision Process' },
  { key: 'identify_pain', label: 'Identify Pain' },
  { key: 'champion', label: 'Champion' },
  { key: 'competition', label: 'Competition' },
];

function statusColor(status) {
  if (['documented', 'identified', 'mapped', 'confirmed', 'active', 'tested'].includes(status)) return 'bg-green-100 text-green-700';
  if (status === 'not_started' || status === 'not_identified') return 'bg-red-100 text-red-700';
  return 'bg-yellow-100 text-yellow-700';
}

export default function MeddpiccStatus({ meddpicc }) {
  if (!meddpicc) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h3 className="text-sm font-medium text-gray-500 mb-3">MEDDPICC Status</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {FIELDS.map(f => {
          const field = meddpicc[f.key];
          if (!field) return null;
          return (
            <div key={f.key} className="text-center p-2 rounded-lg bg-gray-50">
              <div className="text-xs text-gray-500 mb-1">{f.label}</div>
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${statusColor(field.status)}`}>
                {field.status?.replace(/_/g, ' ')}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
