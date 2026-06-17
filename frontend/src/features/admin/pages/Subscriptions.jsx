// ============================================================================
//  Admin · Subscriptions — real plan distribution, no marketing scaffolding
// ----------------------------------------------------------------------------
//  Every number on this page is derived from real organization records
//  returned by /api/organizations. The fabricated price tags, feature
//  lists, "Most popular" badges, fake MRR figures, and synthetic invoice
//  table have been removed. Billing integration is not live yet — that's
//  surfaced honestly with empty states.
// ============================================================================

import { useMemo } from 'react';
import {
  CreditCard, Building2, AlertCircle, RefreshCw, Sparkles, Zap, Crown,
} from 'lucide-react';
import AdminLayout from '@/features/admin/components/AdminShell.jsx';
import PageHeader, { StatCard } from '@/shared/components/PageHeader.jsx';
import EmptyState from '@/shared/components/EmptyState.jsx';
import useOrganizations from '@/features/admin/hooks/useOrganizations.js';

// Plan slugs MUST match Organization.plan enum on the backend.
// We render every slug — even ones with zero subscribers — so admins
// always see the full picture rather than a card popping in/out.
const PLAN_META = {
  starter: { name: 'Starter', icon: Sparkles, tone: 'slate'  },
  growth:  { name: 'Growth',  icon: Zap,      tone: 'cyan'   },
  scale:   { name: 'Scale',   icon: Crown,    tone: 'violet' },
};
const PLAN_ORDER = ['starter', 'growth', 'scale'];

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

export default function Subscriptions() {
  const { organizations, status, error, refresh } = useOrganizations({ pollMs: 60_000 });

  const totalOrgs     = organizations.length;
  const activeOrgs    = organizations.filter((o) => !o.suspendedAt).length;
  const suspendedOrgs = organizations.filter((o) =>  o.suspendedAt).length;

  // Real plan counts.
  const breakdown = useMemo(() => {
    const counts = new Map(PLAN_ORDER.map((slug) => [slug, 0]));
    for (const org of organizations) {
      const slug = PLAN_ORDER.includes(org.plan) ? org.plan : 'starter';
      counts.set(slug, (counts.get(slug) || 0) + 1);
    }
    return PLAN_ORDER.map((slug) => {
      const count = counts.get(slug) || 0;
      return {
        slug,
        ...PLAN_META[slug],
        count,
        pct: totalOrgs ? Math.round((count / totalOrgs) * 100) : 0,
      };
    });
  }, [organizations, totalOrgs]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Billing"
          title="Subscriptions"
          subtitle="Plan distribution across the platform. Pricing & billing integration is on the roadmap."
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
          <StatCard label="Total organizations" value={totalOrgs}     delta="Across all plans"           tone="violet"  icon={Building2} />
          <StatCard label="Active subs"         value={activeOrgs}    delta={`${suspendedOrgs} suspended`} tone="emerald" icon={CreditCard} />
          <StatCard label="MRR"                 value="—"             delta="Billing not yet integrated" tone="slate" />
          <StatCard label="Renewal rate"        value="—"             delta="Tracked once billing ships" tone="slate" />
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

                    <p className="mt-5 text-4xl font-bold tabular-nums text-white">
                      {p.count}
                    </p>
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

        <section className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
          <div className="flex items-baseline justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Recent invoices</h3>
              <p className="text-xs text-slate-400">Last billing cycle</p>
            </div>
          </div>
          <div className="mt-2">
            <EmptyState
              icon={CreditCard}
              tone="info"
              size="sm"
              title="Billing not yet integrated"
              message="Invoices, MRR, and renewal metrics will appear here once Stripe billing is wired into the platform. The plan distribution above is computed from real organization records."
            />
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
