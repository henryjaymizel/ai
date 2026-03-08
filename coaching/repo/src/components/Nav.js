'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', label: 'Overview' },
  { href: '/settings/prompt', label: 'Prompt Editor' },
  { href: '/settings/segments', label: 'Segments' },
  { href: '/settings/pillars', label: 'Pillars' },
  { href: '/settings/plays', label: 'Plays' },
  { href: '/settings/meddpicc', label: 'MEDDPICC' },
  { href: '/settings/team', label: 'Team' },
  { href: '/settings/sync', label: 'Sync' },
  { href: '/analytics/rubric', label: 'Rubric Analytics' },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="bg-brand-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="font-bold text-lg tracking-tight">
            Sales Coaching
          </Link>
          <div className="flex items-center gap-1 overflow-x-auto text-sm">
            {NAV_ITEMS.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
                  pathname === item.href
                    ? 'bg-white/20 font-medium'
                    : 'hover:bg-white/10'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm opacity-75">Max Angell</span>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-medium">MA</div>
          </div>
        </div>
      </div>
    </nav>
  );
}
