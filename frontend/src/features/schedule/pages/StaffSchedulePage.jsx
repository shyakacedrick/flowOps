import { Calendar, Coffee, Clock, MapPin, ChevronRight, CalendarDays } from 'lucide-react';
import StaffShell from '@/features/staff/components/StaffShell.jsx';
import PageHeader, { StatCard } from '@/shared/components/PageHeader.jsx';

/**
 * SchedulePage — operator's working week at a glance.
 */
const TODAY_BLOCKS = [
  { label: 'Shift start',  time: '09:00', state: 'done' },
  { label: 'Break 1',      time: '10:30', state: 'done' },
  { label: 'Lunch',        time: '13:00', state: 'next' },
  { label: 'Break 2',      time: '15:30', state: 'soon' },
  { label: 'Shift end',    time: '17:00', state: 'soon' },
];

const UPCOMING = [
  { day: 'Tomorrow', date: 'Tue 14',  shift: '09:00 – 17:00', desk: 'Desk 2', hours: '8h' },
  { day: 'Wednesday', date: 'Wed 15', shift: '12:00 – 20:00', desk: 'Desk 1', hours: '8h' },
  { day: 'Thursday',  date: 'Thu 16', shift: '09:00 – 16:30', desk: 'Desk 2', hours: '7.5h' },
  { day: 'Friday',    date: 'Fri 17', shift: 'OFF',           desk: '—',      hours: '—' },
  { day: 'Saturday',  date: 'Sat 18', shift: '10:00 – 18:00', desk: 'Desk 3', hours: '8h' },
];

export default function SchedulePage() {
  const totalHoursWeek = 31.5;
  return (
    <StaffShell>
      <div className="space-y-6 pt-2">
        <PageHeader
          eyebrow="This week"
          title="Schedule"
          subtitle="Your shifts, breaks, and desk assignments."
          crumbs={[{ label: 'Staff', to: '/staff/dashboard' }, { label: 'Schedule' }]}
          actions={(
            <button className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/[0.08]">
              <CalendarDays className="h-3.5 w-3.5" /> Request time off
            </button>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Today"        value="09–17" delta="Desk 2 · 8h"     tone="cyan"    icon={Clock} />
          <StatCard label="Week total"   value={`${totalHoursWeek}h`} delta="Across 4 shifts" tone="violet" icon={Calendar} />
          <StatCard label="Next break"   value="13:00" delta="Lunch · 1h"      tone="amber"   icon={Coffee} />
          <StatCard label="Primary desk" value="Desk 2" delta="Your station"   tone="emerald" icon={MapPin} />
        </div>

        <div className="grid gap-5 xl:grid-cols-12">
          {/* Today's shift */}
          <section className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5 xl:col-span-5">
            <h3 className="text-sm font-semibold text-white">Today's shift</h3>
            <p className="text-xs text-slate-400">Monday · Desk 2 · 8 hours</p>

            <ol className="relative mt-5 space-y-3 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-px before:bg-white/[0.06]">
              {TODAY_BLOCKS.map((b) => {
                const colors =
                  b.state === 'done' ? 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/30'
                  : b.state === 'next' ? 'bg-cyan-500/15 text-cyan-200 ring-cyan-400/30'
                  : 'bg-white/[0.04] text-slate-400 ring-white/[0.06]';
                return (
                  <li key={b.label} className="relative flex items-center gap-3">
                    <span className={`relative z-10 grid h-8 w-8 place-items-center rounded-full ring-1 ${colors}`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    </span>
                    <div className="flex flex-1 items-baseline justify-between rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2">
                      <span className="text-sm font-semibold text-white">{b.label}</span>
                      <span className="font-mono text-xs text-slate-400">{b.time}</span>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>

          {/* Upcoming shifts */}
          <section className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5 xl:col-span-7">
            <h3 className="text-sm font-semibold text-white">Upcoming shifts</h3>
            <p className="text-xs text-slate-400">Next 5 days</p>

            <ul className="mt-4 space-y-2">
              {UPCOMING.map((s) => {
                const isOff = s.shift === 'OFF';
                return (
                  <li
                    key={s.date}
                    className={`flex items-center gap-4 rounded-2xl border p-3.5 ${
                      isOff
                        ? 'border-white/[0.04] bg-white/[0.01] opacity-70'
                        : 'border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="text-center">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">{s.day}</p>
                      <p className="font-mono text-sm font-bold text-white">{s.date}</p>
                    </div>
                    <div className="h-10 w-px bg-white/[0.06]" />
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-semibold ${isOff ? 'text-slate-500' : 'text-white'}`}>{s.shift}</p>
                      <p className="text-[11px] text-slate-400">{s.desk}</p>
                    </div>
                    {!isOff && <span className="font-mono text-[11px] text-slate-400">{s.hours}</span>}
                    {!isOff && <ChevronRight className="h-3.5 w-3.5 text-slate-500" />}
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </div>
    </StaffShell>
  );
}
