// ============================================================================
//  Admin · Overview — real platform-wide snapshot
// ----------------------------------------------------------------------------
//  Pulls three live sources:
//    - GET /api/analytics/summary?range=30d   (platform-wide for admins)
//    - GET /api/organizations                 (all orgs — admin scope)
//    - GET /api/users                         (cross-tenant user list)
//    - GET /api/activities                    (live timeline; reused)
//
//  Everything here is computed from real records — no mock data. The page
//  re-uses BackendActivityTimeline + QueueManagerCard so we don't reinvent
//  components that already work platform-wide for admins.
// ============================================================================

import { useEffect, useMemo, useState } from 'react';
import {
  Building2, Users as UsersIcon, Activity, Gauge,
  Zap, ShieldCheck, AlertCircle, RefreshCw,
} from 'lucide-react';
import AdminLayout from '@/features/admin/components/AdminShell.jsx';
import PageHeader, { StatCard } from '@/shared/components/PageHeader.jsx';
import BackendActivityTimeline
  from '@/features/customer-feed/components/BackendActivityTimeline.jsx';
import QueueManagerCard
  from '@/features/queue/components/QueueManagerCard.jsx';
import useOrganizations from '@/features/admin/hooks/useOrganizations.js';
import useUsers          from '@/features/admin/hooks/useUsers.js';
import analyticsApi      from '@/services/analyticsApi.js';

const INDUSTRY_LABELS = {
  clinic: 'Clinics', hospital: 'Hospitals', bank: 'Banks',
  salon: 'Salons', restaurant: 'Restaurants', retail: 'Retail',
  government: 'Government', other: 'Other',
};

