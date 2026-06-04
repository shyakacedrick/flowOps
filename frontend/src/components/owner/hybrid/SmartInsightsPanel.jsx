import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useRotatingInsight } from '../../../hooks/useRotatingInsight.js';

/**
 * SmartInsightsPanel — AI-style recommendation card whose content rotates
 * every 20–40s through a realistic insight pool with a soft fade.
 */
export default function SmartInsightsPanel({ onApply = () => {}, onDismiss = () => {} }) {
  const { insight, index, total } = useRotatingInsight();

  return (
    <section className="relative overflow-hidden rounded-3xl border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-indigo-50 p-6 shadow-sm">
      <div className="pointer-events-none absolute -top-12 -right-12 h-44 w-44 rounded-full bg-sky-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-indigo-200/40 blur-3xl" />

      <div className="relative flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white text-sky-500 shadow-sm ring-1 ring-sky-100">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-sky-600">
              FlowOps smart insights
            </p>
            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-500 ring-1 ring-slate-200">
              AI · {index + 1}/{total}
            </span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={insight.title}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35 }}
            >
              <p className="mt-2 text-sm font-semibold text-slate-900">
                <span className="mr-1">{insight.icon}</span>{insight.title}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                {insight.description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`rec-${insight.title}`}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.3 }}
          className="relative mt-4 rounded-2xl bg-white p-3 ring-1 ring-slate-200/70"
        >
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Recommendation
          </p>
          <p className="mt-1 flex items-start gap-2 text-xs leading-relaxed text-slate-700">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
            {insight.recommendation}
          </p>
        </motion.div>
      </AnimatePresence>

      <div className="relative mt-4 flex items-center gap-2">
        <button
          onClick={onApply}
          className="inline-flex items-center gap-1.5 rounded-full bg-sky-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-transform hover:translate-x-0.5"
        >
          Apply suggestion <ArrowRight className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onDismiss}
          className="rounded-full px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-white"
        >
          Dismiss
        </button>
      </div>
    </section>
  );
}
