// ============================================================================
//  OperationsPage — owner KPIs and per-queue health, real data
// ----------------------------------------------------------------------------
//  All numbers are sourced from /api/analytics/summary and /api/queues.
//  Per-staff rankings remain an empty state until member-level performance
//  tracking lands (no fabricated names).
// ============================================================================

import { Link } from 'react-router-dom';
import { Users, Gauge, Timer, Award, UserPlus } from 'lucide-react';
import HybridDashboardShell from '@/features/dashboard/components/HybridDashboardShell.jsx';
import PageHeader, { StatCard } from '@/shared/components/PageHeader.jsx';
import EmptyState from '@/shared/components/EmptyState.jsx';
import useAnalyticsSummary from '@/features/analytics/hooks/useAnalyticsSummary.js';
import useQueues from '@/features/queue/hooks/useQueues.js';
import { ROUTES } from '@/shared/constants/routes.js';

export default function OperationsPage() {
  const { summary } = useAnalyticsSummary({ range: '24h', pollMs: 30_000 });
  const { queues }  = useQueues({}, { pollMs: 60_000 });

  const joined        = summary?.totals?.joined ?? 0;
  const served        = summary?.totals?.served ?? 0;
  const waitingNow    = summary?.totals?.waitingNow ?? 0;
  const servingNow    = summary?.totals?.servingNow ?? 0;
  const avgWaitMins   = summary?.avgWaitMins   != null ? Math.round(summary.avgWaitMins)   : null;
  const avgServiceMins= summary?.avgServiceMins!= null ? Math.round(summary.avgServiceMins): null;
  const abandonRate   = summary?.abandonRate   ?? 0;

  // Efficiency = served / max(joined, 1) → clamp 0..100.
  const efficiency = joined > 0 ? Math.min(100, Math.round((served / joined) * 100)) : 0;

  const activeQueues = queues.filter((q) => (q.status || 'active') === 'active');
  const totalQueues  = queues.length;

  return (
    <HybridDashboardShell>
      <div className="space-y-6 pt-2">
        <PageHeader
          eyebrow="Team performance"
          title="Operations"
          subtitle="Live KPIs from your real ticket flow over the last 24 hours."
          crumbs={[{ label: 'Workspace' }, { label: 'Operations' }]}
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Active queues"
            value={`${activeQueues.length} / ${totalQueues || activeQueues.length}`}
            delta={servingNow ? `${servingNow} serving now` : 'No active service'}
            tone="emerald"
            icon={Users}
          />
          <StatCard
            label="Efficiency"
            value={`${efficiency}%`}
            delta="Served vs joined (24h)"
            tone="cyan"
            icon={Gauge}
          />
          <StatCard
            label="Avg service time"
            value={avgServiceMins != null ? `${avgServiceMins}m` : '—'}
            delta="Per ticket"
            tone="violet"
            icon={Timer}
          />
          <StatCard
            label="Tickets served (24h)"
            value={served}
            delta={joined ? `of ${joined} joined` : 'No activity yet'}
            tone="amber"
            icon={Award}
          />
        </div>

        <section className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-white">Staff efficiency rankings</h3>
              <p className="text-xs text-slate-400">Per-member performance unlocks once staff join your workspace</p>
            </div>
          </div>

          <div className="mt-2">
            <EmptyState
              icon={UserPlus}
              tone="info"
              size="sm"
              title="No per-staff data yet"
              message="Invite staff to your organization to start tracking served tickets, average handle time, and efficiency rankings per person."
              cta={{
                label: 'Invite team members',
                variant: 'primary',
                onClick: () => { window.location.href = ROUTES.owner.settings; },
              }}
            />
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
            <h3 className="text-sm font-semibold text-white">Queue status</h3>
            <p className="text-xs text-slate-400">Live state per queue</p>
            {queues.length === 0 ? (
              <p className="mt-4 text-xs text-slate-500">
                No queues yet. Create one in{' '}
                <Link to={ROUTES.owner.settings} className="text-cyan-300 hover:text-cyan-200">
                  Settings → Queues
                </Link>.
              </p>
            ) : (
              <ul className="mt-4 space-y-2">
                {queues.map((q) => {
                  const isActive = (q.status || 'active') === 'active';
                  return (
                    <li key={q._id} className="flex items-center justify-between rounded-2xl border border-white/[0.05] bg-white/[0.03] p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{q.name}</p>
                        <p className="mt-0.5 text-[10px] text-slate-400">
                          {isActive ? 'Accepting tickets' : 'Paused'}
                        </p>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${
                        isActive
                          ? 'bg-emerald-500/10 text-emerald-300 ring-emerald-400/25'
                          : 'bg-slate-500/10 text-slate-300 ring-slate-400/25'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-slate-400'}`} />
                        {isActive ? 'Active' : 'Idle'}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
            <h3 className="text-sm font-semibold text-white">Service performance</h3>
            <p className="text-xs text-slate-400">Last 24 hours</p>
            <ul className="mt-4 space-y-3">
              {[
                { label: 'Tickets served',  value: served },
                { label: 'Tickets waiting', value: waitingNow },
                { label: 'Tickets serving', value: servingNow },
                { label: 'Average wait',    value: avgWaitMins != null ? `${avgWaitMins}m` : '—' },
                { label: 'Abandon rate',    value: `${abandonRate}%` },
                { label: 'Efficiency',      value: `${efficiency}%` },
              ].map((row) => (
                <li key={row.label} className="flex items-center justify-between border-b border-white/[0.04] pb-2 last:border-0">
                  <span className="text-xs text-slate-400">{row.label}</span>
                  <span className="text-sm font-semibold text-white tabular-nums">{row.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </HybridDashboardShell>
  );
}
