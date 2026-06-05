import { useState } from 'react';
import { MessageSquare, Filter } from 'lucide-react';
import HybridDashboardShell from '@/features/dashboard/components/HybridDashboardShell.jsx';
import PageHeader, { StatCard } from '@/shared/components/PageHeader.jsx';
import LiveActivityFeed from '@/features/customer-feed/components/LiveActivityFeedHybrid.jsx';

/**
 * CustomerFeedPage — "What events have occurred today?"
 *
 * Operational event stream with filters.
 */
const FILTERS = ['All', 'Check-ins', 'Served', 'Transitions', 'Staff actions', 'System'];

export default function CustomerFeedPage() {
  const [filter, setFilter] = useState('All');

  return (
    <HybridDashboardShell>
      <div className="space-y-6 pt-2">
        <PageHeader
          eyebrow="Operational event stream"
          title="Customer Feed"
          subtitle="A complete chronological record of every action and transition across your queues."
          crumbs={[{ label: 'Operations' }, { label: 'Customer Feed' }]}
          actions={
            <button className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-white/[0.08]">
              <Filter className="h-3.5 w-3.5" /> Export today
            </button>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Events today"     value="312" delta="+18% vs yesterday" tone="cyan"    icon={MessageSquare} />
          <StatCard label="Check-ins"        value="124" delta="Mostly QR"         tone="violet" />
          <StatCard label="Customers served" value="139" delta="Across 6 staff"    tone="emerald" />
          <StatCard label="No-shows"         value="4"   delta="Auto-removed"      tone="amber"   />
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                filter === f
                  ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-900 shadow-[0_0_18px_-6px_rgba(34,211,238,0.7)]'
                  : 'text-slate-300 hover:bg-white/[0.04]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <LiveActivityFeed />
      </div>
    </HybridDashboardShell>
  );
}
