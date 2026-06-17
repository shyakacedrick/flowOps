// ============================================================================
//  LiveQueuePage — "What is happening right now?"
// ----------------------------------------------------------------------------
//  Real-time monitoring view backed by /api/queues + /api/tickets (no
//  simulation). Stats, the "now serving" list, the upcoming queue and the
//  health panel all derive from live MongoDB data, refreshed via SSE +
//  visibility-aware polling fallback. A 1s ticker keeps wait-time labels
//  fresh without re-fetching.
// ============================================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Radio, Users, Clock, Activity, Play, Pause, ArrowRight, Inbox,
} from 'lucide-react';
import HybridDashboardShell from '@/features/dashboard/components/HybridDashboardShell.jsx';
import PageHeader, { StatCard } from '@/shared/components/PageHeader.jsx';
import QueueHealthPanel from '@/features/queue/components/QueueHealthPanel.jsx';
import EmptyState from '@/shared/components/EmptyState.jsx';
import { useQueues } from '@/features/queue/hooks/useQueues.js';
import { useOrgEventStream } from '@/shared/hooks/useEventStream.js';
import ticketApi from '@/services/ticketApi.js';

const REFRESH_MS = 15_000;
const SLA_THRESHOLD_MS = 15 * 60_000;       // 15m — "delayed"
const CRITICAL_THRESHOLD_MS = 30 * 60_000;  // 30m — "critical"
const TICK_MS = 1_000;                      // wait-label refresh cadence

