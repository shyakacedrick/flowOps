import { motion } from 'framer-motion';
import { Plus, Users, UserCheck, TrendingUp, PhoneCall, ArrowRight } from 'lucide-react';
import { useCountUp } from '@/shared/hooks/useCountUp.js';

/**
 * OperationalQuickGrid — 4 premium operational cards.
 * Live Queue · Staff Active · Service Efficiency · Call Next Customer (primary).
 * Each carries a floating glowing "+" admin action in the bottom-right.
 */
export default function OperationalQuickGrid({
  waiting = 18,
  serving = 4,
  staffActive = 6,
  staffOnBreak = 1,
  efficiencyDelta = 12,
  onAction = () => {},
  onCallNext = () => {},
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
      <MetricTile
        title="Live queue"
        icon={Users}
        accent="blue"
        primary={waiting}
        primaryLabel="Waiting"
        secondary={serving}
        secondaryLabel="Serving"
        onAdd={() => onAction('queue')}
      />
      <MetricTile
        title="Staff active"
        icon={UserCheck}
        accent="emerald"
        primary={staffActive}
        primaryLabel="On the floor"
        secondary={staffOnBreak}
        secondaryLabel="On break"
        onAdd={() => onAction('staff')}
      />
      <MetricTile
        title="Service efficiency"
        icon={TrendingUp}
        accent="violet"
        primary={`+${efficiencyDelta}%`}
        primaryLabel="vs yesterday"
        secondary={null}
        secondaryLabel="Trending up"
        positive
        onAdd={() => onAction('efficiency')}
      />
      <CallNextTile onCall={onCallNext} />
    </div>
  );
}

const ACCENTS = {
  blue:    { ring: 'ring-blue-400/20',    icon: 'bg-blue-500/10 text-blue-300',       glow: 'shadow-[0_24px_50px_-30px_rgba(59,130,246,0.6)]'    },
  emerald: { ring: 'ring-emerald-400/20', icon: 'bg-emerald-500/10 text-emerald-300', glow: 'shadow-[0_24px_50px_-30px_rgba(16,185,129,0.6)]' },
  violet:  { ring: 'ring-violet-400/20',  icon: 'bg-violet-500/10 text-violet-300',   glow: 'shadow-[0_24px_50px_-30px_rgba(167,139,250,0.6)]'   },
};

function MetricTile({ title, icon: Icon, accent = 'blue', primary, primaryLabel, secondary, secondaryLabel, positive = false, onAdd }) {
  const a = ACCENTS[accent];
  const isNumeric = typeof primary === 'number';
  const animated = useCountUp(isNumeric ? primary : 0, { duration: 1000, active: isNumeric });

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.18 }}
      className={`group relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5 pb-16 backdrop-blur-xl ring-1 ${a.ring} ${a.glow} transition-shadow`}
    >
      <div className="pointer-events-none absolute -top-12 -right-12 h-36 w-36 rounded-full bg-white/[0.05] blur-3xl" />

      <div className="relative flex items-center justify-between gap-3">
        <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${a.icon}`}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="truncate text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          {title}
        </span>
      </div>

      <div className="relative mt-5 flex items-baseline gap-2">
        <p className={`text-3xl font-bold tracking-tight ${positive ? 'text-emerald-300' : 'text-white'}`}>
          {isNumeric ? animated : primary}
        </p>
        <p className="truncate text-xs text-slate-400">{primaryLabel}</p>
      </div>
      {secondaryLabel && (
        <p className="relative mt-1 truncate text-xs text-slate-500">
          {secondary !== null && (
            <span className="font-semibold text-slate-300">{secondary} </span>
          )}
          {secondary !== null ? '· ' : ''}{secondaryLabel}
        </p>
      )}

      <FloatingAddButton onClick={onAdd} />
    </motion.div>
  );
}

function CallNextTile({ onCall }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.18 }}
      className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-cyan-400/30 bg-gradient-to-br from-blue-600/30 via-[#0F1729]/80 to-cyan-500/20 p-5 shadow-[0_24px_50px_-20px_rgba(6,182,212,0.55)]"
    >
      <div className="pointer-events-none absolute -top-14 -right-12 h-40 w-40 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 ring-1 ring-cyan-300/40 transition-opacity group-hover:opacity-100" />

      <div className="relative flex items-center justify-between gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-cyan-400/15 text-cyan-200 ring-1 ring-cyan-300/30">
          <PhoneCall className="h-4 w-4" />
        </div>
        <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-cyan-200/90">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300" /> Primary
        </span>
      </div>

      <p className="relative mt-5 text-base font-bold leading-snug text-white">
        Call next customer
      </p>
      <p className="relative mt-1 text-xs text-cyan-100/70">Notify counters 1–4</p>

      <button
        onClick={onCall}
        className="relative mt-auto inline-flex w-fit items-center gap-1.5 rounded-full bg-cyan-400 px-3.5 py-1.5 text-xs font-semibold text-slate-900 shadow-[0_0_16px_-2px_rgba(34,211,238,0.85)] transition-transform hover:scale-[1.02]"
      >
        Dispatch <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  );
}

function FloatingAddButton({ onClick, tone = 'blue' }) {
  const tones = {
    blue: 'bg-blue-500 text-white shadow-[0_0_22px_-2px_rgba(59,130,246,0.75)] ring-blue-300/40',
    cyan: 'bg-cyan-400 text-slate-900 shadow-[0_0_22px_-2px_rgba(34,211,238,0.85)] ring-cyan-300/50',
  }[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Quick add"
      className={`group/btn absolute bottom-4 right-4 grid h-10 w-10 place-items-center rounded-full ring-1 ring-transparent transition-transform hover:scale-105 ${tones}`}
    >
      <Plus className="h-5 w-5" strokeWidth={2.5} />
      <span className={`pointer-events-none absolute inset-0 rounded-full opacity-0 ring-2 ${tone === 'cyan' ? 'ring-cyan-300/60' : 'ring-blue-300/60'} transition-opacity group-hover/btn:opacity-100`} />
    </button>
  );
}
