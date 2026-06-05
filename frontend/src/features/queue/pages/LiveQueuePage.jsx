import { Radio, Users, Clock, Activity, PhoneCall, Pause, Play } from 'lucide-react';
import HybridDashboardShell from '@/features/dashboard/components/HybridDashboardShell.jsx';
import PageHeader, { StatCard } from '@/shared/components/PageHeader.jsx';
import QueueHealthPanel from '@/features/queue/components/QueueHealthPanel.jsx';
import NextInLineTimeline from '@/features/queue/components/NextInLineTimeline.jsx';
import { useSimulationSlice, useSimulationDispatch } from '@/engine/SimulationProvider.jsx';
import { EVENT_TYPES, selectAverageWait } from '@/engine/flowOpsEngine.js';

/**
 * LiveQueuePage — "What is happening right now?"
 *
 * Realtime monitoring of every active queue, counter, and waiting ticket.
 */
export default function LiveQueuePage() {
  const queue     = useSimulationSlice((s) => s.queue);
  const history   = useSimulationSlice((s) => s.history);
  const analytics = useSimulationSlice((s) => s.analytics);
  const business  = useSimulationSlice((s) => s.business);
  const dispatch  = useSimulationDispatch();

  const waiting = queue.length || 18;
  const serving = Math.max(0, queue.filter((c) => c.status === 'serving').length) || 4;
  const avgWait = Math.max(1, Math.round(selectAverageWait({ queue, analytics, business }))) || 12;

  const counters = [
    { id: 1, label: 'Counter 1', staff: 'Jordan Lee',   ticket: 'A-104', state: 'serving' },
    { id: 2, label: 'Counter 2', staff: 'Priya Shah',   ticket: 'A-103', state: 'serving' },
    { id: 3, label: 'Counter 3', staff: 'Marcus Allen', ticket: 'B-211', state: 'serving' },
    { id: 4, label: 'Counter 4', staff: 'Aiko Tanaka',  ticket: 'A-102', state: 'idle'    },
    { id: 5, label: 'Specialist',staff: 'Dr. R. Owens', ticket: '—',     state: 'break'   },
  ];

  return (
    <HybridDashboardShell>
      <div className="space-y-6 pt-2">
        <PageHeader
          eyebrow="Real-time monitoring"
          title="Live Queue"
          subtitle="Every active ticket, counter, and wait time at this moment."
          crumbs={[{ label: 'Operations' }, { label: 'Live Queue' }]}
          actions={
            <>
              <button
                onClick={() => dispatch({ type: EVENT_TYPES.NEW_CUSTOMER })}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-white/[0.08]"
              >
                + Add ticket
              </button>
              <button
                onClick={() => dispatch({ type: EVENT_TYPES.SERVE_CUSTOMER })}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-3.5 py-2 text-xs font-semibold text-slate-900 shadow-[0_0_22px_-6px_rgba(34,211,238,0.7)]"
              >
                <PhoneCall className="h-3.5 w-3.5" /> Call next
              </button>
            </>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Waiting"          value={waiting}      delta="Across all queues" tone="cyan"    icon={Users} />
          <StatCard label="Serving now"      value={serving}      delta={`${counters.filter(c=>c.state==='serving').length} counters live`} tone="violet" icon={Radio} />
          <StatCard label="Avg wait"         value={`${avgWait}m`} delta="Last 30 minutes"   tone="amber"   icon={Clock} />
          <StatCard label="Queue health"     value="Stable"       delta="Within threshold"  tone="emerald" icon={Activity} />
        </div>

        <div className="grid gap-5 xl:grid-cols-12">
          <section className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5 xl:col-span-8">
            <div className="flex items-baseline justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Now serving</h3>
                <p className="text-xs text-slate-400">Realtime counter assignments</p>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 ring-1 ring-emerald-400/20">Live</span>
            </div>
            <ul className="mt-4 divide-y divide-white/[0.05]">
              {counters.map((c) => (
                <li key={c.id} className="flex items-center gap-4 py-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/[0.05] text-xs font-bold text-slate-200">
                    #{c.id}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{c.label} · {c.staff}</p>
                    <p className="truncate text-xs text-slate-400">Ticket {c.ticket}</p>
                  </div>
                  <StateChip state={c.state} />
                </li>
              ))}
            </ul>
          </section>

          <div className="space-y-5 xl:col-span-4">
            <QueueHealthPanel
              normal={Math.max(0, waiting - 4)}
              delayed={Math.min(waiting, 3)}
              critical={waiting > 20 ? 2 : 1}
              history={history}
              queueLength={queue.length}
            />
            <NextInLineTimeline />
          </div>
        </div>
      </div>
    </HybridDashboardShell>
  );
}

function StateChip({ state }) {
  const map = {
    serving: { label: 'Serving', cls: 'bg-cyan-500/10 text-cyan-300 ring-cyan-400/20', Icon: Play },
    idle:    { label: 'Idle',    cls: 'bg-white/[0.05] text-slate-300 ring-white/10',  Icon: Pause },
    break:   { label: 'Break',   cls: 'bg-amber-500/10 text-amber-300 ring-amber-400/20', Icon: Pause },
  }[state];
  const { Icon } = map;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${map.cls}`}>
      <Icon className="h-3 w-3" /> {map.label}
    </span>
  );
}
