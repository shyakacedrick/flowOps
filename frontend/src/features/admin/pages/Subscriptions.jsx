// ============================================================================
//  Admin · Subscriptions — real billing data from /api/admin/subscriptions
// ----------------------------------------------------------------------------
//  Every number on this page is computed by the backend from real
//  Subscription documents joined with Organization. The page renders:
//    • Top stat cards: total orgs, active subs, MRR, past-due count
//    • Plan distribution (count + percent per plan)
//    • Subscriptions table (org, plan, status, MRR, period end, edit)
//    • Side drawer for editing a single subscription
//
//  Pricing/billing platform integration (Stripe) is still a roadmap item —
//  the page surfaces that honestly via a footer empty-state instead of
//  fake invoice rows.
// ============================================================================

import { useMemo, useState } from 'react';
import {
  CreditCard, Building2, AlertCircle, RefreshCw, Sparkles, Zap, Crown,
  X, Loader2, Save, DollarSign, Clock,
} from 'lucide-react';
import AdminLayout from '@/features/admin/components/AdminShell.jsx';
import PageHeader, { StatCard } from '@/shared/components/PageHeader.jsx';
import EmptyState from '@/shared/components/EmptyState.jsx';
import useSubscriptions from '@/features/admin/hooks/useSubscriptions.js';

// Plan slugs MUST match Organization.plan / Subscription.plan enums.
const PLAN_META = {
  starter: { name: 'Starter', icon: Sparkles, tone: 'slate'  },
  growth:  { name: 'Growth',  icon: Zap,      tone: 'cyan'   },
  scale:   { name: 'Scale',   icon: Crown,    tone: 'violet' },
};
const PLAN_ORDER = ['starter', 'growth', 'scale'];

const STATUS_META = {
  trialing:  { label: 'Trialing',  badge: 'bg-cyan-500/15 text-cyan-200 ring-cyan-400/30' },
  active:    { label: 'Active',    badge: 'bg-emerald-500/15 text-emerald-200 ring-emerald-400/30' },
  past_due:  { label: 'Past due',  badge: 'bg-amber-500/15 text-amber-200 ring-amber-400/30' },
  paused:    { label: 'Paused',    badge: 'bg-slate-500/15 text-slate-200 ring-slate-400/30' },
  cancelled: { label: 'Cancelled', badge: 'bg-rose-500/15 text-rose-200 ring-rose-400/30' },
};
const STATUS_ORDER = ['trialing', 'active', 'past_due', 'paused', 'cancelled'];

const TONE_RING = {
  slate:  'border-white/[0.06] bg-white/[0.02]',
  cyan:   'border-cyan-400/20 bg-white/[0.02]',
  violet: 'border-violet-400/20 bg-white/[0.02]',
};
const TONE_BADGE = {
  slate:  'bg-white/10 text-slate-300',
  cyan:   'bg-cyan-500/20 text-cyan-200',
  violet: 'bg-violet-500/20 text-violet-200',
};
const TONE_BAR = {
  slate:  'from-slate-400 to-slate-500',
  cyan:   'from-cyan-400 to-blue-500',
  violet: 'from-violet-400 to-fuchsia-500',
};

// Helpers ───────────────────────────────────────────────────────────────────

function formatMoney(cents, currency = 'USD') {
  if (cents == null) return '—';
  const value = cents / 100;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: value >= 100 ? 0 : 2,
    }).format(value);
  } catch {
    return `$${value.toFixed(2)}`;
  }
}

function formatShortDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Default fallback prices (mirrors backend PLAN_DEFAULT_PRICE_CENTS so the
// table doesn't show "—" when the sub uses the default; the server returns
// the override field as null in that case).
const PLAN_DEFAULT_PRICE_CENTS = { starter: 0, growth: 4900, scale: 19900 };

function effectiveMonthly(sub) {
  if (sub.monthlyPriceCents != null) return sub.monthlyPriceCents;
  return PLAN_DEFAULT_PRICE_CENTS[sub.plan] ?? 0;
}

export default function Subscriptions() {
  const { items, meta, status, error, refresh, patch } = useSubscriptions({ pollMs: 60_000 });
  const [editing, setEditing] = useState(null); // { orgId, sub }

  const totalOrgs   = meta.totalOrganizations || 0;
  const activeCount = meta.statusCounts?.active   || 0;
  const trialCount  = meta.statusCounts?.trialing || 0;

  const breakdown = useMemo(() => PLAN_ORDER.map((slug) => {
    const count = meta.planCounts?.[slug] || 0;
    return {
      slug,
      ...PLAN_META[slug],
      count,
      pct: totalOrgs ? Math.round((count / totalOrgs) * 100) : 0,
    };
  }), [meta.planCounts, totalOrgs]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Billing"
          title="Subscriptions"
          subtitle="Plan distribution, MRR, and per-organization billing across the platform."
          crumbs={[{ label: 'Admin' }, { label: 'Subscriptions' }]}
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
          <StatCard
            label="Total organizations"
            value={totalOrgs}
            delta="Across all plans"
            tone="violet"
            icon={Building2}
          />
          <StatCard
            label="Active subscriptions"
            value={activeCount}
            delta={`${trialCount} on trial`}
            tone="emerald"
            icon={CreditCard}
          />
          <StatCard
            label="MRR"
            value={formatMoney(meta.mrrCents, meta.currency)}
            delta="Active + trialing + past-due"
            tone="cyan"
            icon={DollarSign}
          />
          <StatCard
            label="Past due"
            value={meta.statusCounts?.past_due || 0}
            delta={`${meta.statusCounts?.cancelled || 0} cancelled`}
            tone="amber"
            icon={AlertCircle}
          />
        </div>

        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h3 className="text-sm font-semibold text-white">Plan distribution</h3>
            <p className="text-xs text-slate-400">
              {totalOrgs.toLocaleString()} organization{totalOrgs === 1 ? '' : 's'} on the platform
            </p>
          </div>

          {totalOrgs === 0 ? (
            <EmptyState
              icon={Building2}
              tone="info"
              size="sm"
              title="No organizations yet"
              message="Once businesses sign up, their plan distribution will appear here."
            />
          ) : (
            <div className="grid gap-4 lg:grid-cols-3">
              {breakdown.map((p) => {
                const Icon = p.icon;
                return (
                  <div key={p.slug} className={`rounded-3xl border p-5 ${TONE_RING[p.tone]}`}>
                    <div className="flex items-center justify-between">
                      <span className={`grid h-10 w-10 place-items-center rounded-2xl ${TONE_BADGE[p.tone]}`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${TONE_BADGE[p.tone]}`}>
                        {p.name}
                      </span>
                    </div>
                    <p className="mt-5 text-4xl font-bold tabular-nums text-white">{p.count}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      subscriber{p.count === 1 ? '' : 's'} · {p.pct}% of platform
                    </p>
                    <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${TONE_BAR[p.tone]}`}
                        style={{ width: `${Math.max(p.pct, p.count > 0 ? 4 : 0)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h3 className="text-sm font-semibold text-white">Subscriptions</h3>
            <p className="text-xs text-slate-400">
              {items.length.toLocaleString()} row{items.length === 1 ? '' : 's'} · click any row to edit
            </p>
          </div>

          {status === 'loading' && items.length === 0 ? (
            <div className="flex items-center gap-2 rounded-3xl border border-white/[0.06] bg-white/[0.02] px-5 py-8 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading subscriptions…
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              tone="info"
              size="sm"
              title="No subscriptions yet"
              message="Subscriptions are auto-created when an organization signs up."
            />
          ) : (
            <div className="overflow-hidden rounded-3xl border border-white/[0.06] bg-white/[0.02]">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/[0.03] text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-2.5">Organization</th>
                    <th className="px-4 py-2.5">Plan</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5 text-right">Monthly</th>
                    <th className="px-4 py-2.5">Period ends</th>
                    <th className="px-4 py-2.5">Seats</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {items.map((sub) => {
                    const planMeta   = PLAN_META[sub.plan] || PLAN_META.starter;
                    const statusMeta = STATUS_META[sub.status] || STATUS_META.trialing;
                    return (
                      <tr
                        key={sub.organizationId}
                        onClick={() => setEditing({ orgId: sub.organizationId, sub })}
                        className="cursor-pointer transition-colors hover:bg-white/[0.03]"
                      >
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-3.5 w-3.5 text-slate-500" />
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-white">
                                {sub.organization?.name || '(unnamed)'}
                              </p>
                              <p className="text-[10px] text-slate-500">{sub.organization?.industry || '—'}</p>
                            </div>
                            {sub._synthetic && (
                              <span className="rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-200 ring-1 ring-amber-400/30">
                                Implicit
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${TONE_BADGE[planMeta.tone]}`}>
                            {planMeta.name}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${statusMeta.badge}`}>
                            {statusMeta.label}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-slate-200 tabular-nums">
                          {formatMoney(effectiveMonthly(sub), sub.currency)}
                        </td>
                        <td className="px-4 py-2.5 text-slate-300">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3 text-slate-500" />
                            {formatShortDate(sub.currentPeriodEnd || sub.trialEndsAt)}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-slate-300 tabular-nums">{sub.seats ?? '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
          <div className="flex items-baseline justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Invoices</h3>
              <p className="text-xs text-slate-400">Stripe integration is on the roadmap.</p>
            </div>
          </div>
          <div className="mt-2">
            <EmptyState
              icon={CreditCard}
              tone="info"
              size="sm"
              title="Billing provider not yet connected"
              message="Invoices and renewal events will stream into this section once Stripe is wired in. Plan, status, and MRR above are computed from real Subscription records."
            />
          </div>
        </section>
      </div>

      {editing && (
        <SubscriptionDrawer
          subscription={editing.sub}
          onClose={() => setEditing(null)}
          onSave={async (body) => {
            const res = await patch(editing.orgId, body);
            if (res.ok) setEditing(null);
            return res;
          }}
        />
      )}
    </AdminLayout>
  );
}

// ────────────────────────────────────────────────────────────────────────────
//  SubscriptionDrawer — side panel for editing one subscription
// ────────────────────────────────────────────────────────────────────────────

function toDateInputValue(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function SubscriptionDrawer({ subscription, onClose, onSave }) {
  const [plan,   setPlan]   = useState(subscription.plan);
  const [statusValue, setStatusValue] = useState(subscription.status);
  const [seats,  setSeats]  = useState(subscription.seats ?? 1);
  const [priceCents, setPriceCents] = useState(
    subscription.monthlyPriceCents != null ? subscription.monthlyPriceCents : ''
  );
  const [periodStart, setPeriodStart] = useState(toDateInputValue(subscription.currentPeriodStart));
  const [periodEnd,   setPeriodEnd]   = useState(toDateInputValue(subscription.currentPeriodEnd));
  const [trialEnd,    setTrialEnd]    = useState(toDateInputValue(subscription.trialEndsAt));
  const [notes, setNotes] = useState(subscription.notes || '');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const handleSave = async () => {
    setSaveError(null);
    setSaving(true);
    const body = {
      plan,
      status: statusValue,
      seats: Number(seats) || 0,
      monthlyPriceCents: priceCents === '' ? null : Number(priceCents),
      currentPeriodStart: periodStart || null,
      currentPeriodEnd:   periodEnd   || null,
      trialEndsAt:        trialEnd    || null,
      notes,
    };
    const res = await onSave(body);
    setSaving(false);
    if (!res.ok) setSaveError(res.message || 'Failed to save subscription');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-end bg-slate-950/60 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md overflow-y-auto border-l border-white/10 bg-slate-950 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Edit subscription</p>
            <h2 className="mt-1 text-lg font-semibold text-white">
              {subscription.organization?.name || '(unnamed)'}
            </h2>
            <p className="text-xs text-slate-400">{subscription.organization?.industry || '—'}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/[0.04] p-1.5 text-slate-300 hover:bg-white/[0.08]"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 space-y-3">
          <DrawerField label="Plan">
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-1.5 text-sm text-white outline-none focus:border-cyan-400/40"
            >
              {PLAN_ORDER.map((p) => <option key={p} value={p}>{PLAN_META[p].name}</option>)}
            </select>
          </DrawerField>

          <DrawerField label="Status">
            <select
              value={statusValue}
              onChange={(e) => setStatusValue(e.target.value)}
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-1.5 text-sm text-white outline-none focus:border-cyan-400/40"
            >
              {STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
            </select>
          </DrawerField>

          <DrawerField label="Seats">
            <input
              type="number"
              min={0}
              max={10000}
              value={seats}
              onChange={(e) => setSeats(e.target.value)}
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-1.5 text-sm text-white outline-none focus:border-cyan-400/40"
            />
          </DrawerField>

          <DrawerField
            label="Monthly price (cents)"
            hint={`Leave empty to use plan default (${formatMoney(PLAN_DEFAULT_PRICE_CENTS[plan] ?? 0)}).`}
          >
            <input
              type="number"
              min={0}
              step={100}
              placeholder={`${PLAN_DEFAULT_PRICE_CENTS[plan] ?? 0}`}
              value={priceCents}
              onChange={(e) => setPriceCents(e.target.value)}
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-1.5 text-sm text-white outline-none focus:border-cyan-400/40"
            />
          </DrawerField>

          <div className="grid grid-cols-2 gap-2">
            <DrawerField label="Period start">
              <input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-400/40"
              />
            </DrawerField>
            <DrawerField label="Period end">
              <input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-400/40"
              />
            </DrawerField>
          </div>

          <DrawerField label="Trial ends">
            <input
              type="date"
              value={trialEnd}
              onChange={(e) => setTrialEnd(e.target.value)}
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-400/40"
            />
          </DrawerField>

          <DrawerField label="Notes">
            <textarea
              rows={3}
              maxLength={1000}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional admin note (e.g. negotiated NGO discount)."
              className="w-full resize-none rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-400/40"
            />
          </DrawerField>
        </div>

        {saveError && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
            <AlertCircle className="h-3.5 w-3.5" /> {saveError}
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/[0.08] disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 px-3.5 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}

function DrawerField({ label, hint, children }) {
  return (
    <label className="block">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">{label}</span>
      <div className="mt-1">{children}</div>
      {hint && <p className="mt-0.5 text-[10px] text-slate-500">{hint}</p>}
    </label>
  );
}
