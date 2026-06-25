// ============================================================================
//  LiveTicketsCard — real backend tickets for a chosen queue
// ----------------------------------------------------------------------------
//  Lets the operator pick a queue and then call / serve / skip real tickets
//  out of MongoDB. Also exposes a walk-in form so staff can add a customer
//  directly. The list polls every 4s while the tab is visible.
//
//  Designed to be embedded anywhere ( staff My Queue, owner dashboard, etc. )
//  and to coexist with the legacy simulation panels above it.
// ============================================================================

import { useEffect, useMemo, useState } from 'react';
import {
  Loader2, PhoneCall, CheckCircle2, SkipForward, X, UserPlus,
  RefreshCw, AlertCircle,
} from 'lucide-react';
import { useQueues } from '@/features/queue/hooks/useQueues.js';
import { useTickets } from '@/features/queue/hooks/useTickets.js';
import { useConfirm } from '@/shared/components/ConfirmProvider.jsx';
import { useToast }   from '@/shared/components/ToastProvider.jsx';
import ticketApi from '@/services/ticketApi.js';

const STATUS_TONE = {
  waiting:   'bg-amber-500/10 text-amber-300 ring-amber-400/20',
  serving:   'bg-cyan-500/10 text-cyan-300 ring-cyan-400/20',
  served:    'bg-emerald-500/10 text-emerald-300 ring-emerald-400/20',
  skipped:   'bg-slate-500/10 text-slate-300 ring-slate-400/20',
  cancelled: 'bg-rose-500/10 text-rose-300 ring-rose-400/20',
};

