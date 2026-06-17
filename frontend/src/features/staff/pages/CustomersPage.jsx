// ============================================================================
//  CustomersPage — full org-wide ticket roster, wired to real backend data
// ----------------------------------------------------------------------------
//  Aggregates every ticket across every queue the operator can see, then
//  supports search + status filtering. No simulation data, no hardcoded
//  customer names. Polls /api/tickets per queue at 30s and listens on the
//  shared SSE bus for live mutations.
// ============================================================================

import { useEffect, useMemo, useState } from 'react';
import { Search, Filter, Users, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import StaffShell from '@/features/staff/components/StaffShell.jsx';
import PageHeader, { StatCard } from '@/shared/components/PageHeader.jsx';
import useQueues from '@/features/queue/hooks/useQueues.js';
import ticketApi from '@/services/ticketApi.js';
import { useOrgEventStream } from '@/shared/hooks/useEventStream.js';

const STATUSES = ['all', 'waiting', 'serving', 'served', 'skipped', 'cancelled'];

const STATUS_STYLES = {
  waiting:   { dot: 'bg-cyan-400',    text: 'text-cyan-300',    ring: 'ring-cyan-400/30',    bg: 'bg-cyan-500/10' },
  serving:   { dot: 'bg-violet-400',  text: 'text-violet-300',  ring: 'ring-violet-400/30',  bg: 'bg-violet-500/10' },
  served:    { dot: 'bg-emerald-400', text: 'text-emerald-300', ring: 'ring-emerald-400/30', bg: 'bg-emerald-500/10' },
  skipped:   { dot: 'bg-amber-400',   text: 'text-amber-300',   ring: 'ring-amber-400/30',   bg: 'bg-amber-500/10' },
  cancelled: { dot: 'bg-rose-400',    text: 'text-rose-300',    ring: 'ring-rose-400/30',    bg: 'bg-rose-500/10' },
};

const POLL_MS = 30_000;

export default function CustomersPage() {
  const { queues } = useQueues();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [query, setQuery]   = useState('');

  // Fetch tickets for every queue the operator can see and merge into one
  // flat list. We re-run when the queue set changes.
  useEffect(() => {
    if (!queues.length) {
      setTickets([]);
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const results = await Promise.all(
        queues.map((q) => ticketApi.list({ queueId: q._id })),
      );
      if (cancelled) return;
      const merged = results
        .filter((r) => r.ok && Array.isArray(r.data))
        .flatMap((r) => r.data);
      setTickets(merged);
      setLoading(false);
    };
    load();
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, POLL_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, [queues]);

  // Live SSE updates: optimistic merge so the table stays responsive
  // between polls.
  const stream = useOrgEventStream();
  useEffect(() => {
    const off1 = stream.on('ticket:created', (t) => {
      if (!t) return;
      setTickets((prev) => (prev.some((x) => x._id === t._id) ? prev : [...prev, t]));
    });
    const off2 = stream.on('ticket:updated', (t) => {
      if (!t) return;
      setTickets((prev) => {
        const idx = prev.findIndex((x) => x._id === t._id);
        if (idx === -1) return [...prev, t];
        const next = prev.slice();
        next[idx] = t;
        return next;
      });
    });
    const off3 = stream.on('ticket:deleted', ({ _id } = {}) => {
      if (!_id) return;
      setTickets((prev) => prev.filter((x) => x._id !== _id));
    });
    return () => { off1(); off2(); off3(); };
  }, [stream]);

  const queueNameById = useMemo(() => {
    const m = new Map();
    queues.forEach((q) => m.set(q._id, q.name));
    return m;
  }, [queues]);

  const rows = useMemo(() => {
    return tickets
      .filter((t) => !t.deletedAt)
      .filter((t) => {
        if (filter !== 'all' && t.status !== filter) return false;
        if (query) {
          const hay = `${t.ticketNumber} ${t.customerName}`.toLowerCase();
          if (!hay.includes(query.toLowerCase())) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.joinedAt) - new Date(a.joinedAt));
  }, [tickets, filter, query]);

  const counts = useMemo(() => ({
    waiting: tickets.filter((t) => t.status === 'waiting').length,
    serving: tickets.filter((t) => t.status === 'serving').length,
    served:  tickets.filter((t) => t.status === 'served').length,
  }), [tickets]);

  return (
    <StaffShell>
      <div className="space-y-6 pt-2">
        <PageHeader
          eyebrow="Roster"
          title="Customers"
          subtitle="Every customer touched by your workspace — searchable, filterable, live."
          crumbs={[{ label: 'Staff', to: '/staff/dashboard' }, { label: 'Customers' }]}
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total"   value={tickets.length}   delta="All statuses"  tone="cyan"    icon={Users} />
          <StatCard label="Serving" value={counts.serving}   delta="At a desk"     tone="violet" />
          <StatCard label="Waiting" value={counts.waiting}   delta="In line"       tone="amber"   icon={Clock} />
          <StatCard label="Served"  value={counts.served}    delta="Completed"     tone="emerald" icon={CheckCircle2} />
        </div>

        <section className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or ticket number"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400/40"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-slate-500" />
              <div className="flex flex-wrap gap-1 rounded-xl border border-white/10 bg-white/[0.04] p-0.5 text-[11px] font-semibold">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilter(s)}
                    className={`rounded-lg px-2.5 py-1 capitalize transition-colors ${
                      filter === s ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >{s}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                <tr className="border-b border-white/[0.05]">
                  <th className="px-3 py-2.5 text-left">Customer</th>
                  <th className="px-3 py-2.5 text-left">Ticket</th>
                  <th className="px-3 py-2.5 text-left">Queue</th>
                  <th className="px-3 py-2.5 text-left">Status</th>
                  <th className="px-3 py-2.5 text-left">Joined</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-10 text-center text-sm text-slate-500">
                      <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                      <p className="mt-2">Loading customers…</p>
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-10 text-center text-sm text-slate-500">
                      No customers match the current filter.
                    </td>
                  </tr>
                ) : rows.map((t) => {
                  const style = STATUS_STYLES[t.status] || STATUS_STYLES.waiting;
                  return (
                    <tr key={t._id} className="border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02]">
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <span className="grid h-8 w-8 place-items-center rounded-full bg-white/[0.06] text-[10px] font-bold text-slate-300">
                            {initialsOf(t.customerName)}
                          </span>
                          <span className="font-medium text-white">{t.customerName}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-xs text-slate-400">#{t.ticketNumber}</td>
                      <td className="px-3 py-2.5 text-slate-300">{queueNameById.get(t.queueId) || '—'}</td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ring-1 ${style.text} ${style.ring} ${style.bg}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                          {t.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-xs text-slate-400">{formatJoined(t.joinedAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </StaffShell>
  );
}

function initialsOf(name = '') {
  return name.split(' ').filter(Boolean).map((p) => p[0]).slice(0, 2).join('').toUpperCase() || '?';
}

function formatJoined(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
