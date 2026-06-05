import { Sparkles, TrendingUp, Users, Clock, Lightbulb, ArrowRight, CheckCircle2 } from 'lucide-react';
import HybridDashboardShell from '@/features/dashboard/components/HybridDashboardShell.jsx';
import PageHeader, { StatCard } from '@/shared/components/PageHeader.jsx';
import SmartInsightsPanel from '@/features/smart-insights/components/SmartInsightsPanel.jsx';

/**
 * SmartInsightsPage — "What should I improve next?"
 *
 * AI-style operational recommendations and predictive analysis.
 */
const RECOMMENDATIONS = [
  {
    icon: TrendingUp, tone: 'cyan',
    title: 'Allocate one more agent to Counter 2',
    body:  'Counter 2 is approaching 92% utilization. Adding a second agent during 11:00–13:00 would reduce average wait by ~3.4 minutes.',
    impact: 'High',
    saving: '−3.4m wait',
  },
  {
    icon: Clock, tone: 'amber',
    title: 'Shift express tickets to morning slots',
    body:  'Express service hits SLA 98% of the time before 10:00, but only 71% after 14:00. Promoting morning slots will smooth demand.',
    impact: 'Medium',
    saving: '+9% SLA',
  },
  {
    icon: Users, tone: 'violet',
    title: 'Cross-train Marcus on Specialist desk',
    body:  'Specialist desk has zero backup. Marcus has the closest skill overlap and 7m idle capacity in afternoons.',
    impact: 'Medium',
    saving: 'Risk reduction',
  },
  {
    icon: Lightbulb, tone: 'emerald',
    title: 'Enable proactive SMS for waits >12m',
    body:  'Customers waiting beyond 12m show 4× higher no-show probability. Auto SMS at 10m reduces no-shows by ~38%.',
    impact: 'High',
    saving: '−38% no-shows',
  },
];

const IMPACT_TONES = {
  High:   'bg-rose-500/10 text-rose-300 ring-rose-400/20',
  Medium: 'bg-amber-500/10 text-amber-300 ring-amber-400/20',
  Low:    'bg-emerald-500/10 text-emerald-300 ring-emerald-400/20',
};

const ICON_TONES = {
  cyan:    'bg-cyan-500/10 text-cyan-300',
  amber:   'bg-amber-500/10 text-amber-300',
  violet:  'bg-violet-500/10 text-violet-300',
  emerald: 'bg-emerald-500/10 text-emerald-300',
};

export default function SmartInsightsPage() {
  return (
    <HybridDashboardShell>
      <div className="space-y-6 pt-2">
        <PageHeader
          eyebrow="Predictive intelligence"
          title="Smart Insights"
          subtitle="AI-generated recommendations to improve queue flow, staffing, and customer experience."
          crumbs={[{ label: 'Intelligence' }, { label: 'Smart Insights' }]}
          actions={
            <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-300 ring-1 ring-cyan-400/20">
              <Sparkles className="h-3 w-3" /> 4 active suggestions
            </span>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Predicted peak"        value="12:30" delta="86 customers/hr" tone="rose"    icon={TrendingUp} />
          <StatCard label="Recommended staff"     value="+1"    delta="Counter 2 · 11–13" tone="cyan"  icon={Users} />
          <StatCard label="Projected wait drop"   value="−3.4m" delta="If applied today" tone="emerald" icon={Clock} />
          <StatCard label="Suggestions applied"   value="12"    delta="This month"       tone="violet"  icon={CheckCircle2} />
        </div>

        <div className="grid gap-5 xl:grid-cols-12">
          <div className="space-y-4 xl:col-span-8">
            {RECOMMENDATIONS.map((r) => {
              const Icon = r.icon;
              return (
                <article
                  key={r.title}
                  className="group rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5 transition-colors hover:border-white/10"
                >
                  <div className="flex items-start gap-4">
                    <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ring-1 ring-white/10 ${ICON_TONES[r.tone]}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-white">{r.title}</h3>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${IMPACT_TONES[r.impact]}`}>
                          {r.impact} impact
                        </span>
                        <span className="rounded-full bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold text-slate-300 ring-1 ring-white/10">
                          {r.saving}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{r.body}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <button className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-3 py-1.5 text-[11px] font-semibold text-slate-900">
                          Apply <ArrowRight className="h-3 w-3" />
                        </button>
                        <button className="rounded-full px-3 py-1.5 text-[11px] font-semibold text-slate-400 hover:bg-white/[0.04] hover:text-slate-200">
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="space-y-5 xl:col-span-4">
            <SmartInsightsPanel />
            <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
              <h3 className="text-sm font-semibold text-white">Trend analysis</h3>
              <p className="text-xs text-slate-400">Patterns the engine has detected</p>
              <ul className="mt-3 space-y-2 text-xs">
                {[
                  'Wednesday volumes ~22% above weekly mean',
                  'Walk-ins cluster around lunch — pre-book promotions help',
                  'Specialist demand growing 6% week-over-week',
                  'Mobile check-ins now 64% of all arrivals',
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2 text-slate-300">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </HybridDashboardShell>
  );
}
