import { useEffect, useState } from 'react';
import {
  Building2, Users, Activity, Database, Gauge, ShieldCheck,
  TrendingUp, ArrowUpRight, Zap,
} from 'lucide-react';
import AdminLayout from '../../layout/AdminLayout.jsx';
import PageHeader, { StatCard } from '../../components/shared/PageHeader.jsx';

/**
 * Overview — executive snapshot of the entire FlowOps platform.
 */

const GROWTH = [
  { m: 'Jan', orgs: 184 }, { m: 'Feb', orgs: 209 }, { m: 'Mar', orgs: 246 },
  { m: 'Apr', orgs: 281 }, { m: 'May', orgs: 318 }, { m: 'Jun', orgs: 362 },
  { m: 'Jul', orgs: 401 }, { m: 'Aug', orgs: 438 }, { m: 'Sep', orgs: 482 },
  { m: 'Oct', orgs: 521 }, { m: 'Nov', orgs: 574 }, { m: 'Dec', orgs: 628 },
];

const LIVE_EVENTS = [
  { who: 'Riverside Clinic',   what: 'served 14 customers in the last hour',  ago: '12s', tone: 'emerald' },
  { who: 'Banco Central',      what: 'upgraded to Enterprise plan',           ago: '1m',  tone: 'violet'  },
  { who: 'Lush Salon',         what: 'new organization onboarded',            ago: '3m',  tone: 'cyan'    },
  { who: 'City Hall · Permits', what: 'spike detected · 2.4× normal volume',  ago: '6m',  tone: 'amber'   },
  { who: 'API Gateway',        what: 'rotated TLS certificate · zero downtime', ago: '11m', tone: 'sky'   },
  { who: 'NorthBank Queue',    what: 'service desk paused',                   ago: '14m', tone: 'rose'    },
];

const INDUSTRIES = [
  { name: 'Clinics',     count: 184, pct: 29 },
  { name: 'Banks',       count: 142, pct: 23 },
  { name: 'Restaurants', count: 96,  pct: 15 },
  { name: 'Salons',      count: 81,  pct: 13 },
  { name: 'Government',  count: 73,  pct: 12 },
  { name: 'Hospitals',   count: 52,  pct: 8  },
];

