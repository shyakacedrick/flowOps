import { Users, Clock, CheckCircle2, Activity, PhoneCall, SkipForward, AlertCircle, Coffee } from 'lucide-react';
import { Link } from 'react-router-dom';
import StaffShell from '@/features/staff/components/StaffShell.jsx';
import PageHeader, { StatCard } from '@/shared/components/PageHeader.jsx';
import QueueManagerCard from '@/features/queue/components/QueueManagerCard.jsx';
import { useSimulationSlice, useSimulationDispatch } from '@/engine/SimulationProvider.jsx';
import { EVENT_TYPES, selectAverageWait } from '@/engine/flowOpsEngine.js';
import { useEventLog } from '@/features/customer-feed/hooks/useEventLog.js';

/**
 * StaffDashboardPage — "What should I focus on right now?"
 */
export default function StaffDashboardPage() {
  const queue      = useSimulationSlice((s) => s.queue);
  const recent     = useSimulationSlice((s) => s.recent);
  const business   = useSimulationSlice((s) => s.business);
  const analytics  = useSimulationSlice((s) => s.analytics);
  const dispatch   = useSimulationDispatch();
  const events     = useEventLog().slice(0, 6);

  const waiting = queue.length;
  const served  = business.totalServed || recent.length;
  const avgWait = Math.max(1, Math.round(selectAverageWait({ queue, analytics, business }))) || 8;
  const avgSvc  = Math.max(1, Math.round(business.averageServiceTime));

  // Shift progress — simulated 8h shift, ~30% through.
  const shiftMins = 480;
  const elapsed   = Math.min(shiftMins, 145);
  const pct       = Math.round((elapsed / shiftMins) * 100);

  return (
    <StaffShell>
      <div className="space-y-6 pt-2">
        <PageHeader
          eyebrow="Today · operator overview"
          title="Good shift, Jordan"
          subtitle="Your queue is moving. Here's everything you need at a glance."
          crumbs={[{ label: 'Staff' }, { label: 'Dashboard' }]}
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Waiting"           value={waiting || 6} delta="In your queue"        tone="cyan"    icon={Users} />
          <StatCard label="Served today"      value={served || 24} delta="↑ 3 vs avg shift"     tone="emerald" icon={CheckCircle2} />
          <StatCard label="Avg wait"          value={`${avgWait}m`} delta="Target ≤ 12m"        tone="amber"   icon={Clock} />
          <StatCard label="Avg service"       value={`${avgSvc}m`}  delta="Your pace"           tone="violet"  icon={Activity} />
          <StatCard label="Desk"              value="Active"        delta="Desk 2 · since 09:00" tone="rose" />
        </div>

        <div className="grid gap-5 xl:grid-cols-12">
          {/* Quick actions */}
          <section className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5 xl:col-span-7">
            <div className="flex items-baseline justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Quick actions</h3>
                <p className="text-xs text-slate-400">One-tap operations</p>
              </div>
              <Link to="/staff/my-queue" className="text-xs font-semibold text-cyan-300 hover:text-cyan-200">
                Open queue →
              </Link>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <QuickAction
                icon={PhoneCall} title="Call next"
                desc="Notify next ticket holder"
                tone="cyan"
                onClick={() => dispatch({ type: EVENT_TYPES.SERVE_CUSTOMER })}
              />
              <QuickAction
                icon={CheckCircle2} title="Mark served"
                desc="Complete current service"
                tone="emerald"
                onClick={() => dispatch({ type: EVENT_TYPES.SERVE_CUSTOMER })}
              />
              <QuickAction
                icon={SkipForward} title="Skip customer"
                desc="Move to back of queue"
                tone="amber"
                onClick={() => dispatch({ type: EVENT_TYPES.SKIP_CUSTOMER })}
              />
              <QuickAction
                icon={AlertCircle} title="Request help"
                desc="Page floor manager"
                tone="rose"
                onClick={() => alert('Request sent to floor manager.')}
              />
            </div>
          </section>

          {/* Shift progress */}
          <section className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5 xl:col-span-5">
            <h3 className="text-sm font-semibold text-white">Shift progress</h3>
            <p className="text-xs text-slate-400">09:00 — 17:00 · Desk 2</p>

            <div className="mt-5">
              <div className="flex items-baseline justify-between text-xs">
                <span className="font-semibold text-white">{Math.floor(elapsed / 60)}h {elapsed % 60}m elapsed</span>
                <span className="text-slate-400">{pct}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            <ul className="mt-5 grid grid-cols-3 gap-2 text-center text-[11px]">
              {[
                { label: 'Break 1', time: '10:30', state: 'done' },
                { label: 'Lunch',   time: '13:00', state: 'next' },
                { label: 'Break 2', time: '15:30', state: 'soon' },
              ].map((b) => (
                <li key={b.label} className={`rounded-xl border px-2 py-2 ${
                  b.state === 'done' ? 'border-emerald-400/20 bg-emerald-500/5 text-emerald-300'
                  : b.state === 'next' ? 'border-cyan-400/30 bg-cyan-500/10 text-cyan-200'
                  : 'border-white/[0.06] bg-white/[0.02] text-slate-300'
                }`}>
                  <p className="font-semibold">{b.label}</p>
                  <p className="mt-0.5 font-mono text-[10px] opacity-80">{b.time}</p>
                </li>
              ))}
            </ul>

            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.02] p-3">
              <Coffee className="h-4 w-4 text-amber-300" />
              <p className="text-xs text-slate-300">Lunch in <span className="font-semibold text-white">1h 30m</span></p>
            </div>
          </section>

          {/* Recent events */}
          <section className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5 xl:col-span-12">
            <div className="flex items-baseline justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Recent events</h3>
                <p className="text-xs text-slate-400">Latest activity from your queue</p>
              </div>
              <Link to="/staff/activity-feed" className="text-xs font-semibold text-cyan-300 hover:text-cyan-200">
                Full feed →
              </Link>
            </div>
            <ul className="mt-4 grid gap-2 md:grid-cols-2">
              {(events.length ? events : SEED_EVENTS).slice(0, 6).map((e, i) => (
                <li key={e.id ?? i} className="flex items-center gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.02] px-3 py-2.5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/[0.06] text-xs font-bold text-cyan-200">
                    {(e.name || 'A').split(' ').map((p) => p[0]).slice(0,2).join('')}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{e.label}</p>
                    <p className="truncate text-[11px] text-slate-400">{e.sub}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Live queues — read-only for staff (writes require owner/admin) */}
          <div className="xl:col-span-12">
            <QueueManagerCard
              readOnly
              title="Your organization's queues"
              subtitle="Read-only · only owners and platform admins can edit"
            />
          </div>
        </div>
      </div>
    </StaffShell>
  );
}

const ACT_TONES = {
  cyan:    'from-cyan-500/20 to-blue-500/10 ring-cyan-400/30 hover:ring-cyan-400/60 text-cyan-200',
  emerald: 'from-emerald-500/20 to-teal-500/10 ring-emerald-400/30 hover:ring-emerald-400/60 text-emerald-200',
  amber:   'from-amber-500/20 to-orange-500/10 ring-amber-400/30 hover:ring-amber-400/60 text-amber-200',
  rose:    'from-rose-500/20 to-pink-500/10 ring-rose-400/30 hover:ring-rose-400/60 text-rose-200',
};

function QuickAction({ icon: Icon, title, desc, tone, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`group flex items-start gap-3 rounded-2xl border border-white/[0.05] bg-gradient-to-br ${ACT_TONES[tone]} bg-white/[0.02] p-4 text-left ring-1 transition-all hover:-translate-y-0.5 active:translate-y-0`}
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/[0.06] ring-1 ring-white/10">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="mt-0.5 text-[11px] text-slate-300">{desc}</p>
      </div>
    </button>
  );
}

const SEED_EVENTS = [
  { label: 'Maya checked in via QR',     sub: 'Ticket A-104 · 1m ago', name: 'Maya' },
  { label: 'Leo called to Desk 2',       sub: 'Ticket A-103 · 4m ago', name: 'Leo' },
  { label: 'Sana marked served',         sub: 'Ticket A-102 · 7m ago', name: 'Sana' },
  { label: 'Noah joined queue',          sub: 'Ticket A-105 · 9m ago', name: 'Noah' },
  { label: 'Aria transferred to Desk 3', sub: 'Ticket A-101 · 12m ago', name: 'Aria' },
  { label: 'Priority customer detected', sub: 'Ticket V-002 · 14m ago', name: 'VIP' },
];
