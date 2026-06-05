import { Users, Gauge, Timer, Award, TrendingUp } from 'lucide-react';
import HybridDashboardShell from '@/features/dashboard/components/HybridDashboardShell.jsx';
import PageHeader, { StatCard } from '@/shared/components/PageHeader.jsx';

/**
 * OperationsPage — "How effectively is my team operating?"
 *
 * Staff utilization, desk performance, service quality.
 */
const STAFF = [
  { name: 'Jordan Lee',   desk: 'Counter 1',  served: 38, avg: '4m 12s', eff: 96, tone: 'emerald' },
  { name: 'Priya Shah',   desk: 'Counter 2',  served: 34, avg: '4m 48s', eff: 92, tone: 'emerald' },
  { name: 'Marcus Allen', desk: 'Counter 3',  served: 29, avg: '5m 02s', eff: 88, tone: 'cyan'    },
  { name: 'Aiko Tanaka',  desk: 'Counter 4',  served: 26, avg: '5m 41s', eff: 81, tone: 'cyan'    },
  { name: 'Dr. R. Owens', desk: 'Specialist', served: 12, avg: '11m 02s',eff: 74, tone: 'amber'   },
];

const TONES = {
  emerald: 'from-emerald-400 to-teal-500',
  cyan:    'from-cyan-400 to-blue-500',
  amber:   'from-amber-400 to-orange-500',
};

export default function OperationsPage() {
  return (
    <HybridDashboardShell>
      <div className="space-y-6 pt-2">
        <PageHeader
          eyebrow="Team performance"
          title="Operations"
          subtitle="Track staff productivity, desk utilization, and service quality across every counter."
          crumbs={[{ label: 'Workspace' }, { label: 'Operations' }]}
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Active staff"     value="6 / 8"  delta="2 on break"      tone="emerald" icon={Users} />
          <StatCard label="Desk utilization" value="86%"    delta="↑ 4% vs avg"     tone="cyan"    icon={Gauge} />
          <StatCard label="Avg service time" value="5m 18s" delta="Target ≤ 6m"     tone="violet"  icon={Timer} />
          <StatCard label="Top performer"    value="J. Lee" delta="38 tickets / 96%"tone="amber"   icon={Award} />
        </div>

        <section className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-white">Staff efficiency rankings</h3>
              <p className="text-xs text-slate-400">Today · sorted by efficiency score</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-300 ring-1 ring-cyan-400/20">
              <TrendingUp className="h-3 w-3" /> Updated 2m ago
            </span>
          </div>

          <ul className="mt-4 space-y-2">
            {STAFF.map((s, i) => (
              <li
                key={s.name}
                className="grid grid-cols-12 items-center gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.02] px-3 py-3 hover:border-white/10"
              >
                <div className="col-span-5 flex items-center gap-3 sm:col-span-4">
                  <span className="w-5 text-right text-xs font-bold text-slate-500">#{i + 1}</span>
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br ${TONES[s.tone]} text-xs font-bold text-white`}>
                    {s.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{s.name}</p>
                    <p className="truncate text-[11px] text-slate-400">{s.desk}</p>
                  </div>
                </div>

                <div className="col-span-3 sm:col-span-2">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500">Served</p>
                  <p className="text-sm font-semibold text-slate-200 tabular-nums">{s.served}</p>
                </div>

                <div className="col-span-4 sm:col-span-2">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500">Avg</p>
                  <p className="text-sm font-semibold text-slate-200 tabular-nums">{s.avg}</p>
                </div>

                <div className="col-span-12 sm:col-span-4">
                  <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400">
                    <span>Efficiency</span>
                    <span className="text-slate-200">{s.eff}%</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${TONES[s.tone]}`}
                      style={{ width: `${s.eff}%` }}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
            <h3 className="text-sm font-semibold text-white">Counter status</h3>
            <p className="text-xs text-slate-400">Live state per service desk</p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {['Counter 1','Counter 2','Counter 3','Counter 4','Specialist','Express'].map((c, i) => (
                <div key={c} className="rounded-2xl border border-white/[0.05] bg-white/[0.03] p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">{c}</p>
                  <p className="mt-1 text-sm font-semibold text-white">{i === 4 ? 'On break' : i === 5 ? 'Offline' : 'Active'}</p>
                  <p className="mt-0.5 text-[10px] text-slate-400">{i < 4 ? `${10 + i * 4} served` : '—'}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
            <h3 className="text-sm font-semibold text-white">Service performance breakdown</h3>
            <p className="text-xs text-slate-400">Today vs 7-day average</p>
            <ul className="mt-4 space-y-3">
              {[
                { label: 'Tickets served', today: 139, avg: 124 },
                { label: 'Average wait',   today: '12m', avg: '15m' },
                { label: 'No-shows',       today: 4,   avg: 6 },
                { label: 'SLA met',        today: '94%', avg: '88%' },
              ].map((row) => (
                <li key={row.label} className="flex items-center justify-between border-b border-white/[0.04] pb-2 last:border-0">
                  <span className="text-xs text-slate-400">{row.label}</span>
                  <span className="flex items-center gap-3 text-sm">
                    <span className="font-semibold text-white tabular-nums">{row.today}</span>
                    <span className="text-[11px] text-slate-500 tabular-nums">avg {row.avg}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </HybridDashboardShell>
  );
}
