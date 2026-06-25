// ============================================================================
//  OperationsPage — owner KPIs and per-queue health, real data
// ----------------------------------------------------------------------------
//  All numbers are sourced from /api/analytics/summary and /api/queues.
//  Per-staff rankings are derived from `summary.byStaff` (populated by the
//  analytics aggregation once tickets are picked up by named staff). Until
//  any staff has served a ticket, the section falls back to an empty state.
// ============================================================================

import { Link } from 'react-router-dom';
import { Users, Gauge, Timer, Award, UserPlus } from 'lucide-react';
import HybridDashboardShell from '@/features/dashboard/components/HybridDashboardShell.jsx';
import PageHeader, { StatCard } from '@/shared/components/PageHeader.jsx';
import EmptyState from '@/shared/components/EmptyState.jsx';
import useAnalyticsSummary from '@/features/analytics/hooks/useAnalyticsSummary.js';
import useQueues from '@/features/queue/hooks/useQueues.js';
import { ROUTES } from '@/shared/constants/routes.js';

// Build initials from a display name, e.g. "Jane Doe" → "JD".
// Falls back to the first two letters of any single token, or "?".
function initialsOf(name) {
  if (!name || typeof name !== 'string') return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Medal accent for top-3 ranks; everyone else gets a neutral slate ring.
const RANK_STYLES = [
  'bg-amber-400/15 text-amber-200 ring-amber-300/40',   // 1st
  'bg-slate-300/10 text-slate-200 ring-slate-300/30',   // 2nd
  'bg-orange-500/15 text-orange-200 ring-orange-400/30',// 3rd
];
const RANK_FALLBACK = 'bg-white/[0.04] text-slate-300 ring-white/10';

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

  // Per-staff rankings. The backend already sorts by served desc and caps
  // at 10. We normalise the efficiency bar against the top performer's
  // served count so the leader always renders at 100%.
  const staffRankings = Array.isArray(summary?.byStaff) ? summary.byStaff : [];
  const topServed = staffRankings[0]?.served || 0;

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
              <p className="text-xs text-slate-400">
                {staffRankings.length > 0
                  ? `Top ${staffRankings.length} operator${staffRankings.length === 1 ? '' : 's'} by tickets served in the last 24h`
                  : 'Per-member performance unlocks once staff start serving tickets'}
              </p>
            </div>
            {staffRankings.length > 0 && (
              <span className="rounded-full border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 text-[10px] uppercase tracking-widest text-slate-300">
                Live
              </span>
            )}
          </div>

          <div className="mt-2">
            {staffRankings.length === 0 ? (
              <EmptyState
                icon={UserPlus}
                tone="info"
                size="sm"
                title="No per-staff data yet"
                message="Invite staff to your organization and have them pick up tickets to start tracking served counts, average handle time, and efficiency rankings per person."
                cta={{
                  label: 'Invite team members',
                  variant: 'primary',
                  onClick: () => { window.location.href = ROUTES.owner.settings; },
                }}
              />
            ) : (
              <ul className="mt-3 space-y-2">
                {staffRankings.map((member, idx) => {
                  const rankStyle = RANK_STYLES[idx] || RANK_FALLBACK;
                  // Efficiency bar = served / top served. Always shows the
                  // leader at 100%; everyone else proportional.
                  const barPct = topServed > 0
                    ? Math.max(4, Math.round((member.served / topServed) * 100))
                    : 0;
                  return (
                    <li
                      key={member.userId}
                      className="flex items-center gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.03] p-3"
                    >
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ring-1 ${rankStyle}`}
                        title={`Rank #${idx + 1}`}
                      >
                        {initialsOf(member.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-white">
                            <span className="mr-1.5 text-[10px] font-normal text-slate-500">#{idx + 1}</span>
                            {member.name}
                          </p>
                          <p className="shrink-0 text-xs tabular-nums text-slate-300">
                            <span className="font-semibold text-white">{member.served}</span>
                            <span className="ml-1 text-slate-500">served</span>
                          </p>
                        </div>
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.04]">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400"
                            style={{ width: `${barPct}%` }}
                          />
                        </div>
                        <p className="mt-1 text-[10px] text-slate-500">
                          Avg handle{' '}
                          <span className="text-slate-300">
                            {member.avgHandleMins != null ? `${member.avgHandleMins}m` : '—'}
                          </span>
                          {member.email && (
                            <span className="ml-2 text-slate-600">· {member.email}</span>
                          )}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
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
