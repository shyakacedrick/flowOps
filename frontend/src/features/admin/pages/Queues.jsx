// ============================================================================
//  Admin · Queues — cross-tenant queue management + soft-delete recovery
// ----------------------------------------------------------------------------
//  Backed by /api/queues (admin scope returns every org's queues).
//
//  Capabilities:
//    - Search by queue or organization name
//    - Filter by status (active | paused | closed)
//    - "Show deleted" toggle — calls /api/queues?includeDeleted=true so
//      tombstoned rows appear; admin can Restore them via
//      POST /api/queues/:id/restore.
//
//  This is the UI surface for the Phase 13 soft-delete capability that
//  previously had no consumer.
// ============================================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ListChecks, Search, Filter, RefreshCw, RotateCcw, Trash2, AlertCircle, Building2,
} from 'lucide-react';
import AdminLayout from '@/features/admin/components/AdminShell.jsx';
import PageHeader, { StatCard } from '@/shared/components/PageHeader.jsx';
import useOrganizations from '@/features/admin/hooks/useOrganizations.js';
import queueApi from '@/services/queueApi.js';
import { useToast } from '@/shared/components/ToastProvider.jsx';

const STATUS_FILTERS = ['all', 'active', 'paused', 'closed'];

const STATUS_STYLE = {
  active: 'bg-emerald-500/10 text-emerald-300 ring-emerald-400/30',
  paused: 'bg-amber-500/10  text-amber-300  ring-amber-400/30',
  closed: 'bg-slate-500/10  text-slate-300  ring-slate-400/30',
};

