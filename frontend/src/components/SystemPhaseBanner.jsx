// ============================================================================
//  SystemPhaseBanner
// ----------------------------------------------------------------------------
//  The visible narrative of the FlowOps product-story flow. Renders a tiny,
//  Stripe-grade banner that evolves as the system progresses through phases:
//
//    initializing → activating → active → mature
//
//  Smoothly cross-fades between phase narratives so the dashboard feels like
//  it is *coming alive* rather than just rendering data.
// ============================================================================

import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, Activity, Zap, CheckCircle2 } from 'lucide-react';
import { useSystemPhase, PHASES } from '../hooks/useSystemPhase';
import { ease } from '../animations/motion';

const ICON_FOR = {
  [PHASES.INITIALIZING]: Sparkles,
  [PHASES.ACTIVATING]:   Zap,
  [PHASES.ACTIVE]:       Activity,
  [PHASES.MATURE]:       CheckCircle2,
};

const TONE_STYLES = {
  idle:    { ring: 'border-white/[0.08]',    chip: 'bg-white/[0.04] text-slate-300',    icon: 'text-slate-300', dot: 'bg-slate-400' },
  info:    { ring: 'border-primary/30',      chip: 'bg-primary/10 text-primary',        icon: 'text-primary',   dot: 'bg-primary'   },
  live:    { ring: 'border-emerald-400/30',  chip: 'bg-emerald-400/10 text-emerald-300',icon: 'text-emerald-300',dot:'bg-emerald-400'},
  success: { ring: 'border-secondary/30',    chip: 'bg-secondary/10 text-secondary',    icon: 'text-secondary', dot: 'bg-secondary' },
};

export default function SystemPhaseBanner({ className = '' }) {
  const { phase, meta } = useSystemPhase();
  const Icon = ICON_FOR[phase];
  const tone = TONE_STYLES[meta.tone] ?? TONE_STYLES.info;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border ${tone.ring} bg-white/[0.02] px-4 py-3 backdrop-blur-xl ${className}`}
    >
      {/* Soft glow halo that shifts with the phase tone */}
      <motion.div
        aria-hidden
        key={phase + '-glow'}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.18 }}
        transition={{ duration: 0.8, ease: ease.out }}
        className={`pointer-events-none absolute -inset-px rounded-2xl ${tone.chip} blur-2xl`}
      />

      <div className="relative flex items-center gap-3">
        <span className={`relative grid h-9 w-9 shrink-0 place-items-center rounded-xl border ${tone.ring} ${tone.chip}`}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={phase}
              initial={{ opacity: 0, scale: 0.7, rotate: -10 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.7, rotate: 10 }}
              transition={{ duration: 0.35, ease: ease.out }}
              className={tone.icon}
            >
              <Icon className="h-4 w-4" strokeWidth={2.2} />
            </motion.span>
          </AnimatePresence>
          <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
            <motion.span
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              className={`relative inline-flex h-2 w-2 rounded-full ${tone.dot}`}
            />
          </span>
        </span>

        <div className="min-w-0 flex-1">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={phase}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35, ease: ease.out }}
              className="min-w-0"
            >
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-white truncate">
                  {meta.label}
                </p>
                <span className={`hidden rounded-md border px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider sm:inline ${tone.ring} ${tone.chip}`}>
                  Phase · {phase}
                </span>
              </div>
              <p className="mt-0.5 truncate text-[11px] text-slate-400">
                {meta.narrative}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Phase progress pips — show how far through the narrative we are */}
        <div className="hidden items-center gap-1 sm:flex">
          {[PHASES.INITIALIZING, PHASES.ACTIVATING, PHASES.ACTIVE, PHASES.MATURE].map((p) => {
            const order = [PHASES.INITIALIZING, PHASES.ACTIVATING, PHASES.ACTIVE, PHASES.MATURE];
            const reached = order.indexOf(phase) >= order.indexOf(p);
            return (
              <motion.span
                key={p}
                animate={{ scale: reached ? 1 : 0.7, opacity: reached ? 1 : 0.4 }}
                transition={{ duration: 0.25, ease: ease.out }}
                className={`block h-1 w-5 rounded-full ${reached ? tone.dot : 'bg-white/10'}`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
