// ============================================================================
//  Admin · Audit Logs — real Activity feed, platform-wide
// ----------------------------------------------------------------------------
//  Backed by /api/activities, which already returns the unscoped platform
//  feed for platform_admin callers. Adds a type filter (server-side) and
//  a search box (client-side) on top of the underlying timeline.
// ============================================================================

import { useMemo, useState } from 'react';
import {
  ScrollText, Search, Filter, RefreshCw, AlertCircle, ShieldAlert,
} from 'lucide-react';
import AdminLayout from '@/features/admin/components/AdminShell.jsx';
import PageHeader, { StatCard } from '@/shared/components/PageHeader.jsx';
import { SkeletonListRows } from '@/shared/components/Skeleton.jsx';
import { useActivities } from '@/features/customer-feed/hooks/useActivities.js';

// Must match backend/src/models/Activity.js ACTIVITY_TYPES.
const TYPE_OPTIONS = [
  { value: '',                       label: 'All types' },
  { value: 'user_registered',        label: 'User registered' },
  { value: 'user_login',             label: 'User login' },
  { value: 'organization_created',   label: 'Organization created' },
  { value: 'queue_created',          label: 'Queue created' },
  { value: 'queue_updated',          label: 'Queue updated' },
  { value: 'queue_deleted',          label: 'Queue deleted' },
  { value: 'ticket_created',         label: 'Ticket created' },
  { value: 'ticket_serving',         label: 'Ticket serving' },
  { value: 'ticket_served',          label: 'Ticket served' },
  { value: 'ticket_skipped',         label: 'Ticket skipped' },
  { value: 'ticket_cancelled',       label: 'Ticket cancelled' },
];

const TONE = {
  user_registered:      'cyan',
  user_login:           'sky',
  organization_created: 'violet',
  queue_created:        'cyan',
  queue_updated:        'amber',
  queue_deleted:        'rose',
  ticket_created:       'cyan',
  ticket_serving:       'sky',
  ticket_served:        'emerald',
  ticket_skipped:       'amber',
  ticket_cancelled:     'rose',
};

const TONE_STYLE = {
  cyan:    'bg-cyan-500/10 text-cyan-300 ring-cyan-400/30',
  sky:     'bg-sky-500/10 text-sky-300 ring-sky-400/30',
  emerald: 'bg-emerald-500/10 text-emerald-300 ring-emerald-400/30',
  amber:   'bg-amber-500/10 text-amber-300 ring-amber-400/30',
  rose:    'bg-rose-500/10 text-rose-300 ring-rose-400/30',
  violet:  'bg-violet-500/10 text-violet-300 ring-violet-400/30',
};

export default function AuditLogs() {
  const [type, setType]   = useState('');
  const [query, setQuery] = useState('');

  // 200 is the server cap; matches "everything we can show on one page".
  const { activities, status, error, refresh } = useActivities({ limit: 200, type, pollMs: 10000 });

  const rows = useMemo(() => {
    if (!query) return activities;
    const q = query.toLowerCase();
    return activities.filter((a) => {
      const actor = a.actorId?.name || '';
      return `${a.description || ''} ${a.type || ''} ${actor}`.toLowerCase().includes(q);
    });
  }, [activities, query]);

  // Last-24h derived counts (kept light — done client-side over the page).
  const last24h = useMemo(() => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    return activities.filter((a) => new Date(a.createdAt).getTime() >= cutoff);
  }, [activities]);
  const failedLogins = last24h.filter((a) => a.type === 'user_login' && a.metadata?.success === false).length;
  const cancellations = last24h.filter((a) => a.type === 'ticket_cancelled' || a.type === 'queue_deleted').length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Security & compliance"
          title="Audit Logs"
          subtitle="Searchable record of every action across the platform."
          crumbs={[{ label: 'Admin' }, { label: 'Audit Logs' }]}
          actions={(
            <button
              onClick={refresh}
              disabled={status === 'loading'}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/[0.08] disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${status === 'loading' ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          )}
        />

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Events (loaded)" value={activities.length}   delta="Newest 200" tone="violet" icon={ScrollText} />
          <StatCard label="Last 24h"        value={last24h.length}      delta="Across platform" tone="cyan" />
          <StatCard label="Login failures"  value={failedLogins}        delta="Last 24h"   tone="amber" icon={ShieldAlert} />
          <StatCard label="Destructive"     value={cancellations}       delta="Cancels + deletes · 24h" tone="rose" />
        </div>

        <section className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="Search actor, description, or type"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-violet-400/40 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-slate-500" />
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs font-semibold text-slate-200 focus:border-violet-400/40 focus:outline-none"
              >
                {TYPE_OPTIONS.map((o) => <option key={o.value || 'all'} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <ol className="relative mt-5 space-y-2 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-px before:bg-white/[0.05]">
            {rows.map((a) => {
              const tone = TONE_STYLE[TONE[a.type] || 'cyan'];
              return (
                <li key={a._id} className="relative flex items-start gap-3">
                  <span className="relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/[0.04] ring-2 ring-[#0B1120]">
                    <span className={`h-2 w-2 rounded-full ${tone.split(' ')[0].replace('/10', '')}`} />
                  </span>
                  <div className="min-w-0 flex-1 rounded-2xl border border-white/[0.05] bg-white/[0.02] p-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      <p className="text-sm font-semibold text-white">
                        <span className="font-mono text-cyan-300">{a.type}</span>
                        {a.actorId?.name && (
                          <>
                            <span className="ml-2 text-slate-400">by</span>
                            <span className="ml-1.5">{a.actorId.name}</span>
                            <span className="ml-1 text-[10px] text-slate-500">({a.actorId.role || '—'})</span>
                          </>
                        )}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ring-1 ${tone}`}>
                          {TYPE_OPTIONS.find((o) => o.value === a.type)?.label || a.type}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500">{fmtTs(a.createdAt)}</span>
                      </div>
                    </div>
                    {a.description && <p className="mt-1 text-[12px] text-slate-300">→ {a.description}</p>}
                    <p className="mt-0.5 font-mono text-[10px] text-slate-500">{a._id}</p>
                  </div>
                </li>
              );
            })}
            {rows.length === 0 && status === 'ready' && (
              <li className="py-10 text-center text-sm text-slate-500">No matching events.</li>
            )}
            {status === 'loading' && rows.length === 0 && (
              <SkeletonListRows rows={5} />
            )}
          </ol>
        </section>
      </div>
    </AdminLayout>
  );
}

function fmtTs(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  const now = Date.now();
  const diff = Math.floor((now - d.getTime()) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
