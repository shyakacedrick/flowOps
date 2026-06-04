import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, CheckCircle2, Loader2 } from 'lucide-react';

const STEPS = [
  { key: 'init',     label: 'Initializing operational core' },
  { key: 'kpis',     label: 'Loading KPI telemetry' },
  { key: 'charts',   label: 'Streaming chart data' },
  { key: 'feed',     label: 'Connecting live activity feed' },
  { key: 'insights', label: 'Calibrating Smart Insights engine' },
  { key: 'ready',    label: 'FlowOps operational systems online' },
];

/**
 * BootSequence — premium dashboard boot overlay.
 *
 * Plays a 6-step staged reveal (~2.4s total) the first time the dashboard
 * mounts. Steps fill in sequentially with a "loading → done" transition,
 * then the overlay fades out to reveal the live dashboard underneath.
 */
export default function BootSequence({ onDone }) {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (step >= STEPS.length) {
      const t = setTimeout(() => {
        setDone(true);
        onDone?.();
      }, 450);
      return () => clearTimeout(t);
    }
    const delay = step === STEPS.length - 1 ? 600 : 380;
    const t = setTimeout(() => setStep((s) => s + 1), delay);
    return () => clearTimeout(t);
  }, [step, onDone]);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0B1120]"
        >
          {/* ambient backdrop */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute top-1/3 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-blue-500/[0.12] blur-[140px]" />
            <div className="absolute bottom-1/4 right-1/4 h-[320px] w-[420px] rounded-full bg-cyan-500/[0.1] blur-[120px]" />
          </div>

          <motion.div
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="relative w-full max-w-md px-6"
          >
            {/* Brand */}
            <div className="flex items-center justify-center gap-2.5">
              <motion.span
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 text-slate-900 shadow-[0_0_30px_-4px_rgba(34,211,238,0.7)]"
              >
                <Zap className="h-6 w-6" strokeWidth={2.5} />
              </motion.span>
              <span className="text-2xl font-bold tracking-tight text-white">FlowOps</span>
            </div>

            <p className="mt-2 text-center text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              Operational systems boot
            </p>

            {/* Steps */}
            <ul className="mt-8 space-y-2.5">
              {STEPS.map((s, i) => {
                const state =
                  i < step ? 'done' : i === step ? 'loading' : 'pending';
                return (
                  <motion.li
                    key={s.key}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{
                      opacity: state === 'pending' ? 0.35 : 1,
                      x: 0,
                    }}
                    transition={{ duration: 0.3, delay: i * 0.04 }}
                    className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5 backdrop-blur"
                  >
                    <span className="grid h-6 w-6 place-items-center">
                      {state === 'done' && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      )}
                      {state === 'loading' && (
                        <Loader2 className="h-4 w-4 animate-spin text-cyan-300" />
                      )}
                      {state === 'pending' && (
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
                      )}
                    </span>
                    <span
                      className={`text-sm ${
                        state === 'done'
                          ? 'text-slate-300'
                          : state === 'loading'
                          ? 'font-semibold text-white'
                          : 'text-slate-500'
                      }`}
                    >
                      {s.label}
                    </span>
                  </motion.li>
                );
              })}
            </ul>

            {/* Progress strip */}
            <div className="mt-6 h-1 overflow-hidden rounded-full bg-white/[0.05]">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-400 to-blue-500"
                initial={{ width: 0 }}
                animate={{ width: `${(step / STEPS.length) * 100}%` }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
