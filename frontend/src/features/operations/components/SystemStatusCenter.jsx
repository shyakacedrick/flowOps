import { motion } from 'framer-motion';
import { Cpu, BarChart3, Sparkles, BellRing } from 'lucide-react';
import { useSystemStatusEngine } from '@/features/operations/hooks/useSystemStatusEngine.js';

/**
 * SystemStatusCenter — live operational health for FlowOps subsystems.
 *
 * Each row breathes (live ping), reports a status, and shows realistic
 * latency that drifts as the simulated systems flap between states.
 */
const ICONS = {
  queue:         Cpu,
  analytics:     BarChart3,
  insights:      Sparkles,
  notifications: BellRing,
};

const STATUS_META = {
  online: {
    label: 'Online',
    text:  'text-emerald-300',
    bg:    'bg-emerald-400/10',
    ring:  'ring-emerald-400/25',
    dot:   'bg-emerald-400',
  },
  degraded: {
    label: 'Degraded',
    text:  'text-amber-300',
    bg:    'bg-amber-400/10',
    ring:  'ring-amber-400/25',
    dot:   'bg-amber-400',
  },
  offline: {
    label: 'Offline',
    text:  'text-rose-300',
    bg:    'bg-rose-400/10',
    ring:  'ring-rose-400/25',
    dot:   'bg-rose-400',
  },
};

export default function SystemStatusCenter() {
  const systems = useSystemStatusEngine();
  const overall = aggregate(systems);
  const om = STATUS_META[overall];

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5 shadow-2xl backdrop-blur-xl">
      <div className="pointer-events-none absolute -top-12 -right-12 h-36 w-36 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            System status
          </p>
          <h3 className="mt-1 text-sm font-semibold text-white">All systems operational</h3>
        </div>
        <div className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${om.bg} ${om.text} ${om.ring}`}>
          <BreathingDot color={om.dot} />
          {om.label}
        </div>
      </div>

      <ul className="relative mt-4 space-y-2">
        {systems.map((s) => {
          const Icon = ICONS[s.key];
          const m = STATUS_META[s.status];
          return (
            <motion.li
              key={s.key}
              layout
              transition={{ duration: 0.3 }}
              className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2.5"
            >
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-white/[0.04] text-slate-300">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{s.label}</p>
                <p className="text-[10px] text-slate-500">
                  {s.status === 'offline' ? 'No response' : `${s.latency}ms · p50 latency`}
                </p>
              </div>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${m.bg} ${m.text} ${m.ring}`}>
                <BreathingDot color={m.dot} />
                {m.label}
              </span>
            </motion.li>
          );
        })}
      </ul>
    </section>
  );
}

function BreathingDot({ color }) {
  return (
    <span className="relative flex h-1.5 w-1.5">
      <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${color} opacity-75`} />
      <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${color}`} />
    </span>
  );
}

function aggregate(systems) {
  if (systems.some((s) => s.status === 'offline'))  return 'offline';
  if (systems.some((s) => s.status === 'degraded')) return 'degraded';
  return 'online';
}
