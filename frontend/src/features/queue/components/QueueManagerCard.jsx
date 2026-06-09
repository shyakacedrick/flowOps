// ============================================================================
//  QueueManagerCard — owner-facing CRUD over /api/queues
// ----------------------------------------------------------------------------
//  Lists queues for the signed-in owner's organization and lets them:
//    • Create a queue (name [+ status])     → POST   /api/queues
//    • Pause / resume a queue               → PATCH  /api/queues/:id
//    • Delete a queue                       → DELETE /api/queues/:id
//
//  Org-scoping is enforced server-side, so this component just trusts what
//  comes back from queueApi.list().
// ============================================================================

import { useEffect, useState } from 'react';
import { Loader2, Plus, Pause, Play, Trash2, RefreshCw, AlertCircle, QrCode, X, Copy, Check, ExternalLink } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useQueues } from '@/features/queue/hooks/useQueues.js';
import { useConfirm } from '@/shared/components/ConfirmProvider.jsx';
import queueApi from '@/services/queueApi.js';

const STATUS_STYLES = {
  active: 'bg-emerald-500/10 text-emerald-300 ring-emerald-400/20',
  paused: 'bg-amber-500/10 text-amber-300 ring-amber-400/20',
  closed: 'bg-slate-500/10 text-slate-300 ring-slate-400/20',
};

