import { useState } from 'react';
import { Sparkles, Loader2, Flame, Clock, UserPlus, Check } from 'lucide-react';

const ANALYZE_STEPS = [
  'Analyzing operations...',
  'Detecting traffic patterns...',
  'Computing recommendations...',
];

const INSIGHTS = [
  {
    icon: Flame,
    label: 'Peak hours detected',
    value: '2 PM – 5 PM',
    tone: 'rose',
  },
  {
    icon: Clock,
    label: 'Average wait time',
    value: '12 minutes',
    tone: 'cyan',
  },
  {
    icon: UserPlus,
    label: 'Recommendation',
    value: 'Add 2 staff during peak window',
    tone: 'blue',
  },
];

function toneClasses(tone) {
  return {
    rose: 'from-rose-500/15 to-rose-500/0 text-rose-300 border-rose-400/20',
    cyan: 'from-secondary/15 to-secondary/0 text-secondary border-secondary/30',
    blue: 'from-primary/15 to-primary/0 text-primary border-primary/30',
  }[tone];
}

export default function SmartInsightsDemo() {
  const [state, setState] = useState('idle'); // idle | loading | done
  const [stepIndex, setStepIndex] = useState(0);

  const run = () => {
    if (state === 'loading') return;
    setState('loading');
    setStepIndex(0);

    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      if (i < ANALYZE_STEPS.length) {
        setStepIndex(i);
      } else {
        clearInterval(interval);
        setTimeout(() => setState('done'), 350);
      }
    }, 700);
  };

  const reset = () => {
    setState('idle');
    setStepIndex(0);
  };

  return (
    <section id="insights" className="section">
      <div className="mx-auto grid gap-12 lg:grid-cols-12 lg:items-center">
        {/* Copy */}
        <div className="lg:col-span-5">
          <span className="eyebrow">
            <Sparkles className="h-3 w-3 text-secondary" />
            Smart Insights
          </span>
          <h2 className="h-section mt-5">
            One click. The whole story.
          </h2>
          <p className="mt-5 text-lg text-muted">
            FlowOps reads every interaction across your floor and surfaces the
            decisions that actually move the business. Try it live.
          </p>
          <ul className="mt-6 space-y-2.5 text-sm text-slate-300">
            {[
              'Identifies demand spikes before they happen',
              'Benchmarks wait times against your own history',
              'Recommends staffing changes you can act on today',
            ].map((t) => (
              <li key={t} className="flex items-start gap-2.5">
                <span className="mt-0.5 grid h-5 w-5 place-items-center rounded-md bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/20">
                  <Check className="h-3 w-3" />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* Interactive card */}
        <div className="lg:col-span-7">
          <div className="relative">
            <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-tr from-primary/15 via-secondary/10 to-transparent blur-3xl" />

            <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-b from-slate-900/80 to-slate-950/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-gradient-to-br from-primary/20 to-secondary/15 text-primary shadow-glow">
                    <Sparkles className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      FlowOps Insights Engine
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Last 24 hours · Main Branch
                    </p>
                  </div>
                </div>

                {state === 'done' ? (
                  <button
                    onClick={reset}
                    className="rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
                  >
                    Run again
                  </button>
                ) : (
                  <button
                    onClick={run}
                    disabled={state === 'loading'}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-white shadow-glow transition-all hover:bg-blue-500 hover:shadow-glow-lg disabled:cursor-wait disabled:opacity-90"
                  >
                    {state === 'loading' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    {state === 'loading' ? 'Analyzing...' : 'Generate Insights'}
                  </button>
                )}
              </div>

              {/* Body */}
              <div className="mt-7 min-h-[260px]">
                {state === 'idle' && (
                  <div className="grid h-[260px] place-items-center rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.015] text-center">
                    <div>
                      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-white/[0.03] text-slate-400">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <p className="mt-4 text-sm font-medium text-slate-300">
                        Ready to analyze today's operations
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Click "Generate Insights" to run the engine
                      </p>
                    </div>
                  </div>
                )}

                {state === 'loading' && (
                  <div className="grid h-[260px] place-items-center rounded-2xl border border-white/[0.08] bg-white/[0.02]">
                    <div className="w-full max-w-sm px-6">
                      {ANALYZE_STEPS.map((s, i) => {
                        const isDone = i < stepIndex;
                        const isActive = i === stepIndex;
                        return (
                          <div
                            key={s}
                            className={`flex items-center gap-3 py-2 text-sm transition-all duration-300 ${
                              isActive
                                ? 'text-white'
                                : isDone
                                ? 'text-slate-400'
                                : 'text-slate-600'
                            }`}
                          >
                            <span
                              className={`grid h-5 w-5 place-items-center rounded-full text-[10px] ${
                                isDone
                                  ? 'bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-400/30'
                                  : isActive
                                  ? 'bg-primary/15 text-primary ring-1 ring-primary/40'
                                  : 'bg-white/[0.03] text-slate-600 ring-1 ring-white/[0.06]'
                              }`}
                            >
                              {isDone ? (
                                <Check className="h-3 w-3" />
                              ) : isActive ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                i + 1
                              )}
                            </span>
                            <span className="font-medium">{s}</span>
                          </div>
                        );
                      })}
                      {/* progress bar */}
                      <div className="mt-5 h-1 overflow-hidden rounded-full bg-white/[0.05]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
                          style={{
                            width: `${((stepIndex + 1) / ANALYZE_STEPS.length) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {state === 'done' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs text-emerald-300">
                      <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-400/15 ring-1 ring-emerald-400/30">
                        <Check className="h-3 w-3" />
                      </span>
                      <span className="font-semibold">
                        Analysis complete · 3 insights generated
                      </span>
                    </div>
                    {INSIGHTS.map((ins, i) => {
                      const Icon = ins.icon;
                      const t = toneClasses(ins.tone);
                      return (
                        <div
                          key={ins.label}
                          className={`relative overflow-hidden rounded-2xl border bg-white/[0.02] p-4 transition-all ${t}`}
                          style={{
                            animation: 'slideUp 0.5s ease-out both',
                            animationDelay: `${i * 120}ms`,
                          }}
                        >
                          <div
                            className={`pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-gradient-to-b ${t} opacity-70 blur-3xl`}
                          />
                          <div className="relative flex items-start gap-3">
                            <span
                              className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border bg-white/[0.03] ${t}`}
                            >
                              <Icon className="h-4 w-4" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                                {ins.label}
                              </p>
                              <p className="mt-0.5 text-base font-semibold text-white">
                                {ins.value}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
