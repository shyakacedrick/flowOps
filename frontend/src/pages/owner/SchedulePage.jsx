import { Calendar, Clock, Plus, CalendarDays } from 'lucide-react';
import HybridDashboardShell from '../../dashboards/HybridDashboardShell.jsx';
import PageHeader, { StatCard } from '../../components/shared/PageHeader.jsx';

/**
 * SchedulePage — "What is coming next?"
 *
 * Staff shifts, peak-hour planning, upcoming appointments.
 */
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SHIFTS = [
  { staff: 'Jordan Lee',   color: 'cyan',    plan: [1,1,1,1,1,0,0] },
  { staff: 'Priya Shah',   color: 'violet',  plan: [1,1,1,1,1,1,0] },
  { staff: 'Marcus Allen', color: 'emerald', plan: [0,1,1,1,1,1,1] },
  { staff: 'Aiko Tanaka',  color: 'amber',   plan: [1,1,0,1,1,1,1] },
  { staff: 'Dr. R. Owens', color: 'rose',    plan: [1,0,1,0,1,0,0] },
];

const COLORS = {
  cyan:    'bg-cyan-500/20 text-cyan-200 ring-cyan-400/30',
  violet:  'bg-violet-500/20 text-violet-200 ring-violet-400/30',
  emerald: 'bg-emerald-500/20 text-emerald-200 ring-emerald-400/30',
  amber:   'bg-amber-500/20 text-amber-200 ring-amber-400/30',
  rose:    'bg-rose-500/20 text-rose-200 ring-rose-400/30',
};

const UPCOMING = [
  { time: '09:30', label: 'Dr. Owens · Consultation block',  tag: 'Specialist' },
  { time: '11:00', label: 'Staff stand-up',                  tag: 'Internal'   },
  { time: '13:00', label: 'Peak-hour reinforcement starts',  tag: 'Operations' },
  { time: '15:30', label: 'New hire shadow shift',           tag: 'Training'   },
  { time: '17:00', label: 'End-of-day reconciliation',       tag: 'Operations' },
];

export default function SchedulePage() {
  return (
    <HybridDashboardShell>
      <div className="space-y-6 pt-2">
        <PageHeader
          eyebrow="Operational planning"
          title="Schedule"
          subtitle="Plan staff rotations, peak-hour coverage, and upcoming appointments."
          crumbs={[{ label: 'Planning' }, { label: 'Schedule' }]}
          actions={
            <button className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-3.5 py-2 text-xs font-semibold text-slate-900 shadow-[0_0_22px_-6px_rgba(34,211,238,0.7)]">
              <Plus className="h-3.5 w-3.5" /> New shift
            </button>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Scheduled shifts (wk)" value="32"    delta="6 staff"             tone="cyan"    icon={Calendar} />
          <StatCard label="Coverage"              value="94%"   delta="Across business hrs" tone="emerald" icon={CalendarDays} />
          <StatCard label="Peak hours covered"    value="11–14" delta="Reinforcement on"    tone="amber"   icon={Clock} />
          <StatCard label="Open requests"         value="2"     delta="Awaiting approval"   tone="rose" />
        </div>

        <section className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-white">Weekly staff schedule</h3>
              <p className="text-xs text-slate-400">Jun 1 — Jun 7</p>
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Week 23</span>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[640px] border-separate border-spacing-y-2 text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-slate-500">
                  <th className="w-40 text-left font-semibold">Staff</th>
                  {DAYS.map((d) => <th key={d} className="font-semibold">{d}</th>)}
                </tr>
              </thead>
              <tbody>
                {SHIFTS.map((row) => (
                  <tr key={row.staff}>
                    <td className="text-left text-sm font-semibold text-white">{row.staff}</td>
                    {row.plan.map((on, i) => (
                      <td key={i} className="px-1">
                        {on ? (
                          <span className={`mx-auto block h-7 rounded-lg ring-1 ${COLORS[row.color]}`} />
                        ) : (
                          <span className="mx-auto block h-7 rounded-lg border border-dashed border-white/10" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
            <h3 className="text-sm font-semibold text-white">Today · upcoming</h3>
            <p className="text-xs text-slate-400">All times local</p>
            <ul className="mt-4 space-y-3">
              {UPCOMING.map((u) => (
                <li key={u.time} className="flex items-center gap-4 rounded-2xl border border-white/[0.05] bg-white/[0.02] px-3 py-2.5">
                  <span className="grid h-10 w-12 shrink-0 place-items-center rounded-xl bg-white/[0.05] text-xs font-bold text-cyan-200">
                    {u.time}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{u.label}</p>
                    <p className="truncate text-[11px] text-slate-400">{u.tag}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
            <h3 className="text-sm font-semibold text-white">Resource allocation</h3>
            <p className="text-xs text-slate-400">Staff per service zone</p>
            <ul className="mt-4 space-y-3">
              {[
                { zone: 'Reception',  allocated: 2, ideal: 2 },
                { zone: 'Counters',   allocated: 4, ideal: 4 },
                { zone: 'Specialist', allocated: 1, ideal: 2 },
                { zone: 'Express',    allocated: 0, ideal: 1 },
              ].map((r) => {
                const pct = (r.allocated / r.ideal) * 100;
                const ok  = r.allocated >= r.ideal;
                return (
                  <li key={r.zone} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white">{r.zone}</span>
                      <span className={ok ? 'text-emerald-300' : 'text-amber-300'}>
                        {r.allocated}/{r.ideal}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className={`h-full rounded-full ${ok ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : 'bg-gradient-to-r from-amber-400 to-orange-500'}`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
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
