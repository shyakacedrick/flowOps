import { Sparkles } from 'lucide-react';
import { useRotatingInsight } from '@/features/smart-insights/hooks/useRotatingInsight.js';

/**
 * SmartInsightsPanel — AI-style recommendation card.
 *
 * Until a real insights service is wired up, this renders a "no insights
 * yet" empty state instead of synthetic recommendations. Once the backend
 * starts producing real insights, `useRotatingInsight` will return them
 * and the panel will surface them in place of the empty state.
 */
export default function SmartInsightsPanel() {
  const { insight } = useRotatingInsight();

  if (!insight) {
    return (
      <section className="relative overflow-hidden rounded-3xl border border-cyan-400/15 bg-gradient-to-br from-cyan-500/[0.06] via-white/[0.02] to-indigo-500/[0.06] p-6 shadow-sm ring-1 ring-white/[0.04]">
        <div className="pointer-events-none absolute -top-12 -right-12 h-44 w-44 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/[0.06] text-cyan-300 ring-1 ring-cyan-400/20">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-widest text-cyan-300">
              FlowOps smart insights
            </p>
            <p className="mt-2 text-sm font-semibold text-white">
              Insights will appear here once your queues have run long enough.
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              The recommendation engine needs real customer flow before it can
              produce actionable suggestions. Keep your queues live for a full
              shift and check back tomorrow.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return null;
}