export default function LiveTicketsCard({ title = 'Live tickets', subtitle }) {
  // Enable polling as fallback to SSE so queues created in QueueManagerCard appear here
  const { queues, status: qStatus } = useQueues(undefined, { pollMs: 8000 });
  const [selectedQueueId, setSelectedQueueId] = useState('');
  const confirm = useConfirm();
  const toast   = useToast();

  // Keep `selectedQueueId` in sync with the live queue list:
  //   - On first load (or after the list arrives) pick the first active one.
  //   - If the chosen queue disappears (deleted elsewhere) or is a stale temp
  //     id that never got reconciled, fall back to the first active queue.
  useEffect(() => {
    if (queues.length === 0) return;
    const stillThere = selectedQueueId && queues.some((q) => q._id === selectedQueueId);
    if (stillThere) return;
    const firstActive = queues.find((q) => q.status === 'active') || queues[0];
    setSelectedQueueId(firstActive._id);
  }, [queues, selectedQueueId]);

  const selectedQueue = useMemo(
    () => queues.find((q) => q._id === selectedQueueId) || null,
    [queues, selectedQueueId]
  );

  const {
    tickets, status: tStatus, error, refresh,
    beginMutation, endMutation,
    addOptimistic, updateOptimistic, removeOptimistic, replace,
  } = useTickets(selectedQueueId);

  const [customerName, setCustomerName] = useState('');
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');
  const [busyIds, setBusyIds] = useState(() => new Set());

  // Defensive cleanup on unmount: reset any stuck mutation state
  useEffect(() => {
    return () => {
      setCreating(false);
      setBusyIds(new Set());
    };
  }, []);

  // Defensive: any time the selected queue changes, clear stale form state.
  // Prevents a stuck `creating: true` from a previous attempt (or a network
  // failure outside the try/finally path) from disabling the form forever.
  useEffect(() => {
    setCreating(false);
    setFormError('');
  }, [selectedQueueId]);

  const isBusy = (id) => busyIds.has(id);
  const markBusy = (id) =>
    setBusyIds((p) => { const n = new Set(p); n.add(id); return n; });
  const clearBusy = (id) =>
    setBusyIds((p) => { const n = new Set(p); n.delete(id); return n; });

  // Filter into useful groups for the UI.
  const waiting = tickets.filter((t) => t.status === 'waiting');
  const serving = tickets.filter((t) => t.status === 'serving');
  const recent = tickets
    .filter((t) => ['served', 'skipped', 'cancelled'].includes(t.status))
    .slice(-5)
    .reverse();

  const onJoin = async (e) => {
    e.preventDefault();
    const trimmed = customerName.trim();
    if (!trimmed || !selectedQueueId || creating) return;
    setFormError('');
    setCreating(true);
    beginMutation();

    const tempId = `temp:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
    const optimistic = {
      _id: tempId,
      ticketNumber: '…',
      customerName: trimmed,
      status: 'waiting',
      queueId: selectedQueueId,
      joinedAt: new Date().toISOString(),
      _optimistic: true,
    };
    addOptimistic(optimistic);
    setCustomerName('');

    // try/finally guarantees we always exit the "creating" state, even when
    // the API client throws (network failure, refresh-token death, etc).
    // Without this, a single failed attempt would leave `creating` stuck
    // true and every subsequent click would early-return silently.
    let res;
    try {
      res = await ticketApi.create({
        queueId: selectedQueueId,
        customerName: trimmed,
      });
    } catch (err) {
      removeOptimistic(tempId);
      setCustomerName(trimmed);
      setFormError(err?.message || 'Network error — please try again.');
      return;
    } finally {
      setCreating(false);
      endMutation();
    }

    if (!res.ok) {
      removeOptimistic(tempId);
      setCustomerName(trimmed);
      setFormError(res.message || 'Failed to add ticket.');
      return;
    }
    replace(tempId, res.data);
    toast.success(`Added ${trimmed} to the queue`);
  };

  const onTransition = async (t, nextStatus) => {
    if (isBusy(t._id) || t._optimistic) return;
    const prev = t.status;
    markBusy(t._id);
    beginMutation();
    updateOptimistic(t._id, { status: nextStatus });

    let res;
    try {
      res = await ticketApi.update(t._id, { status: nextStatus });
    } catch (err) {
      updateOptimistic(t._id, { status: prev });
      toast.error(err?.message || 'Network error — please try again.');
      return;
    } finally {
      clearBusy(t._id);
      endMutation();
    }

    if (!res.ok) {
      updateOptimistic(t._id, { status: prev });
      toast.error(res.message || 'Could not update ticket.');
    }
  };

  const onCancel = async (t) => {
    if (isBusy(t._id) || t._optimistic) return;
    const ok = await confirm({
      title: `Cancel ticket #${t.ticketNumber}?`,
      message: `Remove ${t.customerName} from the queue. They will need to rejoin.`,
      confirmLabel: 'Cancel ticket',
      danger: true,
    });
    if (!ok) return;
    onTransition(t, 'cancelled');
  };

  // ---------------------------------------------------------------------------

  return (
    <section className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <p className="text-xs text-slate-400">
            {subtitle ?? 'Backend-connected · polls every 4 seconds'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Queue picker */}
          <select
            value={selectedQueueId}
            onChange={(e) => setSelectedQueueId(e.target.value)}
            disabled={qStatus !== 'ready' || queues.length === 0}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-200 outline-none focus:border-cyan-400/40 disabled:opacity-50"
          >
            {queues.length === 0 && <option value="">No queues yet</option>}
            {queues.map((q) => (
              <option key={q._id} value={q._id} className="bg-slate-900">
                {q.name} · {q.status}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={refresh}
            disabled={tStatus === 'loading'}
            title="Refresh"
            className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 transition hover:border-white/20 hover:text-white disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${tStatus === 'loading' ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Join form - always show when a queue is selected */}
      {selectedQueue && (
        <form onSubmit={onJoin} className="mt-4 flex flex-col gap-2 sm:flex-row" disabled={selectedQueue.status !== 'active'}>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Walk-in customer name"
            maxLength={120}
            disabled={selectedQueue.status !== 'active'}
            className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-primary/60 focus:bg-white/[0.05] focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!customerName.trim() || creating || selectedQueue.status !== 'active'}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-3.5 py-2 text-xs font-semibold text-slate-900 transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
            {creating ? 'Adding…' : 'Add ticket'}
          </button>
        </form>
      )}

      {selectedQueue && selectedQueue.status !== 'active' && (
        <p className="mt-4 rounded-xl border border-amber-400/20 bg-amber-500/[0.05] px-3 py-2 text-xs text-amber-200">
          Queue is <strong>{selectedQueue.status}</strong>. Resume it to add new tickets.
        </p>
      )}

      {qStatus === 'ready' && queues.length === 0 && (
        <p className="mt-4 rounded-xl border border-cyan-400/20 bg-cyan-500/[0.05] px-3 py-2 text-xs text-cyan-200">
          No queues yet — create one below to start adding tickets.
        </p>
      )}

      {formError && (
        <div role="alert" className="mt-3 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* Error / empty states */}
      <div className="mt-4">
        {tStatus === 'loading' && tickets.length === 0 && (
          <p className="py-6 text-center text-xs text-slate-500">Loading tickets…</p>
        )}
        {tStatus === 'error' && (
          <p className="py-6 text-center text-xs text-red-300">{error || 'Failed to load tickets.'}</p>
        )}
        {tStatus === 'ready' && tickets.length === 0 && selectedQueueId && (
          <p className="py-6 text-center text-xs text-slate-500">
            No tickets yet. Add the first walk-in above.
          </p>
        )}
        {!selectedQueueId && qStatus === 'ready' && (
          <p className="py-6 text-center text-xs text-slate-500">
            Select a queue to see its tickets.
          </p>
        )}
      </div>

      {/* Currently serving */}
      {serving.length > 0 && (
        <div className="mt-2">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-300">
            Now serving
          </p>
          <ul className="space-y-2">
            {serving.map((t) => (
              <TicketRow
                key={t._id}
                ticket={t}
                busy={isBusy(t._id)}
                actions={[
                  { tone: 'emerald', icon: CheckCircle2, label: 'Mark served', onClick: () => onTransition(t, 'served') },
                  { tone: 'amber',   icon: SkipForward,  label: 'Skip',         onClick: () => onTransition(t, 'skipped') },
                  { tone: 'rose',    icon: X,            label: 'Cancel',       onClick: () => onCancel(t) },
                ]}
              />
            ))}
          </ul>
        </div>
      )}

      {/* Waiting list */}
      {waiting.length > 0 && (
        <div className="mt-4">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
            Waiting ({waiting.length})
          </p>
          <ul className="space-y-2">
            {waiting.map((t, i) => (
              <TicketRow
                key={t._id}
                ticket={t}
                position={i + 1}
                busy={isBusy(t._id)}
                actions={[
                  { tone: 'cyan',  icon: PhoneCall,   label: 'Call',   onClick: () => onTransition(t, 'serving') },
                  { tone: 'amber', icon: SkipForward, label: 'Skip',   onClick: () => onTransition(t, 'skipped') },
                  { tone: 'rose',  icon: X,           label: 'Cancel', onClick: () => onCancel(t) },
                ]}
              />
            ))}
          </ul>
        </div>
      )}

      {/* Recent (completed/skipped/cancelled) */}
      {recent.length > 0 && (
        <div className="mt-4 border-t border-white/[0.05] pt-3">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Recently closed
          </p>
          <ul className="space-y-1">
            {recent.map((t) => (
              <li key={t._id} className="flex items-center gap-2 text-xs text-slate-400">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${STATUS_TONE[t.status]}`}>
                  {t.status}
                </span>
                <span className="font-mono text-slate-500">#{t.ticketNumber}</span>
                <span className="truncate">{t.customerName}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------

function TicketRow({ ticket, position, busy, actions }) {
  return (
    <li
      className={`flex items-center gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.02] p-3 transition-opacity ${
        ticket._optimistic ? 'opacity-60' : 'opacity-100'
      }`}
    >
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[11px] font-bold ${
        position === 1
          ? 'bg-cyan-500/15 text-cyan-200 ring-1 ring-cyan-400/30'
          : 'bg-white/[0.06] text-slate-300'
      }`}>
        {position ?? '·'}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">
          {ticket.customerName}
          {ticket._optimistic && (
            <span className="ml-2 text-[10px] font-normal italic text-slate-400">saving…</span>
          )}
        </p>
        <p className="truncate font-mono text-[11px] text-slate-400">
          #{ticket.ticketNumber} · joined {new Date(ticket.joinedAt).toLocaleTimeString()}
        </p>
      </div>
      <div className="flex items-center gap-1">
        {actions.map((a) => (
          <button
            key={a.label}
            type="button"
            onClick={a.onClick}
            disabled={busy || ticket._optimistic}
            title={a.label}
            className={`grid h-7 w-7 place-items-center rounded-lg border border-white/10 bg-white/[0.04] transition hover:border-white/20 disabled:opacity-40 ${
              a.tone === 'rose' ? 'text-rose-300 hover:bg-rose-500/10' :
              a.tone === 'emerald' ? 'text-emerald-300 hover:bg-emerald-500/10' :
              a.tone === 'amber' ? 'text-amber-300 hover:bg-amber-500/10' :
              'text-cyan-300 hover:bg-cyan-500/10'
            }`}
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <a.icon className="h-3.5 w-3.5" />}
          </button>
        ))}
      </div>
    </li>
  );
}
