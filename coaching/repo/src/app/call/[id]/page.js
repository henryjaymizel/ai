'use client';
import { use, useState } from 'react';
import Breadcrumbs from '../../../components/Breadcrumbs';
import { getCall } from '../../../lib/mock-data';
import { formatDuration } from '../../../lib/utils';

export default function CallView({ params }) {
  const { id } = use(params);
  const call = getCall(id);
  const [searchTerm, setSearchTerm] = useState('');

  if (!call) return <div className="text-gray-400">Call not found</div>;

  const filteredTranscript = call.transcript_segments.filter(seg =>
    !searchTerm || seg.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[
        { label: 'Org Overview', href: '/' },
        { label: `Call ${id.slice(-6)}` },
      ]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Call Detail</h1>
          <p className="text-sm text-gray-500">
            {new Date(call.date).toLocaleDateString()} — {formatDuration(call.duration_seconds)} — {call.participants.join(', ')}
          </p>
        </div>
        <a href={call.gong_url} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm hover:bg-brand-700">
          Open in Gong
        </a>
      </div>

      {/* Key Moments */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-sm font-medium text-gray-500 mb-3">Key Moments</h3>
        <div className="space-y-2">
          {call.key_moments.map((moment, i) => (
            <div key={i} className="flex gap-3 p-3 bg-yellow-50 border border-yellow-100 rounded-lg">
              <span className="text-xs font-mono text-yellow-600 whitespace-nowrap pt-0.5">
                {formatDuration(moment.timestamp_seconds)}
              </span>
              <div>
                <span className="text-xs font-semibold text-yellow-700 uppercase">{moment.category.replace(/_/g, ' ')}</span>
                <p className="text-sm text-gray-700 italic mt-0.5">&ldquo;{moment.quote}&rdquo;</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transcript */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-500">Transcript</h3>
          <input
            type="text"
            placeholder="Search transcript..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="border rounded-lg px-3 py-1.5 text-sm w-64"
          />
        </div>
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {filteredTranscript.map((seg, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-20 text-right">
                <span className="text-xs font-mono text-gray-400">{formatDuration(seg.start)}</span>
                <div className={`text-xs font-semibold mt-0.5 ${seg.speaker === 'Rep' ? 'text-brand-600' : 'text-gray-600'}`}>
                  {seg.speaker}
                </div>
              </div>
              <p className={`flex-1 text-sm ${seg.speaker === 'Rep' ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-100'} border rounded-lg p-3`}>
                {seg.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