export default function Overview() {
  const { organizations, status: orgStatus, refresh: refreshOrgs } = useOrganizations();
  const { users,         status: userStatus, refresh: refreshUsers } = useUsers();
  const { summary, status: sumStatus, error: sumError, refresh: refreshSum } = usePlatformSummary();

  const loading = orgStatus === 'loading' || userStatus === 'loading' || sumStatus === 'loading';

  // ── Derived figures ──────────────────────────────────────────────────────
  const totalOrgs       = organizations.length;
  const suspendedOrgs   = organizations.filter((o) => o.suspendedAt).length;
  const totalUsers      = users.length;
  const suspendedUsers  = users.filter((u) => u.suspendedAt).length;
  const verifiedUsers   = users.filter((u) => u.emailVerifiedAt).length;
  const verifyPct       = totalUsers ? Math.round((verifiedUsers / totalUsers) * 100) : 0;

  const industryRows = useMemo(() => groupByIndustry(organizations), [organizations]);
  const planRows     = useMemo(() => groupByPlan(organizations),     [organizations]);

  // From /analytics/summary (live ops figures, last 30 days, platform-wide):
  const ticketsJoined   = summary?.totals?.joined        ?? null;
  const ticketsServed   = summary?.totals?.served        ?? null;
  const waitingNow      = summary?.totals?.waitingNow    ?? null;
  const avgWaitMins     = summary?.avgWaitMins;
  const abandonRate     = summary?.abandonRate;

  const refreshAll = () => {
    refreshOrgs(); refreshUsers(); refreshSum();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Platform overview · Live"
          title="FlowOps Command Center"
          subtitle="The state of the entire platform — organizations, users, and live operations."
          crumbs={[{ label: 'Admin' }, { label: 'Overview' }]}
          actions={(
            <button
              onClick={refreshAll}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/[0.08] disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          )}
        />

        {sumError && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Analytics summary failed: {sumError}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard label="Organizations"     value={fmt(totalOrgs)}        delta={`${suspendedOrgs} suspended`}                      tone="violet"  icon={Building2} />
          <StatCard label="Users"             value={fmt(totalUsers)}       delta={`${suspendedUsers} suspended`}                    tone="cyan"    icon={UsersIcon} />
          <StatCard label="Verified emails"   value={`${verifyPct}%`}       delta={`${verifiedUsers} / ${totalUsers}`}                tone="emerald" icon={ShieldCheck} />
          <StatCard label="Tickets joined (30d)" value={fmt(ticketsJoined)} delta={ticketsServed != null ? `${fmt(ticketsServed)} served` : '—'} tone="amber" icon={Gauge} />
          <StatCard label="Waiting now"       value={fmt(waitingNow)}       delta="Live across platform"                              tone="rose"    icon={Zap} />
          <StatCard label="Avg wait (30d)"    value={avgWaitMins != null ? `${avgWaitMins}m` : '—'} delta={abandonRate != null ? `${abandonRate}% abandon` : '—'} tone="emerald" icon={Activity} />
        </div>

        <div className="grid gap-5 xl:grid-cols-12">
          {/* Live activity — already polls every 5s, already scoped {} for admins */}
          <div className="xl:col-span-7">
            <BackendActivityTimeline
              title="Real-time platform activity"
              subtitle="Live from /api/activities · polls every 5s · platform-wide"
              limit={20}
            />
          </div>

          <div className="xl:col-span-5 space-y-5">
            <BreakdownCard
              title="Industry mix"
              subtitle={`${totalOrgs} organization${totalOrgs === 1 ? '' : 's'}`}
              rows={industryRows}
              empty="No organizations yet."
            />
            <BreakdownCard
              title="Plan distribution"
              subtitle="Active subscriptions"
              rows={planRows}
              empty="No organizations yet."
            />
          </div>

          {/* Cross-org queue manager — already supports admin scope */}
          <div className="xl:col-span-12">
            <QueueManagerCard
              readOnly
              title="All queues (platform-wide)"
              subtitle="Live from the backend · unscoped view for platform admins"
            />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmt(n) {
  if (n == null) return '—';
  return Number(n).toLocaleString();
}

function groupByIndustry(orgs) {
  if (!orgs.length) return [];
  const counts = new Map();
  for (const o of orgs) {
    const key = o.industry || 'other';
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const total = orgs.length;
  return Array.from(counts.entries())
    .map(([k, count]) => ({
      key:   k,
      name:  INDUSTRY_LABELS[k] || k,
      count,
      pct:   Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count);
}

function groupByPlan(orgs) {
  if (!orgs.length) return [];
  const counts = new Map();
  for (const o of orgs) {
    const key = o.plan || 'starter';
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const total = orgs.length;
  return Array.from(counts.entries())
    .map(([k, count]) => ({
      key:   k,
      name:  k[0].toUpperCase() + k.slice(1),
      count,
      pct:   Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count);
}

// Lightweight in-page hook: pulls platform-wide summary (no orgId param).
function usePlatformSummary() {
  const [summary, setSummary] = useState(null);
  const [status,  setStatus]  = useState('idle');
  const [error,   setError]   = useState(null);

  const refresh = async () => {
    setStatus('loading'); setError(null);
    const res = await analyticsApi.summary?.('30d') ?? await fallbackSummary('30d');
    if (!res.ok) {
      setError(res.message || 'Failed to load summary');
      setStatus('error');
      return;
    }
    setSummary(res.data);
    setStatus('ready');
  };

  useEffect(() => { refresh(); }, []);
  return { summary, status, error, refresh };
}

// analyticsApi shipped without `.summary()` — fall back to a direct call.
// (Adding the method here avoids editing the shared service for one caller.)
async function fallbackSummary(range) {
  const { api } = await import('@/services/api.js');
  return api.get(`/analytics/summary?range=${encodeURIComponent(range)}`);
}

function BreakdownCard({ title, subtitle, rows, empty }) {
  return (
    <section className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
      <div className="flex items-baseline justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
        </div>
      </div>
      {rows.length === 0 ? (
        <p className="mt-4 py-6 text-center text-xs text-slate-500">{empty}</p>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {rows.map((row) => (
            <li key={row.key}>
              <div className="flex items-baseline justify-between text-xs">
                <span className="font-medium text-slate-200">{row.name}</span>
                <span className="font-mono text-slate-400">
                  {row.count}
                  <span className="opacity-50"> · {row.pct}%</span>
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-400 via-cyan-400 to-blue-500"
                  style={{ width: `${Math.max(row.pct, 4)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