export default function LiveQueuePage() {
  const { queues } = useQueues();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1s wall-clock tick so "Xm waiting" labels stay fresh without re-fetching.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), TICK_MS);
    return () => clearInterval(id);
  }, []);

  const refresh = useCallback(async () => {
    const res = await ticketApi.list();
    if (res.ok) setTickets(Array.isArray(res.data) ? res.data : []);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Visibility-aware polling fallback for when SSE is blocked.
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    const id = setInterval(tick, REFRESH_MS);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [refresh]);

  // Live SSE updates — patch local state directly so the UI feels instant.
  const stream = useOrgEventStream();
  useEffect(() => {
    const offCreated = stream.on('ticket:created', (t) => {
      if (!t?._id) return;
      setTickets((prev) => (prev.some((x) => x._id === t._id) ? prev : [...prev, t]));
    });
    const offUpdated = stream.on('ticket:updated', (t) => {
      if (!t?._id) return;
      setTickets((prev) => {
        const idx = prev.findIndex((x) => x._id === t._id);
        if (idx === -1) return [...prev, t];
        const next = prev.slice();
        next[idx] = t;
        return next;
      });
    });
    const offDeleted = stream.on('ticket:deleted', ({ _id } = {}) => {
      if (!_id) return;
      setTickets((prev) => prev.filter((x) => x._id !== _id));
    });
    return () => { offCreated(); offUpdated(); offDeleted(); };
  }, [stream]);

  // -------------------------------------------------------------------------
  // Derived state
  // -------------------------------------------------------------------------
  const queueById = useMemo(() => {
    const m = new Map();
    queues.forEach((q) => m.set(q._id, q));
    return m;
  }, [queues]);

  const waiting = useMemo(
    () => tickets.filter((t) => t.status === 'waiting'),
    [tickets]
  );
  const serving = useMemo(
    () => tickets.filter((t) => t.status === 'serving'),
    [tickets]
  );

  const waitMsOf = (t) => Date.now() - new Date(t.joinedAt).getTime();

  const avgWaitMin = useMemo(() => {
    if (waiting.length === 0) return 0;
    const sum = waiting.reduce((acc, t) => acc + waitMsOf(t), 0);
    return Math.max(0, Math.round(sum / waiting.length / 60_000));
  }, [waiting]);

  const { normal, delayed, critical } = useMemo(() => {
    let n = 0, d = 0, c = 0;
    waiting.forEach((t) => {
      const w = waitMsOf(t);
      if (w >= CRITICAL_THRESHOLD_MS) c += 1;
      else if (w >= SLA_THRESHOLD_MS) d += 1;
      else n += 1;
    });
    return { normal: n, delayed: d, critical: c };
  }, [waiting]);

  const healthLabel = critical > 0 ? 'Critical' : delayed > 0 ? 'At risk' : 'Stable';
  const healthTone  = critical > 0 ? 'rose'     : delayed > 0 ? 'amber'   : 'emerald';

  const upcoming = useMemo(() => {
    return waiting
      .slice()
      .sort((a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime())
      .slice(0, 6)
      .map((t) => {
        const queue = queueById.get(t.queueId);
        const w = waitMsOf(t);
        return {
          id: t._id,
          ticket: t.ticketNumber,
          name: t.customerName,
          queueName: queue?.name || 'Queue',
          waitMin: Math.max(0, Math.round(w / 60_000)),
          severity: w >= CRITICAL_THRESHOLD_MS ? 'critical'
                  : w >= SLA_THRESHOLD_MS    ? 'delayed'
                  : 'normal',
        };
      });
  }, [waiting, queueById]);

  const nowServing = useMemo(() => {
    return serving.map((t) => {
      const queue = queueById.get(t.queueId);
      return {
        id: t._id,
        ticket: t.ticketNumber,
        name: t.customerName,
        queueName: queue?.name || 'Queue',
        state: 'serving',
      };
    });
  }, [serving, queueById]);

  return (
    <HybridDashboardShell>
      <div className="space-y-6 pt-2">
        <PageHeader
          eyebrow="Real-time monitoring"
          title="Live Queue"
          subtitle="Every active ticket, counter, and wait time across your workspace — straight from MongoDB."
          crumbs={[{ label: 'Operations' }, { label: 'Live Queue' }]}
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Waiting"
            value={waiting.length}
            delta={`Across ${queues.length || 0} queue${queues.length === 1 ? '' : 's'}`}
            tone="cyan"
            icon={Users}
          />
          <StatCard
            label="Serving now"
            value={serving.length}
            delta={serving.length === 0 ? 'No active tickets' : 'In progress'}
            tone="violet"
            icon={Radio}
          />
          <StatCard
            label="Avg wait"
            value={`${avgWaitMin}m`}
            delta="Current waiters"
            tone="amber"
            icon={Clock}
          />
          <StatCard
            label="Queue health"
            value={healthLabel}
            delta={`${normal} ok · ${delayed} delayed · ${critical} critical`}
            tone={healthTone}
            icon={Activity}
          />
        </div>

        <div className="grid gap-5 xl:grid-cols-12">
          <section className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5 xl:col-span-7">
            <div className="flex items-baseline justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Now serving</h3>
                <p className="text-xs text-slate-400">Tickets currently being served across all queues</p>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 ring-1 ring-emerald-400/20">
                Live
              </span>
            </div>

            {loading && nowServing.length === 0 ? (
              <p className="py-10 text-center text-xs text-slate-500">Loading tickets…</p>
            ) : nowServing.length === 0 ? (
              <div className="py-6">
                <EmptyState
                  icon={Inbox}
                  tone="info"
                  size="sm"
                  title="Nothing being served right now"
                  message="As soon as staff call a waiting customer, the ticket will appear here in real time."
                />
              </div>
            ) : (
              <ul className="mt-4 divide-y divide-white/[0.05]">
                {nowServing.map((c) => (
                  <li key={c.id} className="flex items-center gap-4 py-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/[0.05] text-[10px] font-bold text-slate-200">
                      {c.ticket}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">{c.name}</p>
                      <p className="truncate text-xs text-slate-400">{c.queueName}</p>
                    </div>
                    <StateChip state={c.state} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-3xl border border-white/[0.06] bg-slate-950/40 p-5 xl:col-span-5">
            <div className="flex items-baseline justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Next up</h3>
                <p className="text-xs text-slate-400">Waiting tickets in arrival order</p>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                Top {Math.min(upcoming.length, 6)}
              </span>
            </div>

            {upcoming.length === 0 ? (
              <p className="mt-4 py-6 text-center text-xs text-slate-500">
                No one is waiting right now.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {upcoming.map((it, i) => (
                  <li key={it.id} className="group flex gap-4">
                    <div className="w-14 shrink-0 pt-1 text-right">
                      <p className="inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-slate-500">
                        <Clock className="h-3 w-3" /> {it.waitMin}m
                      </p>
                    </div>
                    <div className="relative flex-1 pl-4">
                      <span className={`absolute -left-[3px] top-2 h-2.5 w-2.5 rounded-full ring-4 ring-slate-950 ${SEVERITY_DOT[it.severity]}`} />
                      {i < upcoming.length - 1 && (
                        <span className="absolute left-0 top-5 h-full w-px bg-white/[0.08]" />
                      )}
                      <div className="rounded-2xl px-3 py-1.5 transition-colors group-hover:bg-white/[0.03]">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <p className="font-mono text-sm font-semibold tracking-tight text-white">
                              #{it.ticket}
                            </p>
                            <ArrowRight className="h-3 w-3 shrink-0 text-slate-600" />
                            <p className="truncate text-xs text-slate-400">{it.name}</p>
                          </div>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${SEVERITY_PILL[it.severity]}`}>
                            {SEVERITY_LABEL[it.severity]}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[10px] text-slate-500">{it.queueName}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <QueueHealthPanel
          normal={normal}
          delayed={delayed}
          critical={critical}
          queueLength={waiting.length}
        />
      </div>
    </HybridDashboardShell>
  );
}

const SEVERITY_DOT = {
  normal:   'bg-emerald-500',
  delayed:  'bg-amber-500',
  critical: 'bg-rose-500',
};
const SEVERITY_PILL = {
  normal:   'bg-emerald-500/10 text-emerald-300 ring-emerald-400/20',
  delayed:  'bg-amber-500/10 text-amber-300 ring-amber-400/20',
  critical: 'bg-rose-500/10 text-rose-300 ring-rose-400/20',
};
const SEVERITY_LABEL = {
  normal:   'On track',
  delayed:  'Delayed',
  critical: 'Critical',
};

function StateChip({ state }) {
  const map = {
    serving: { label: 'Serving', cls: 'bg-cyan-500/10 text-cyan-300 ring-cyan-400/20', Icon: Play },
    idle:    { label: 'Idle',    cls: 'bg-white/[0.05] text-slate-300 ring-white/10',  Icon: Pause },
  }[state] || { label: state, cls: 'bg-white/[0.05] text-slate-300 ring-white/10', Icon: Pause };
  const { Icon } = map;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${map.cls}`}>
      <Icon className="h-3 w-3" /> {map.label}
    </span>
  );
}
