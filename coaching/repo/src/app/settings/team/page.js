'use client';
import Link from 'next/link';
import Breadcrumbs from '../../../components/Breadcrumbs';
import { getTeam } from '../../../lib/mock-data';
import { segmentLabel } from '../../../lib/utils';

export default function TeamManagement() {
  const team = getTeam();

  const byRole = {};
  team.forEach(m => {
    if (!byRole[m.role]) byRole[m.role] = [];
    byRole[m.role].push(m);
  });

  const roleOrder = ['vp', 'director', 'manager', 'ae', 'sdr', 'se', 'enablement', 'revops', 'other'];
  const roleLabels = { vp: 'VP', director: 'Directors', manager: 'Managers', ae: 'Account Executives', sdr: 'SDRs', se: 'Sales Engineers', enablement: 'Enablement', revops: 'RevOps', other: 'Other' };

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[
        { label: 'Org Overview', href: '/' },
        { label: 'Settings' },
        { label: 'Team Management' },
      ]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Team Management</h1>
          <p className="text-sm text-gray-500">{team.length} members — Synced from Glean & Notion</p>
        </div>
        <button className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm hover:bg-brand-700">
          Sync Team
        </button>
      </div>

      {roleOrder.filter(r => byRole[r]?.length > 0).map(role => (
        <div key={role} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-medium text-gray-500 mb-3">{roleLabels[role]} ({byRole[role].length})</h3>
          <div className="space-y-2">
            {byRole[role].map(member => {
              const manager = member.reports_to ? team.find(m => m.id === member.reports_to) : null;
              return (
                <div key={member.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <span className="font-medium text-sm">{member.name}</span>
                    {manager && <span className="text-xs text-gray-400 ml-2">reports to {manager.name}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    {member.segment && (
                      <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">{segmentLabel(member.segment)}</span>
                    )}
                    {member.team_label && (
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{member.team_label}</span>
                    )}
                    <span className="px-2 py-0.5 bg-gray-50 text-gray-500 rounded text-xs font-mono">{member.role}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
