import { LineChart, BarChart3, Users, Building2, Zap, Globe2 } from 'lucide-react';
import AdminLayout from '../../layout/AdminLayout.jsx';
import PageHeader, { StatCard } from '../../components/shared/PageHeader.jsx';

const DAILY = [
  42, 51, 48, 63, 71, 88, 79, 92, 104, 96, 118, 124, 132, 145,
  138, 152, 161, 158, 174, 188, 196, 202, 218, 231, 244, 258, 271, 286, 294, 312,
];

const ENGAGEMENT = [
  { region: 'US-East',  active: 4820, share: 31 },
  { region: 'EU-West',  active: 3940, share: 26 },
  { region: 'US-West',  active: 2810, share: 18 },
  { region: 'LatAm',    active: 1980, share: 13 },
  { region: 'APAC',     active: 1240, share: 8  },
  { region: 'MEA',      active: 720,  share: 4  },
];

const FEATURES = [
  { name: 'Smart Insights AI', adoption: 78, change: '+9%'  },
  { name: 'Custom Branding',   adoption: 64, change: '+12%' },
  { name: 'SMS Notifications', adoption: 58, change: '+4%'  },
  { name: 'Multi-Location',    adoption: 41, change: '+18%' },
  { name: 'API Integrations',  adoption: 34, change: '+6%'  },
  { name: 'Webhook Events',    adoption: 22, change: '+11%' },
];

const INDUSTRIES = [
  { name: 'Clinics',     count: 184, pct: 29 },
  { name: 'Banks',       count: 142, pct: 23 },
  { name: 'Restaurants', count: 96,  pct: 15 },
  { name: 'Salons',      count: 81,  pct: 13 },
  { name: 'Government',  count: 73,  pct: 12 },
  { name: 'Hospitals',   count: 52,  pct: 8  },
];

export default function PlatformAnalytics() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Intelligence"
          title="Platform Analytics"
          subtitle="Trends, adoption, and engagement across every business on FlowOps."
          crumbs={[{ label: 'Admin' }, { label: 'Platform Analytics' }]}
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Customers processed today" value="92,314"  delta="↑ 4.8% vs avg" tone="violet" icon={Users} />
          <StatCard label="Queue events today"        value="412,890" delta="Peak 14:00"     tone="cyan"   icon={Zap} />
          <StatCard label="Avg session length"        value="18m 24s" delta="↑ 1m vs LW"     tone="emerald" />
          <StatCard label="Feature adoption (avg)"    value="49%"     delta="↑ 7pt MoM"      tone="amber"  icon={BarChart3} />
        </div>

        <div className="grid gap-5 xl:grid-cols-12">
          <section className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5 xl:col-span-8">
            <div className="flex items-baseline justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Daily platform usage</h3>
                <p className="text-xs text-slate-400">Customers processed · last 30 days (thousands)</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300 ring-1 ring-emerald-400/30">
                <LineChart className="h-3 w-3" /> +84% MoM
              </span>
            </div>
            <BarChart data={DAILY} />
          </section>

          <section className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5 xl:col-span-4">
            <h3 className="text-sm font-semibold text-white">Active users by region</h3>
            <p className="text-xs text-slate-400">Last 24 hours</p>
            <ul className="mt-4 space-y-3">
              {ENGAGEMENT.map((r) => (
                <li key={r.region}>
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="flex items-center gap-1.5 font-medium text-slate-200">
                      <Globe2 className="h-3 w-3 text-violet-300" /> {r.region}
                    </span>
                    <span className="font-mono text-slate-400">{r.active.toLocaleString()}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                    <div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-cyan-400" style={{ width: `${r.share * 3}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5 xl:col-span-7">
            <h3 className="text-sm font-semibold text-white">Feature adoption</h3>
            <p className="text-xs text-slate-400">Percentage of orgs actively using each feature</p>
            <ul className="mt-4 space-y-3">
              {FEATURES.map((f) => (
                <li key={f.name} className="flex items-center gap-4 rounded-2xl border border-white/[0.04] bg-white/[0.02] px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="font-medium text-white">{f.name}</span>
                      <span className="font-mono text-slate-400">{f.adoption}% <span className="ml-1 text-emerald-300">{f.change}</span></span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                      <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400" style={{ width: `${f.adoption}%` }} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5 xl:col-span-5">
            <h3 className="text-sm font-semibold text-white">Industry breakdown</h3>
            <p className="text-xs text-slate-400">Organizations by industry</p>
            <ul className="mt-4 space-y-2.5">
              {INDUSTRIES.map((row) => (
                <li key={row.name} className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-xs text-slate-300">
                    <Building2 className="h-3 w-3 text-violet-300" />
                    {row.name}
                  </span>
                  <span className="font-mono text-xs text-slate-400">
                    {row.count} <span className="ml-1 opacity-60">· {row.pct}%</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </AdminLayout>
  );
}

function BarChart({ data }) {
  const max = Math.max(...data);
  return (
    <div className="mt-5 flex h-44 items-end gap-1.5">
      {data.map((v, i) => {
        const h = (v / max) * 100;
        return (
          <div key={i} className="flex h-full flex-1 items-end">
            <div
              className="w-full rounded-md bg-gradient-to-t from-violet-500/60 via-cyan-400/70 to-cyan-300 transition-all hover:from-violet-500 hover:to-white"
              style={{ height: `${h}%` }}
              title={`${v}k`}
            />
          </div>
        );
      })}
    </div>
  );
}
