'use client';
import { useState } from 'react';
import Breadcrumbs from '../../../components/Breadcrumbs';

const SYNC_SOURCES = [
  { name: 'Gong', schedule: 'Every 6 hours', last_sync: '2026-03-08T10:30:00Z', status: 'success', records: 142 },
  { name: 'Glean', schedule: 'Daily', last_sync: '2026-03-08T06:00:00Z', status: 'success', records: 14 },
  { name: 'Notion', schedule: 'Daily', last_sync: '2026-03-08T06:00:00Z', status: 'success', records: 14 },
  { name: 'Salesforce', schedule: 'At call scoring time', last_sync: '2026-03-08T10:30:00Z', status: 'success', records: 8 },
  { name: 'Apollo', schedule: 'On demand (per deal)', last_sync: '2026-03-07T14:15:00Z', status: 'success', records: 23 },
];

export default function SyncStatus() {
  const [syncing, setSyncing] = useState({});

  function triggerSync(source) {
    setSyncing(prev => ({ ...prev, [source]: true }));
    setTimeout(() => setSyncing(prev => ({ ...prev, [source]: false })), 2000);
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[
        { label: 'Org Overview', href: '/' },
        { label: 'Settings' },
        { label: 'Sync Status' },
      ]} />

      <h1 className="text-2xl font-bold">Sync Status</h1>

      <div className="space-y-3">
        {SYNC_SOURCES.map(src => (
          <div key={src.name} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center justify-between">
            <div>
              <div className="font-semibold">{src.name}</div>
              <div className="text-xs text-gray-500">
                Schedule: {src.schedule} — Last sync: {new Date(src.last_sync).toLocaleString()} — {src.records} records
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                src.status === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
              }`}>
                {src.status}
              </span>
              <button
                onClick={() => triggerSync(src.name)}
                disabled={syncing[src.name]}
                className="px-3 py-1.5 bg-brand-600 text-white rounded-lg text-sm hover:bg-brand-700 disabled:opacity-50"
              >
                {syncing[src.name] ? 'Syncing...' : 'Sync Now'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