export default function QueueManagerCard({
  readOnly = false,
  title = 'Queues',
  subtitle = 'Live from the backend · org-scoped to your workspace',
}) {
  const {
    queues,
    status,
    error,
    refresh,
    beginMutation,
    endMutation,
    addQueueOptimistic,
    updateQueueOptimistic,
    removeQueueOptimistic,
    replaceQueue,
  } = useQueues();
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [busyIds, setBusyIds] = useState(() => new Set());
  const [formError, setFormError] = useState('');
  const [shareQueue, setShareQueue] = useState(null);
  const confirm = useConfirm();

  const isBusy = (id) => busyIds.has(id);
  const markBusy = (id) =>
    setBusyIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  const clearBusy = (id) =>
    setBusyIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

  const onCreate = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || creating) return;
    setFormError('');
    setCreating(true);
    beginMutation();

    // Optimistic insert — prepend a placeholder so the UI updates instantly.
    const tempId = `temp:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
    const optimistic = {
      _id: tempId,
      name: trimmed,
      status: 'active',
      ticketCounter: 0,
      createdAt: new Date().toISOString(),
      _optimistic: true,
    };
    addQueueOptimistic(optimistic);
    setName('');

    const res = await queueApi.create({ name: trimmed });
    setCreating(false);
    endMutation();

    if (!res.ok) {
      // Rollback: drop the placeholder and surface the error.
      removeQueueOptimistic(tempId);
      setName(trimmed);
      setFormError(res.message || 'Failed to create queue.');
      return;
    }
    // Swap the placeholder for the real server-issued record.
    replaceQueue(tempId, res.data);
  };

  const onToggleStatus = async (q) => {
    if (isBusy(q._id) || q._optimistic) return;
    const nextStatus = q.status === 'active' ? 'paused' : 'active';
    const prevStatus = q.status;

    markBusy(q._id);
    beginMutation();
    // Flip the badge immediately.
    updateQueueOptimistic(q._id, { status: nextStatus });

    const res = await queueApi.update(q._id, { status: nextStatus });
    clearBusy(q._id);
    endMutation();

    if (!res.ok) {
      // Rollback the badge.
      updateQueueOptimistic(q._id, { status: prevStatus });
      setFormError(res.message || 'Failed to update queue.');
    }
  };

  const onDelete = async (q) => {
    if (isBusy(q._id) || q._optimistic) return;
    const ok = await confirm({
      title: `Delete queue “${q.name}”?`,
      message: 'All tickets in this queue will lose their queue reference. This cannot be undone.',
      confirmLabel: 'Delete queue',
      danger: true,
    });
    if (!ok) return;

    // Snapshot for rollback, then remove immediately.
    const snapshot = { ...q };
    markBusy(q._id);
    beginMutation();
    removeQueueOptimistic(q._id);

    const res = await queueApi.remove(q._id);
    clearBusy(q._id);
    endMutation();

    if (!res.ok) {
      // Re-insert at the top — ordering after rollback is best-effort.
      addQueueOptimistic(snapshot);
      setFormError(res.message || 'Failed to delete queue.');
    }
  };

  return (
    <section className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <p className="text-xs text-slate-400">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={status} count={queues.length} error={error} />
          <button
            type="button"
            onClick={refresh}
            disabled={status === 'loading'}
            title="Refresh"
            className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 transition hover:border-white/20 hover:text-white disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${status === 'loading' ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Create form — hidden in read-only mode (staff / admin viewers) */}
      {!readOnly && (
        <form onSubmit={onCreate} className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New queue name (e.g. Main desk)"
            maxLength={120}
            className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-primary/60 focus:bg-white/[0.05] focus:ring-2 focus:ring-primary/30"
          />
          <button
            type="submit"
            disabled={!name.trim() || creating}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-3.5 py-2 text-xs font-semibold text-slate-900 transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            {creating ? 'Creating…' : 'Create queue'}
          </button>
        </form>
      )}

      {!readOnly && formError && (
        <div
          role="alert"
          className="mt-3 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200"
        >
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* List */}
      <div className="mt-4">
        {status === 'loading' && queues.length === 0 && (
          <p className="py-6 text-center text-xs text-slate-500">Loading queues…</p>
        )}
        {status === 'error' && (
          <p className="py-6 text-center text-xs text-red-300">
            {error || 'Failed to load queues.'}
          </p>
        )}
        {status === 'ready' && queues.length === 0 && (
          <p className="py-6 text-center text-xs text-slate-500">
            {readOnly
              ? 'No queues to display yet.'
              : 'No queues yet. Create your first one above.'}
          </p>
        )}

        {queues.length > 0 && (
          <ul className="divide-y divide-white/[0.05]">
            {queues.map((q) => (
              <li
                key={q._id}
                className={`flex items-center gap-3 py-3 transition-opacity ${
                  q._optimistic ? 'opacity-60' : 'opacity-100'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">
                    {q.name}
                    {q._optimistic && (
                      <span className="ml-2 text-[10px] font-normal italic text-slate-400">
                        saving…
                      </span>
                    )}
                  </p>
                  <p className="truncate text-[11px] text-slate-500">
                    {q.ticketCounter ?? 0} tickets issued · created{' '}
                    {q.createdAt ? new Date(q.createdAt).toLocaleDateString() : '—'}
                  </p>
                </div>

                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${
                    STATUS_STYLES[q.status] || STATUS_STYLES.closed
                  }`}
                >
                  {q.status}
                </span>

                {!readOnly && (
                  <>
                    <button
                      type="button"
                      onClick={() => setShareQueue(q)}
                      disabled={q._optimistic}
                      title="Share join link"
                      className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 transition hover:border-primary/40 hover:text-primary disabled:opacity-40"
                    >
                      <QrCode className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onToggleStatus(q)}
                      disabled={isBusy(q._id) || q.status === 'closed' || q._optimistic}
                      title={q.status === 'active' ? 'Pause queue' : 'Resume queue'}
                      className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 transition hover:border-white/20 hover:text-white disabled:opacity-40"
                    >
                      {isBusy(q._id) ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : q.status === 'active' ? (
                        <Pause className="h-3.5 w-3.5" />
                      ) : (
                        <Play className="h-3.5 w-3.5" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete(q)}
                      disabled={isBusy(q._id) || q._optimistic}
                      title="Delete queue"
                      className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-rose-300 transition hover:border-rose-400/40 hover:bg-rose-500/10 disabled:opacity-40"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {shareQueue && (
        <QrShareModal queue={shareQueue} onClose={() => setShareQueue(null)} />
      )}
    </section>
  );
}

function StatusBadge({ status, count, error }) {
  if (status === 'loading' || status === 'idle') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300 ring-1 ring-amber-400/20">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-300" />
        Checking…
      </span>
    );
  }
  if (status === 'error') {
    const expired = error && /401|unauthorized|invalid/i.test(error);
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-300 ring-1 ring-red-400/20">
        <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
        {expired ? 'Session expired' : 'API offline'}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 ring-1 ring-emerald-400/20">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
      Live · {count} {count === 1 ? 'queue' : 'queues'}
    </span>
  );
}

/* ----------------------------------------------------------------- */
/* QR share modal — lets the owner display the public join URL.       */
/* ----------------------------------------------------------------- */
function QrShareModal({ queue, onClose }) {
  const publicUrl = `${window.location.origin}/q/${queue._id}`;
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — ignore */
    }
  };

  // Close on Escape.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-bg p-5 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/80">
              Share this queue
            </p>
            <h3 className="mt-1 text-sm font-semibold text-white">{queue.name}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 hover:border-white/20 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mt-4 grid place-items-center rounded-xl border border-white/[0.06] bg-white p-4">
          <QRCodeSVG value={publicUrl} size={196} includeMargin={false} level="M" />
        </div>

        <p className="mt-3 text-center text-[11px] text-slate-400">
          Customers scan this code to take a ticket. No account needed.
        </p>

        <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
          <span className="min-w-0 flex-1 truncate text-[11px] text-slate-300">{publicUrl}</span>
          <button
            type="button"
            onClick={copyLink}
            className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] text-slate-200 hover:border-primary/40 hover:text-primary"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] text-slate-200 hover:border-primary/40 hover:text-primary"
          >
            <ExternalLink className="h-3 w-3" />
            Open
          </a>
        </div>
      </div>
    </div>
  );
}
