// ============================================================================
//  Admin · Organizations — real cross-tenant org management
// ----------------------------------------------------------------------------
//  Backed by /api/organizations (admin scope returns every org).
//
//  Capabilities:
//    - Search by name or industry
//    - Filter by status (active | suspended) and plan (starter|growth|scale)
//    - Side drawer with org detail + admin actions:
//        - Change plan
//        - Suspend / unsuspend (with reason)
//    - Optimistic local updates via useOrganizations().update()
// ============================================================================

import { useMemo, useState } from 'react';
import {
  Building2, Search, Filter, MoreHorizontal, X, RefreshCw,
  CreditCard, Calendar, AlertCircle, ShieldOff, ShieldCheck, Save,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '@/features/admin/components/AdminShell.jsx';
import PageHeader, { StatCard } from '@/shared/components/PageHeader.jsx';
import useOrganizations from '@/features/admin/hooks/useOrganizations.js';

const PLAN_OPTIONS = ['starter', 'growth', 'scale'];
const INDUSTRY_LABELS = {
  clinic: 'Clinic', hospital: 'Hospital', bank: 'Bank',
  salon: 'Salon', restaurant: 'Restaurant', retail: 'Retail',
  government: 'Government', other: 'Other',
};

const PLAN_STYLE = {
  starter: 'bg-white/[0.05] text-slate-300 ring-white/10',
  growth:  'bg-cyan-500/10 text-cyan-200 ring-cyan-400/30',
  scale:   'bg-gradient-to-r from-violet-500/20 to-cyan-500/20 text-violet-200 ring-violet-400/30',
};

const STATUS_FILTERS = ['all', 'active', 'suspended'];

export default function Organizations() {
  const { organizations, status, error, refresh, update } = useOrganizations();

  const [query,  setQuery]  = useState('');
  const [filter, setFilter] = useState('all');
  const [plan,   setPlan]   = useState('all');
  const [open,   setOpen]   = useState(null);

  const rows = useMemo(() => organizations.filter((o) => {
    const isSuspended = !!o.suspendedAt;
    if (filter === 'active'    && isSuspended) return false;
    if (filter === 'suspended' && !isSuspended) return false;
    if (plan !== 'all' && o.plan !== plan) return false;
    if (query) {
      const q = query.toLowerCase();
      const hay = `${o.name || ''} ${o.industry || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }), [organizations, query, filter, plan]);

  const totalActive    = organizations.filter((o) => !o.suspendedAt).length;
  const totalSuspended = organizations.filter((o) => !!o.suspendedAt).length;
  const totalScale     = organizations.filter((o) => o.plan === 'scale').length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Customer accounts"
          title="Organizations"
          subtitle="Every business using FlowOps — search, filter, suspend, and change plan."
          crumbs={[{ label: 'Admin' }, { label: 'Organizations' }]}
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
          <StatCard label="Total"          value={organizations.length} delta="All accounts"   tone="violet"  icon={Building2} />
          <StatCard label="Active"         value={totalActive}          delta="Not suspended"  tone="emerald" />
          <StatCard label="Suspended"      value={totalSuspended}       delta="Frozen"         tone="rose"    icon={ShieldOff} />
          <StatCard label="On Scale plan"  value={totalScale}           delta="Top tier"       tone="cyan" />
        </div>

        <section className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="Search organizations or industry"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-violet-400/40 focus:outline-none"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-slate-500" />
              <Pills options={STATUS_FILTERS} value={filter} onChange={setFilter} />
              <Pills options={['all', ...PLAN_OPTIONS]} value={plan} onChange={setPlan} />
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                <tr className="border-b border-white/[0.05]">
                  <th className="px-3 py-2.5 text-left">Organization</th>
                  <th className="px-3 py-2.5 text-left">Industry</th>
                  <th className="px-3 py-2.5 text-left">Plan</th>
                  <th className="px-3 py-2.5 text-left">Status</th>
                  <th className="px-3 py-2.5 text-left">Created</th>
                  <th className="px-3 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {rows.map((o) => {
                  const suspended = !!o.suspendedAt;
                  return (
                    <tr key={o._id} className="border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02]">
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500/40 to-cyan-500/30 text-xs font-bold text-white">
                            {initials(o.name)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white">{o.name}</p>
                            <p className="truncate font-mono text-[10px] text-slate-500">{o._id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-slate-300">
                        {INDUSTRY_LABELS[o.industry] || o.industry || '—'}
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${PLAN_STYLE[o.plan] || PLAN_STYLE.starter}`}>
                          {o.plan || 'starter'}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        {suspended ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold text-rose-300 ring-1 ring-rose-400/30">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-400" /> Suspended
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 ring-1 ring-emerald-400/30">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Active
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-400">{fmtDate(o.createdAt)}</td>
                      <td className="px-3 py-3 text-right">
                        <button
                          onClick={() => setOpen(o)}
                          className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-white/[0.06] hover:text-white"
                          aria-label="Open details"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 && status === 'ready' && (
                  <tr><td colSpan={6} className="py-10 text-center text-sm text-slate-500">No matching organizations.</td></tr>
                )}
                {status === 'loading' && rows.length === 0 && (
                  <tr><td colSpan={6} className="py-10 text-center text-sm text-slate-500">Loading organizations…</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <OrgDrawer
        org={open}
        onClose={() => setOpen(null)}
        onSave={async (id, body) => {
          const res = await update(id, body);
          if (res.ok) setOpen(res.data);
          return res;
        }}
      />
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

function initials(name) {
  return (name || '?').split(/\s+/).map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

// ─── drawer ──────────────────────────────────────────────────────────────────

function OrgDrawer({ org, onClose, onSave }) {
  return (
    <AnimatePresence>
      {org && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm" />
          <motion.aside
            initial={{ x: 480 }} animate={{ x: 0 }} exit={{ x: 480 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-y-auto border-l border-white/[0.06] bg-[#0B1120] p-6"
          >
            <OrgDrawerBody org={org} onClose={onClose} onSave={onSave} />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function OrgDrawerBody({ org, onClose, onSave }) {
  const [plan,   setPlan]   = useState(org.plan || 'starter');
  const [reason, setReason] = useState(org.suspensionReason || '');
  const [busy,   setBusy]   = useState(null); // 'plan' | 'suspend' | 'unsuspend' | null
  const [error,  setError]  = useState(null);

  const suspended = !!org.suspendedAt;

  const save = async (kind, body) => {
    setBusy(kind); setError(null);
    const res = await onSave(org._id, body);
    setBusy(null);
    if (!res.ok) setError(res.message || 'Update failed');
  };

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-violet-500/40 to-cyan-500/30 text-base font-bold text-white">
            {initials(org.name)}
          </span>
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-white">{org.name}</h3>
            <p className="font-mono text-[10px] text-slate-500">{org._id}</p>
          </div>
        </div>
        <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 text-slate-400">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2.5">
        <DrawerStat label="Industry" value={INDUSTRY_LABELS[org.industry] || org.industry || '—'} icon={Building2} />
        <DrawerStat label="Plan"     value={org.plan || 'starter'} icon={CreditCard} />
        <DrawerStat label="Created"  value={fmtDate(org.createdAt)} icon={Calendar} />
        <DrawerStat
          label="Status"
          value={suspended ? 'Suspended' : 'Active'}
          icon={suspended ? ShieldOff : ShieldCheck}
        />
      </div>

      {org.description && (
        <p className="mt-4 rounded-2xl border border-white/[0.05] bg-white/[0.02] p-3 text-xs text-slate-300">
          {org.description}
        </p>
      )}

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Plan */}
      <div className="mt-6">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Change plan</p>
        <div className="mt-2 flex items-center gap-2">
          <select
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-200 focus:border-violet-400/40 focus:outline-none"
          >
            {PLAN_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <button
            onClick={() => save('plan', { plan })}
            disabled={busy === 'plan' || plan === org.plan}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            {busy === 'plan' ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {/* Suspension */}
      <div className="mt-6">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          {suspended ? 'Lift suspension' : 'Suspend organization'}
        </p>
        {suspended ? (
          <>
            <p className="mt-2 text-xs text-slate-400">
              Suspended {fmtDate(org.suspendedAt)}.
              {org.suspensionReason ? ` Reason: ${org.suspensionReason}` : ''}
            </p>
            <button
              onClick={() => save('unsuspend', { suspended: false })}
              disabled={busy === 'unsuspend'}
              className="mt-3 w-full rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-50"
            >
              {busy === 'unsuspend' ? 'Lifting…' : 'Lift suspension'}
            </button>
          </>
        ) : (
          <>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason (optional, max 500 chars)"
              rows={3}
              maxLength={500}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-rose-400/40 focus:outline-none"
            />
            <button
              onClick={() => save('suspend', { suspended: true, suspensionReason: reason })}
              disabled={busy === 'suspend'}
              className="mt-2 w-full rounded-xl border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-200 hover:bg-rose-500/20 disabled:opacity-50"
            >
              {busy === 'suspend' ? 'Suspending…' : 'Suspend organization'}
            </button>
            <p className="mt-2 text-[10px] text-slate-500">
              Suspending freezes every request from this org's users. They can still
              sign in but every API call returns 403 until lifted.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function DrawerStat({ label, value, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
        {Icon && <Icon className="h-3 w-3" />} {label}
      </div>
      <p className="mt-1 text-sm font-bold capitalize text-white">{value}</p>
    </div>
  );
}