export default function Overview() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Platform overview · Live"
          title="FlowOps Command Center"
          subtitle="The state of the entire platform — organizations, users, infrastructure, and revenue."
          crumbs={[{ label: 'Admin' }, { label: 'Overview' }]}
          actions={(
            <button className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/[0.08]">
              <TrendingUp className="h-3.5 w-3.5" /> Last 30 days
            </button>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <CounterCard label="Organizations"          target={628}   suffix=""    delta="+54 this month"    tone="violet" icon={Building2} />
          <CounterCard label="Active orgs (24h)"      target={471}   suffix=""    delta="75% engagement"     tone="cyan"   icon={Activity} />
          <CounterCard label="Monthly active users"   target={18420} suffix=""    delta="↑ 12% vs last mo"   tone="emerald" icon={Users} />
          <CounterCard label="Customers today"        target={92314} suffix=""    delta="↑ 4.8% vs avg day"  tone="amber"  icon={Gauge} />
          <CounterCard label="Active queues"          target={1284}  suffix=""    delta="Live across regions" tone="rose"  icon={Zap} />
          <CounterCard label="System health"          target={99.97} suffix="%"  delta="30-day SLA: 99.95%"  tone="emerald" icon={ShieldCheck} decimals={2} />
        </div>

        <div className="grid gap-5 xl:grid-cols-12">
          <section className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5 xl:col-span-8">
            <div className="flex items-baseline justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Platform growth</h3>
                <p className="text-xs text-slate-400">Total organizations · last 12 months</p>
              </div>
              <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300 ring-1 ring-emerald-400/30">
                +241% YoY
              </span>
            </div>
            <GrowthChart data={GROWTH} />
          </section>

          <section className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5 xl:col-span-4">
            <div className="flex items-baseline justify-between">
              <h3 className="text-sm font-semibold text-white">Real-time activity</h3>
              <span className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-300">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> Live
              </span>
            </div>
            <ul className="mt-4 space-y-2.5">
              {LIVE_EVENTS.map((e, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                    { emerald: 'bg-emerald-400', violet: 'bg-violet-400', cyan: 'bg-cyan-400',
                      amber: 'bg-amber-400', sky: 'bg-sky-400', rose: 'bg-rose-400' }[e.tone]
                  }`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs text-slate-300">
                      <span className="font-semibold text-white">{e.who}</span> {e.what}
                    </p>
                    <p className="text-[10px] text-slate-500">{e.ago} ago</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5 xl:col-span-7">
            <div className="flex items-baseline justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Industry mix</h3>
                <p className="text-xs text-slate-400">Distribution of organizations</p>
              </div>
              <button className="text-xs font-semibold text-violet-300 hover:text-violet-200 inline-flex items-center gap-1">
                Full breakdown <ArrowUpRight className="h-3 w-3" />
              </button>
            </div>
            <ul className="mt-4 space-y-2.5">
              {INDUSTRIES.map((row) => (
                <li key={row.name}>
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="font-medium text-slate-200">{row.name}</span>
                    <span className="font-mono text-slate-400">{row.count} <span className="opacity-50">· {row.pct}%</span></span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                    <div className="h-full rounded-full bg-gradient-to-r from-violet-400 via-cyan-400 to-blue-500" style={{ width: `${row.pct * 3}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5 xl:col-span-5">
            <h3 className="text-sm font-semibold text-white">Global KPIs</h3>
            <p className="text-xs text-slate-400">This billing period</p>
            <ul className="mt-4 space-y-2.5">
              <KpiRow label="Monthly recurring revenue" value="$284,610" delta="↑ 18.4%" tone="emerald" />
              <KpiRow label="Net new orgs"              value="54"        delta="↑ 11"    tone="violet" />
              <KpiRow label="Avg customer wait (global)" value="6m 42s"  delta="↓ 38s"   tone="cyan" />
              <KpiRow label="Churn rate"                value="2.1%"      delta="↓ 0.4%"  tone="emerald" />
              <KpiRow label="Open incidents"            value="1"         delta="P3 · investigating" tone="amber" />
            </ul>
          </section>
        </div>
      </div>
    </AdminLayout>
  );
}

// --- atoms -------------------------------------------------------------------

function CounterCard({ label, target, suffix = '', delta, tone, icon, decimals = 0 }) {
  const value = useCountUp(target, decimals);
  return (
    <StatCard
      label={label}
      value={`${value}${suffix}`}
      delta={delta}
      tone={tone}
      icon={icon}
    />
  );
}

function useCountUp(target, decimals = 0) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf;
    const start = performance.now();
    const dur = 900;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setV(target * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else setV(target);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return decimals
    ? v.toFixed(decimals)
    : Math.round(v).toLocaleString();
}

function GrowthChart({ data }) {
  const W = 720, H = 200, P = 24;
  const max = Math.max(...data.map((d) => d.orgs));
  const min = Math.min(...data.map((d) => d.orgs));
  const pts = data.map((d, i) => {
    const x = P + (i / (data.length - 1)) * (W - P * 2);
    const y = H - P - ((d.orgs - min) / (max - min)) * (H - P * 2);
    return [x, y];
  });
  const path = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y}`).join(' ');
  const area = `${path} L${pts[pts.length - 1][0]},${H - P} L${pts[0][0]},${H - P} Z`;
  return (
    <div className="mt-4">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-44 w-full">
        <defs>
          <linearGradient id="grow" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="line" x1="0" x2="1">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#grow)" />
        <path d={path} fill="none" stroke="url(#line)" strokeWidth="2.2" strokeLinecap="round" />
        {pts.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="2.4" fill="#22d3ee" opacity={i === pts.length - 1 ? 1 : 0.5} />
        ))}
      </svg>
      <div className="mt-2 flex justify-between text-[10px] font-mono text-slate-500">
        {data.map((d) => <span key={d.m}>{d.m}</span>)}
      </div>
    </div>
  );
}

function KpiRow({ label, value, delta, tone }) {
  const colors = {
    emerald: 'text-emerald-300', violet: 'text-violet-300',
    cyan: 'text-cyan-300', amber: 'text-amber-300',
  };
  return (
    <li className="flex items-center justify-between rounded-2xl border border-white/[0.04] bg-white/[0.02] px-3 py-2.5">
      <span className="text-xs text-slate-400">{label}</span>
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-sm font-bold text-white">{value}</span>
        <span className={`text-[10px] font-semibold ${colors[tone]}`}>{delta}</span>
      </div>
    </li>
  );
}
