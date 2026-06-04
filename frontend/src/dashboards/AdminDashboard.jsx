import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard,
  Building2,
  Users,
  ShieldCheck,
  Activity,
  Server,
  Globe2,
  TrendingUp,
} from 'lucide-react';
import DashboardShell from './DashboardShell.jsx';
import { useFlowOps } from '../engine/FlowOpsProvider.jsx';
import { useCountUp } from '../hooks/useCountUp.js';
import { ease } from '../animations/motion.js';

const NAV = [
  { key: 'overview', label: 'Platform',  icon: LayoutDashboard },
  { key: 'tenants',  label: 'Tenants',   icon: Building2 },
  { key: 'health',   label: 'Health',    icon: Server },
  { key: 'security', label: 'Security',  icon: ShieldCheck },
];

const TENANTS = [
  { name: 'Clarity Clinics',       industry: 'Clinics',    locations: 14, served: 1284, trend: '+12%', tone: 'emerald' },
  { name: 'NorthBank',             industry: 'Banks',      locations: 38, served: 3102, trend: '+4%',  tone: 'emerald' },
  { name: 'Lumen Salons',          industry: 'Salons',     locations: 9,  served: 412,  trend: '-2%',  tone: 'rose' },
  { name: 'Forge Diner',           industry: 'Restaurants',locations: 6,  served: 287,  trend: '+18%', tone: 'emerald' },
  { name: 'Metro Service Centre',  industry: 'Government', locations: 22, served: 1944, trend: '+6%',  tone: 'emerald' },
];

function StatTile({ icon: Icon, label, value, suffix = '', sub }) {
  const shown = useCountUp(value, { duration: 800 });
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 backdrop-blur-xl">
      <div className="pointer-events-none absolute -top-12 -right-10 h-32 w-32 rounded-full bg-primary/15 blur-2xl opacity-50" />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
            {label}
          </p>
          <p className="mt-2 text-3xl font-bold text-white tabular-nums">
            {shown}{suffix && <span className="ml-0.5 text-base font-medium text-slate-400">{suffix}</span>}
          </p>
          {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
        </div>
        <div className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-gradient-to-br from-primary/20 to-secondary/10 text-primary">
          <Icon className="h-4 w-4" strokeWidth={2.2} />
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [tab, setTab] = useState('overview');
  const state = useFlowOps();

  // Aggregate platform-wide signals derived from real sim + static tenant book.
  const totalTenants = TENANTS.length;
  const totalLocations = TENANTS.reduce((s, t) => s + t.locations, 0);
  const totalServed = TENANTS.reduce((s, t) => s + t.served, 0) + state.analytics.totalServed;

  return (
    <DashboardShell navItems={NAV} activeKey={tab} onNav={setTab}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Platform overview</h1>
          <p className="mt-1 text-sm text-slate-400">
            System-wide health and activity across every FlowOps tenant.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          All systems operational
        </span>
      </div>

      {/* Top metrics */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={Building2} label="Active tenants"    value={totalTenants}    sub="+1 this week" />
        <StatTile icon={Globe2}    label="Locations"          value={totalLocations}  sub="across 5 industries" />
        <StatTile icon={Users}     label="Customers served"   value={totalServed}     sub="rolling 24h" />
        <StatTile icon={TrendingUp}label="Avg uptime"          value={99.98} suffix="%" sub="last 30 days" />
      </div>

      {/* System health */}
      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 backdrop-blur-xl lg:col-span-2">
          <h2 className="text-sm font-semibold text-white">Tenant activity</h2>
          <p className="text-xs text-slate-500">Top 5 tenants by customers served today</p>

          <div className="mt-5 overflow-hidden rounded-xl border border-white/[0.06]">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/[0.02] text-[10px] uppercase tracking-widest text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-semibold">Tenant</th>
                  <th className="px-4 py-2 font-semibold">Industry</th>
                  <th className="px-4 py-2 text-right font-semibold">Locations</th>
                  <th className="px-4 py-2 text-right font-semibold">Served (24h)</th>
                  <th className="px-4 py-2 text-right font-semibold">Trend</th>
                </tr>
              </thead>
              <tbody>
                {TENANTS.map((t) => (
                  <motion.tr
                    key={t.name}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: ease.out }}
                    className="border-t border-white/[0.04]"
                  >
                    <td className="px-4 py-2.5 font-medium text-white">{t.name}</td>
                    <td className="px-4 py-2.5 text-slate-400">{t.industry}</td>
                    <td className="px-4 py-2.5 text-right text-slate-300 tabular-nums">{t.locations}</td>
                    <td className="px-4 py-2.5 text-right text-slate-300 tabular-nums">{t.served.toLocaleString()}</td>
                    <td className={`px-4 py-2.5 text-right font-medium tabular-nums ${
                      t.tone === 'emerald' ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {t.trend}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 backdrop-blur-xl">
          <h2 className="text-sm font-semibold text-white">System health</h2>
          <p className="text-xs text-slate-500">Service-level signals</p>
          <ul className="mt-5 space-y-3">
            {[
              { label: 'API gateway',     value: '142ms',  ok: true },
              { label: 'Event pipeline',  value: 'nominal', ok: true },
              { label: 'Analytics worker',value: '1.2s lag',ok: true },
              { label: 'WebSocket fanout',value: 'stable',  ok: true },
            ].map((h) => (
              <li
                key={h.label}
                className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2.5"
              >
                <span className="flex items-center gap-2 text-sm text-slate-200">
                  <span className={`h-2 w-2 rounded-full ${h.ok ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                  {h.label}
                </span>
                <span className="font-mono text-xs text-slate-400">{h.value}</span>
              </li>
            ))}
          </ul>

          <div className="mt-5 rounded-xl border border-primary/20 bg-primary/[0.05] p-3">
            <p className="text-xs font-semibold text-primary">Reference simulation</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-300">
              Currently <span className="font-mono text-white">{state.queue.length}</span> customers in
              the live reference tenant queue. Useful for validating release builds.
            </p>
          </div>
        </div>
      </div>

      {/* Recent events */}
      <div className="mt-5 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Recent platform events</h2>
          <Activity className="h-4 w-4 text-slate-500" />
        </div>
        <ul className="mt-4 space-y-2">
          <AnimatePresence initial={false}>
            <motion.li
              key={state.lastEvent.type + state.lastEvent.at}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.3, ease: ease.out }}
              className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2 text-xs"
            >
              <span className="text-slate-300">
                <span className="font-mono text-slate-500">[sim]</span>{' '}
                {state.lastEvent.type.replace('_', ' ').toLowerCase()}{' '}
                {state.lastEvent.ref ? <span className="font-mono text-slate-400">{state.lastEvent.ref}</span> : null}
              </span>
              <span className="font-mono text-slate-500">t+{state.lastEvent.at}m</span>
            </motion.li>
          </AnimatePresence>
          <li className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2 text-xs">
            <span className="text-slate-300"><span className="font-mono text-slate-500">[deploy]</span> release v2.6.1 promoted to prod</span>
            <span className="font-mono text-slate-500">11m ago</span>
          </li>
          <li className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2 text-xs">
            <span className="text-slate-300"><span className="font-mono text-slate-500">[tenant]</span> Forge Diner enabled SSO</span>
            <span className="font-mono text-slate-500">42m ago</span>
          </li>
        </ul>
      </div>
    </DashboardShell>
  );
}