export default function AdminQueues() {
  const { organizations } = useOrganizations({ pollMs: 0 });
  const toast = useToast();

  const [queues, setQueues] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | loading | ready | error
  const [error,  setError]  = useState(null);

  const [query,         setQuery]         = useState('');
  const [statusFilter,  setStatusFilter]  = useState('all');
  const [showDeleted,   setShowDeleted]   = useState(false);
  const [restoringId,   setRestoringId]   = useState(null);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchQueues = useCallback(async () => {
    setStatus('loading');
    setError(null);
    const params = showDeleted ? { includeDeleted: 'true' } : undefined;
    const res = await queueApi.list(params);
    if (!res.ok) {
      setError(res.message || 'Failed to load queues');
      setStatus('error');
      return;
    }
    setQueues(Array.isArray(res.data) ? res.data : []);
    setStatus('ready');
  }, [showDeleted]);

  useEffect(() => { fetchQueues(); }, [fetchQueues]);

  // ── Derive org name map for human-readable rows ──────────────────────────
  const orgById = useMemo(() => {
    const map = new Map();
    for (const o of organizations) map.set(String(o._id), o);
    return map;
  }, [organizations]);

  // ── Filtering ───────────────────────────────────────────────────────────
  const rows = useMemo(() => queues.filter((q) => {
    if (statusFilter !== 'all' && q.status !== statusFilter) return false;
    if (query) {
      const needle = query.toLowerCase();
      const orgName = orgById.get(String(q.organizationId))?.name || '';
      const hay = `${q.name || ''} ${orgName}`.toLowerCase();
      if (!hay.includes(needle)) return false;
    }
    return true;
  }), [queues, query, statusFilter, orgById]);

  const totalLive    = queues.filter((q) => !q.deletedAt).length;
  const totalDeleted = queues.filter((q) => !!q.deletedAt).length;

  // ── Restore handler ─────────────────────────────────────────────────────
  const onRestore = async (queue) => {
    setRestoringId(queue._id);
    const res = await queueApi.restore(queue._id);
    setRestoringId(null);
    if (!res.ok) {
      toast.error(res.message || 'Failed to restore queue');
      return;
    }
    toast.success(`Restored "${queue.name}"`);
    // Replace in-place so the row stays visible (still in includeDeleted view)
    // but its tombstone badge clears.
    setQueues((prev) => prev.map((q) => (q._id === queue._id ? res.data : q)));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Cross-tenant operations"
          title="Queues"
          subtitle="Every queue across every organization. Toggle deleted rows to recover accidentally-removed queues."
          crumbs={[{ label: 'Admin' }, { label: 'Queues' }]}
          actions={(
            <button
              onClick={fetchQueues}
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

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Total"    value={queues.length} delta={showDeleted ? 'Live + deleted' : 'Live only'} tone="violet" icon={ListChecks} />
          <StatCard label="Live"     value={totalLive}     delta="Not deleted"  tone="emerald" />
          <StatCard label="Deleted"  value={totalDeleted}  delta={showDeleted ? 'Recoverable' : 'Toggle to view'} tone="rose" icon={Trash2} />
        </div>

        <section className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="Search queues or organizations"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-violet-400/40 focus:outline-none"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-slate-500" />
                <Pills options={STATUS_FILTERS} value={statusFilter} onChange={setStatusFilter} />
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold text-slate-300">
                <input
                  type="checkbox"
                  checked={showDeleted}
                  onChange={(e) => setShowDeleted(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-white/20 bg-white/[0.04] text-violet-500 focus:ring-violet-400/40"
                />
                Show deleted
              </label>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                <tr className="border-b border-white/[0.05]">
                  <th className="px-3 py-2.5 text-left">Queue</th>
                  <th className="px-3 py-2.5 text-left">Organization</th>
                  <th className="px-3 py-2.5 text-left">Status</th>
                  <th className="px-3 py-2.5 text-left">Created</th>
                  <th className="px-3 py-2.5 text-left">Deleted</th>
                  <th className="px-3 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {rows.map((q) => {
                  const org = orgById.get(String(q.organizationId));
                  const isDeleted = !!q.deletedAt;
                  return (
                    <tr
                      key={q._id}
                      className={`border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02] ${isDeleted ? 'opacity-60' : ''}`}
                    >
                      <td className="px-3 py-3">
                        <p className="truncate text-sm font-semibold text-white">{q.name}</p>
                        <p className="truncate font-mono text-[10px] text-slate-500">{q._id}</p>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2 text-slate-300">
                          <Building2 className="h-3.5 w-3.5 text-slate-500" />
                          <span className="truncate">{org?.name || <span className="text-slate-500">Unknown</span>}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${STATUS_STYLE[q.status] || STATUS_STYLE.closed}`}>
                          {q.status || '—'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-400">{fmtDate(q.createdAt)}</td>
                      <td className="px-3 py-3 text-xs">
                        {isDeleted
                          ? <span className="text-rose-300">{fmtDate(q.deletedAt)}</span>
                          : <span className="text-slate-500">—</span>}
                      </td>
                      <td className="px-3 py-3 text-right">
                        {isDeleted ? (
                          <button
                            onClick={() => onRestore(q)}
                            disabled={restoringId === q._id}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-50"
                          >
                            <RotateCcw className={`h-3 w-3 ${restoringId === q._id ? 'animate-spin' : ''}`} />
                            Restore
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-500">Live</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 && status === 'ready' && (
                  <tr><td colSpan={6} className="py-10 text-center text-sm text-slate-500">
                    {showDeleted ? 'No queues match the current filters.' : 'No live queues. Toggle "Show deleted" to see tombstoned rows.'}
                  </td></tr>
                )}
                {status === 'loading' && rows.length === 0 && (
                  <tr><td colSpan={6} className="py-10 text-center text-sm text-slate-500">Loading queues…</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}

// ─── atoms ───────────────────────────────────────────────────────────────────

function Pills({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1 rounded-xl border border-white/10 bg-white/[0.04] p-0.5 text-[11px] font-semibold">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`rounded-lg px-2.5 py-1 capitalize transition-colors ${
            value === opt ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >{opt}</button>
      ))}
    </div>
  );
}

function fmtDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch {
    return '—';
  }
}
