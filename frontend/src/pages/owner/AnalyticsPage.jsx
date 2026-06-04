import { BarChart3, TrendingUp, Clock, Users, Download } from 'lucide-react';
import HybridDashboardShell from '../../dashboards/HybridDashboardShell.jsx';
import PageHeader, { StatCard } from '../../components/shared/PageHeader.jsx';
import CustomerFlowChart from '../../components/owner/hybrid/CustomerFlowChart.jsx';
import { useSimulationSlice } from '../../engine/SimulationProvider.jsx';

/**
 * AnalyticsPage — "How has the business performed over time?"
 *
 * Historical KPIs, peak-hour heatmap, monthly comparisons.
 */
const PEAK_HOURS = [
  { h: '08', v: 14 }, { h: '09', v: 32 }, { h: '10', v: 58 },
  { h: '11', v: 72 }, { h: '12', v: 86 }, { h: '13', v: 78 },
  { h: '14', v: 61 }, { h: '15', v: 49 }, { h: '16', v: 42 },
  { h: '17', v: 55 }, { h: '18', v: 38 }, { h: '19', v: 18 },
];

const MONTHS = [
  { m: 'Jan', served: 2880, wait: 14 },
  { m: 'Feb', served: 2912, wait: 13 },
  { m: 'Mar', served: 3208, wait: 12 },
  { m: 'Apr', served: 3540, wait: 11 },
  { m: 'May', served: 3766, wait: 10 },
  { m: 'Jun', served: 4012, wait: 10 },
];

export default function AnalyticsPage() {
  const history   = useSimulationSlice((s) => s.history);
  const analytics = useSimulationSlice((s) => s.analytics);

  const max = Math.max(...PEAK_HOURS.map((p) => p.v));

  return (
    <HybridDashboardShell>
      <div className="space-y-6 pt-2">
        <PageHeader
          eyebrow="Business intelligence"
          title="Analytics"
          subtitle="Long-term performance, peak demand, and operational trend reports."
          crumbs={[{ label: 'Intelligence' }, { label: 'Analytics' }]}
          actions={
            <button className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-white/[0.08]">
              <Download className="h-3.5 w-3.5" /> Export report
            </button>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total served (30d)" value={analytics.totalServed || '4,012'} delta="↑ 8% vs prev period" tone="cyan"    icon={Users} />
          <StatCard label="Avg wait time"      value="11m"                              delta="↓ 3m vs prev period" tone="emerald" icon={Clock} />
          <StatCard label="Peak hour"          value="12:00"                            delta="86 customers/hr"    tone="violet"  icon={TrendingUp} />
          <StatCard label="Service throughput" value="22 / hr"                          delta="Per active counter" tone="amber"   icon={BarChart3} />
        </div>

        <CustomerFlowChart
          totalServed={analytics.totalServed || 4012}
          avgWait={11}
          activeCounters={4}
          history={history}
        />

        <section className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="flex items-baseline justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Peak hour analysis</h3>
                <p className="text-xs text-slate-400">Average customers per hour · last 30 days</p>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">08:00 – 19:00</span>
            </div>
            <div className="mt-5 flex h-44 items-end gap-1.5">
              {PEAK_HOURS.map((p) => {
                const pct = (p.v / max) * 100;
                const hot = p.v >= max * 0.75;
                return (
                  <div key={p.h} className="flex flex-1 flex-col items-center gap-1.5">
                    <div className="flex h-full w-full items-end overflow-hidden rounded-md">
                      <div
                        className={`w-full rounded-md ${hot ? 'bg-gradient-to-t from-rose-500/70 to-amber-400/70' : 'bg-gradient-to-t from-cyan-500/60 to-blue-400/60'}`}
                        style={{ height: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[9px] font-medium text-slate-500">{p.h}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
            <h3 className="text-sm font-semibold text-white">Monthly comparison</h3>
            <p className="text-xs text-slate-400">Customers served & avg wait</p>
            <ul className="mt-4 divide-y divide-white/[0.05]">
              {MONTHS.map((row, i) => {
                const prev = MONTHS[i - 1];
                const delta = prev ? Math.round(((row.served - prev.served) / prev.served) * 100) : 0;
                return (
                  <li key={row.m} className="flex items-center gap-4 py-2.5">
                    <span className="w-10 text-xs font-semibold text-slate-400">{row.m}</span>
                    <div className="flex-1">
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
                          style={{ width: `${(row.served / 4200) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="w-16 text-right text-sm font-semibold text-white tabular-nums">{row.served.toLocaleString()}</span>
                    <span className={`w-12 text-right text-[11px] font-semibold tabular-nums ${delta >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                      {delta >= 0 ? '+' : ''}{delta}%
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      </div>
    </HybridDashboardShell>
  );
}
