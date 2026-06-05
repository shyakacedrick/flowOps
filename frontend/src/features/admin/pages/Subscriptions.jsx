import { CreditCard, TrendingUp, Repeat, AlertTriangle, Check, Crown, Sparkles, Zap } from 'lucide-react';
import AdminLayout from '@/features/admin/components/AdminShell.jsx';
import PageHeader, { StatCard } from '@/shared/components/PageHeader.jsx';

const PLANS = [
  {
    name: 'Free', icon: Sparkles, tone: 'slate', price: '$0', period: 'forever',
    blurb: 'Get started with one queue and basic analytics.',
    active: 184, mrr: 0,
    features: ['1 location · 1 queue', 'Up to 50 customers/day', 'Basic dashboard', 'Email support'],
  },
  {
    name: 'Premium', icon: Zap, tone: 'cyan', price: '$49', period: 'per location / mo',
    blurb: 'Multi-queue, custom branding, full analytics suite.',
    active: 312, mrr: 18420, popular: true,
    features: ['Unlimited queues', 'Smart insights AI', 'Custom branding', 'Priority support'],
  },
  {
    name: 'Enterprise', icon: Crown, tone: 'violet', price: 'Custom', period: 'annual contract',
    blurb: 'SLA-backed deployments with dedicated infrastructure.',
    active: 132, mrr: 266190,
    features: ['SLA 99.99% · region pinning', 'SSO + SCIM provisioning', 'Dedicated CSM', 'Audit + compliance pack'],
  },
];

const TONE_RING = {
  slate:  'border-white/[0.06] bg-white/[0.02]',
  cyan:   'border-cyan-400/30 bg-gradient-to-b from-cyan-500/10 to-transparent',
  violet: 'border-violet-400/40 bg-gradient-to-b from-violet-500/15 to-transparent',
};

const TONE_BADGE = {
  slate:  'bg-white/10 text-slate-300',
  cyan:   'bg-cyan-500/20 text-cyan-200',
  violet: 'bg-violet-500/20 text-violet-200',
};

const RECENT_INVOICES = [
  { id: 'inv_3091', org: 'St. Mary Hospital',        amount: '$3,800', plan: 'Enterprise', status: 'paid',     date: 'Jun 1' },
  { id: 'inv_3088', org: 'Banco Central',            amount: '$2,400', plan: 'Enterprise', status: 'paid',     date: 'Jun 1' },
  { id: 'inv_3074', org: 'NorthBank Queue',          amount: '$2,100', plan: 'Enterprise', status: 'paid',     date: 'Jun 1' },
  { id: 'inv_3068', org: 'City Hall · Permits',      amount: '$720',   plan: 'Premium',    status: 'paid',     date: 'Jun 1' },
  { id: 'inv_3062', org: 'Skyline Dental Group',     amount: '$620',   plan: 'Premium',    status: 'paid',     date: 'Jun 1' },
  { id: 'inv_3058', org: 'Riverside Family Clinic',  amount: '$480',   plan: 'Premium',    status: 'paid',     date: 'Jun 1' },
  { id: 'inv_3041', org: 'Sakura Ramen House',       amount: '$360',   plan: 'Premium',    status: 'failed',   date: 'May 31' },
  { id: 'inv_3037', org: 'Velvet Hair Studio',       amount: '$240',   plan: 'Premium',    status: 'paid',     date: 'May 31' },
];

const STATUS_STYLE = {
  paid:   'bg-emerald-500/10 text-emerald-300 ring-emerald-400/30',
  failed: 'bg-rose-500/10 text-rose-300 ring-rose-400/30',
  refunded:'bg-amber-500/10 text-amber-300 ring-amber-400/30',
};

export default function Subscriptions() {
  const totalMrr = PLANS.reduce((s, p) => s + p.mrr, 0);
  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Billing"
          title="Subscriptions"
          subtitle="Plans, recurring revenue, conversions, and invoices across FlowOps."
          crumbs={[{ label: 'Admin' }, { label: 'Subscriptions' }]}
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="MRR"             value={`$${totalMrr.toLocaleString()}`} delta="↑ 18.4% MoM" tone="emerald" icon={CreditCard} />
          <StatCard label="ARR run-rate"    value={`$${(totalMrr * 12).toLocaleString()}`} delta="Annualized" tone="violet" icon={TrendingUp} />
          <StatCard label="Free → Paid"     value="34%"      delta="Last 30 days"    tone="cyan"    icon={Repeat} />
          <StatCard label="Renewal rate"    value="94.2%"    delta="12-mo trailing"  tone="emerald" />
        </div>

        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h3 className="text-sm font-semibold text-white">Plans</h3>
            <p className="text-xs text-slate-400">{PLANS.reduce((s, p) => s + p.active, 0).toLocaleString()} total active subscriptions</p>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            {PLANS.map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.name}
                  className={`relative rounded-3xl border p-6 ${TONE_RING[p.tone]} ${p.popular ? 'ring-1 ring-cyan-400/40 shadow-[0_0_40px_-12px_rgba(34,211,238,0.4)]' : ''}`}>
                  {p.popular && (
                    <span className="absolute -top-2.5 right-6 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-900">
                      Most popular
                    </span>
                  )}
                  <div className="flex items-center justify-between">
                    <span className={`grid h-10 w-10 place-items-center rounded-2xl ${TONE_BADGE[p.tone]}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${TONE_BADGE[p.tone]}`}>
                      {p.name}
                    </span>
                  </div>
                  <p className="mt-4 text-3xl font-bold text-white">{p.price}<span className="ml-1 text-xs font-medium text-slate-400">/ {p.period}</span></p>
                  <p className="mt-1 text-xs text-slate-400">{p.blurb}</p>
                  <ul className="mt-5 space-y-2 text-sm">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-slate-200">
                        <Check className="h-3.5 w-3.5 text-emerald-300" /> {f}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 flex items-baseline justify-between border-t border-white/[0.05] pt-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Active subs</p>
                      <p className="text-lg font-bold text-white">{p.active}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">MRR</p>
                      <p className="font-mono text-sm font-semibold text-emerald-300">${p.mrr.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
          <div className="flex items-baseline justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Recent invoices</h3>
              <p className="text-xs text-slate-400">Last billing cycle</p>
            </div>
            <button className="text-xs font-semibold text-violet-300 hover:text-violet-200">Export CSV →</button>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                <tr className="border-b border-white/[0.05]">
                  <th className="px-3 py-2.5 text-left">Invoice</th>
                  <th className="px-3 py-2.5 text-left">Organization</th>
                  <th className="px-3 py-2.5 text-left">Plan</th>
                  <th className="px-3 py-2.5 text-right">Amount</th>
                  <th className="px-3 py-2.5 text-left">Status</th>
                  <th className="px-3 py-2.5 text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {RECENT_INVOICES.map((inv) => (
                  <tr key={inv.id} className="border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02]">
                    <td className="px-3 py-2.5 font-mono text-xs text-slate-300">{inv.id}</td>
                    <td className="px-3 py-2.5 font-medium text-white">{inv.org}</td>
                    <td className="px-3 py-2.5 text-slate-300">{inv.plan}</td>
                    <td className="px-3 py-2.5 text-right font-mono font-semibold text-emerald-300">{inv.amount}</td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ring-1 ${STATUS_STYLE[inv.status]}`}>
                        {inv.status === 'failed' && <AlertTriangle className="h-2.5 w-2.5" />}
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-slate-400">{inv.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
