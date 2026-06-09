import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Clock, CheckCircle2, Activity, PhoneCall, SkipForward,
  AlertCircle, Coffee, Loader2, ChevronDown, RefreshCw,
} from 'lucide-react';
import StaffShell from '@/features/staff/components/StaffShell.jsx';
import PageHeader, { StatCard } from '@/shared/components/PageHeader.jsx';
import QueueManagerCard from '@/features/queue/components/QueueManagerCard.jsx';
import BackendActivityTimeline from '@/features/customer-feed/components/BackendActivityTimeline.jsx';
import useStaffQueue from '@/features/staff/hooks/useStaffQueue.js';
import useTickets from '@/features/queue/hooks/useTickets.js';
import { useConfirm } from '@/shared/components/ConfirmProvider.jsx';
import ticketApi from '@/services/ticketApi.js';

/**
 * StaffDashboardPage — "What should I focus on right now?"
 *
 * Phase 9.2: quick actions now mutate real tickets via ticketApi instead
 * of dispatching to the simulation engine. The operator picks an active
 * queue (persisted to localStorage), and Call/Mark served/Skip act on
 * the oldest waiting or currently serving ticket as appropriate.
 */
export default function StaffDashboardPage() {
  const {
    queues, queueId, queue, setQueueId,
    status: queuesStatus,
  } = useStaffQueue();

  const {
    tickets, status: ticketsStatus, error: ticketsError,
    refresh: refreshTickets,
    updateOptimistic, beginMutation, endMutation,
  } = useTickets(queueId);

  const confirm = useConfirm();
  const [pending, setPending] = useState(null); // 'call' | 'serve' | 'skip' | null
  const [actionError, setActionError] = useState(null);

  // ── Derived state from real tickets ─────────────────────────────────
  const waitingList = useMemo(
    () => tickets
      .filter((t) => t.status === 'waiting')
      .slice()
      .sort((a, b) => new Date(a.joinedAt) - new Date(b.joinedAt)),
    [tickets]
  );
  const servingTicket = useMemo(
    () => tickets.find((t) => t.status === 'serving') || null,
    [tickets]
  );
  const servedToday = useMemo(() => {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    return tickets.filter(
      (t) => t.status === 'served' && t.servedAt && new Date(t.servedAt) >= start
    ).length;
  }, [tickets]);

  const avgWaitMins = useMemo(() => {
    const recent = tickets
      .filter((t) => t.status === 'served' && t.servedAt && t.joinedAt)
      .slice(-20);
    if (!recent.length) return null;
    const totalMs = recent.reduce(
      (sum, t) => sum + (new Date(t.servedAt) - new Date(t.joinedAt)),
      0
    );
    return Math.max(1, Math.round(totalMs / recent.length / 60000));
  }, [tickets]);

  // ── Action helpers ──────────────────────────────────────────────────
  const transition = async (ticket, nextStatus, label) => {
    if (!ticket) return false;
    setActionError(null);
    setPending(label);
    beginMutation();
    const prev = ticket.status;
    updateOptimistic(ticket._id, { status: nextStatus });
    const res = await ticketApi.update(ticket._id, { status: nextStatus });
    endMutation();
    setPending(null);
    if (!res.ok) {
      updateOptimistic(ticket._id, { status: prev });
      setActionError(res.message || `Failed to ${label} ticket.`);
      return false;
    }
    return true;
  };

  const onCallNext = async () => {
    if (servingTicket) {
      setActionError('Finish the current ticket before calling the next one.');
      return;
    }
    const next = waitingList[0];
    if (!next) {
      setActionError('No customers waiting.');
      return;
    }
    await transition(next, 'serving', 'call');
  };

  const onMarkServed = async () => {
    if (!servingTicket) {
      setActionError('No one is currently being served.');
      return;
    }
    await transition(servingTicket, 'served', 'serve');
  };

  const onSkip = async () => {
    const target = servingTicket || waitingList[0];
    if (!target) {
      setActionError('No ticket to skip.');
      return;
    }
    const ok = await confirm({
      title: `Skip ticket ${target.ticketNumber}?`,
      message: `${target.customerName} will be marked skipped and removed from the line.`,
      confirmLabel: 'Skip',
      danger: true,
    });
    if (!ok) return;
    await transition(target, 'skipped', 'skip');
  };

  const onRequestHelp = () => {
    setActionError('Floor-manager paging is coming in Phase 12.');
  };

  // Shift progress — placeholder until Phase 13 wires real schedules.
  const shiftMins = 480;
  const elapsed   = Math.min(shiftMins, 145);
  const pct       = Math.round((elapsed / shiftMins) * 100);

  const callDisabled = pending === 'call' || !waitingList.length || !!servingTicket;
  const serveDisabled = pending === 'serve' || !servingTicket;
  const skipDisabled = pending === 'skip' || (!servingTicket && !waitingList.length);

  return (
    <StaffShell>
      <div className="space-y-6 pt-2">
        <PageHeader
          eyebrow="Today · operator overview"
          title="Good shift, operator"
          subtitle="Your queue is live. Quick actions move real tickets now."
          crumbs={[{ label: 'Staff' }, { label: 'Dashboard' }]}
        />

        <QueuePicker
          queues={queues}
          queueId={queueId}
          onChange={setQueueId}
          loading={queuesStatus === 'loading'}
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Waiting"      value={waitingList.length} delta={queue?.name || '—'}      tone="cyan"    icon={Users} />
          <StatCard label="Now serving"  value={servingTicket ? `#${servingTicket.ticketNumber}` : '—'} delta={servingTicket?.customerName || 'Idle'} tone="emerald" icon={CheckCircle2} />
          <StatCard label="Served today" value={servedToday} delta="Closed tickets" tone="violet"  icon={Activity} />
          <StatCard label="Avg wait"     value={avgWaitMins ? `${avgWaitMins}m` : '—'} delta="Last 20 served" tone="amber" icon={Clock} />
          <StatCard label="Queue status" value={queue?.status || '—'} delta={ticketsStatus === 'error' ? 'API offline' : 'Live'} tone="rose" />
        </div>

        <div className="grid gap-5 xl:grid-cols-12">
          {/* Quick actions */}
          <section className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5 xl:col-span-7">
            <div className="flex items-baseline justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Quick actions</h3>
                <p className="text-xs text-slate-400">
                  {queue
                    ? `Live on “${queue.name}” · ${waitingList.length} waiting`
                    : 'Select a queue to start serving'}
                </p>
              </div>
              <Link to="/staff/my-queue" className="text-xs font-semibold text-cyan-300 hover:text-cyan-200">
                Open queue →
              </Link>
            </div>

            {actionError && (
              <div role="alert" className="mt-3 flex items-start gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <QuickAction
                icon={PhoneCall} title="Call next"
                desc={
                  waitingList[0]
                    ? `#${waitingList[0].ticketNumber} · ${waitingList[0].customerName}`
                    : 'No customers waiting'
                }
                tone="cyan"
                loading={pending === 'call'}
                disabled={callDisabled}
                onClick={onCallNext}
              />
              <QuickAction
                icon={CheckCircle2} title="Mark served"
                desc={
                  servingTicket
                    ? `Finish #${servingTicket.ticketNumber}`
                    : 'No one being served'
                }
                tone="emerald"
                loading={pending === 'serve'}
                disabled={serveDisabled}
                onClick={onMarkServed}
              />
              <QuickAction
                icon={SkipForward} title="Skip customer"
                desc={
                  servingTicket
                    ? `Skip #${servingTicket.ticketNumber}`
                    : waitingList[0]
                      ? `Skip #${waitingList[0].ticketNumber}`
                      : 'Nothing to skip'
                }
                tone="amber"
                loading={pending === 'skip'}
                disabled={skipDisabled}
                onClick={onSkip}
              />
              <QuickAction
                icon={AlertCircle} title="Request help"
                desc="Page floor manager"
                tone="rose"
                onClick={onRequestHelp}
              />
            </div>
          </section>

          {/* Shift progress (placeholder until Phase 13) */}
          <section className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5 xl:col-span-5">
            <h3 className="text-sm font-semibold text-white">Shift progress</h3>
            <p className="text-xs text-slate-400">09:00 — 17:00 · Desk 2</p>

            <div className="mt-5">
              <div className="flex items-baseline justify-between text-xs">
                <span className="font-semibold text-white">{Math.floor(elapsed / 60)}h {elapsed % 60}m elapsed</span>
                <span className="text-slate-400">{pct}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            <ul className="mt-5 grid grid-cols-3 gap-2 text-center text-[11px]">
              {[
                { label: 'Break 1', time: '10:30', state: 'done' },
                { label: 'Lunch',   time: '13:00', state: 'next' },
                { label: 'Break 2', time: '15:30', state: 'soon' },
              ].map((b) => (
                <li key={b.label} className={`rounded-xl border px-2 py-2 ${
                  b.state === 'done' ? 'border-emerald-400/20 bg-emerald-500/5 text-emerald-300'
                  : b.state === 'next' ? 'border-cyan-400/30 bg-cyan-500/10 text-cyan-200'
                  : 'border-white/[0.06] bg-white/[0.02] text-slate-300'
                }`}>
                  <p className="font-semibold">{b.label}</p>
                  <p className="mt-0.5 font-mono text-[10px] opacity-80">{b.time}</p>
                </li>
              ))}
            </ul>

            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.02] p-3">
              <Coffee className="h-4 w-4 text-amber-300" />
              <p className="text-xs text-slate-300">Lunch in <span className="font-semibold text-white">1h 30m</span></p>
            </div>
          </section>

          {/* Waiting list snapshot */}
          <section className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5 xl:col-span-7">
            <div className="flex items-baseline justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Waiting line</h3>
                <p className="text-xs text-slate-400">
                  {waitingList.length === 0
                    ? 'Empty — call next when customers arrive'
                    : `${waitingList.length} ${waitingList.length === 1 ? 'person' : 'people'} in line`}
                </p>
              </div>
              <button
                type="button"
                onClick={refreshTickets}
                className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] text-slate-300 hover:border-white/20 hover:text-white"
              >
                <RefreshCw className={`h-3 w-3 ${ticketsStatus === 'loading' ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {ticketsStatus === 'error' && (
              <p className="mt-4 rounded-xl border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-xs text-rose-200">
                {ticketsError || 'Failed to load tickets.'}
              </p>
            )}

            {!queueId && queuesStatus === 'ready' && (
              <p className="mt-6 text-center text-xs text-slate-500">
                No queue selected. Pick one above to see waiting customers.
              </p>
            )}

            {queueId && waitingList.length === 0 && ticketsStatus === 'ready' && (
              <p className="mt-6 text-center text-xs text-slate-500">No customers waiting right now.</p>
            )}

            {waitingList.length > 0 && (
              <ul className="mt-4 grid gap-2 md:grid-cols-2">
                {waitingList.slice(0, 8).map((t, i) => (
                  <li key={t._id} className="flex items-center gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.02] px-3 py-2.5">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/[0.06] text-xs font-bold text-cyan-200">
                      #{i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">
                        {t.customerName} <span className="text-slate-500">· {t.ticketNumber}</span>
                      </p>
                      <p className="truncate text-[11px] text-slate-400">
                        Joined {formatRelativeTime(t.joinedAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Recent activity (real backend feed) */}
          <section className="xl:col-span-5">
            <BackendActivityTimeline />
          </section>

          {/* Live queues — read-only for staff (writes require owner/admin) */}
          <div className="xl:col-span-12">
            <QueueManagerCard
              readOnly
              title="Your organization's queues"
              subtitle="Read-only · only owners and platform admins can edit"
            />
          </div>
        </div>
      </div>
    </StaffShell>
  );
}

// ─── Bits ────────────────────────────────────────────────────────────────────

function QueuePicker({ queues, queueId, onChange, loading }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
        Active queue
      </span>
      <div className="relative max-w-xs flex-1">
        <select
          value={queueId || ''}
          onChange={(e) => onChange(e.target.value || null)}
          disabled={loading || !queues.length}
          className="w-full appearance-none rounded-lg border border-white/10 bg-bg/40 px-3 py-1.5 pr-8 text-xs text-white outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
        >
          {!queues.length && <option value="">No queues available</option>}
          {queues.map((q) => (
            <option key={q._id} value={q._id}>
              {q.name} · {q.status}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
      </div>
      {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />}
    </div>
  );
}

const ACT_TONES = {
  cyan:    'from-cyan-500/20 to-blue-500/10 ring-cyan-400/30 hover:ring-cyan-400/60 text-cyan-200',
  emerald: 'from-emerald-500/20 to-teal-500/10 ring-emerald-400/30 hover:ring-emerald-400/60 text-emerald-200',
  amber:   'from-amber-500/20 to-orange-500/10 ring-amber-400/30 hover:ring-amber-400/60 text-amber-200',
  rose:    'from-rose-500/20 to-pink-500/10 ring-rose-400/30 hover:ring-rose-400/60 text-rose-200',
};

function QuickAction({ icon: Icon, title, desc, tone, onClick, loading, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading || disabled}
      className={`group flex items-start gap-3 rounded-2xl border border-white/[0.05] bg-gradient-to-br ${ACT_TONES[tone]} bg-white/[0.02] p-4 text-left ring-1 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0`}
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/[0.06] ring-1 ring-white/10">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="mt-0.5 truncate text-[11px] text-slate-300">{desc}</p>
      </div>
    </button>
  );
}

function formatRelativeTime(iso) {
  if (!iso) return 'just now';
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toLocaleDateString();
}
