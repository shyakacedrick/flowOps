// ============================================================================
//  BusinessOwnerDashboard — owner workspace (Phase 10: fully real-data)
// ----------------------------------------------------------------------------
//  Every metric on this page reads from the backend now. The simulation
//  engine is no longer consulted here — owners need a credible picture of
//  their actual operations, not a procedurally-generated one.
//
//  Data sources:
//    GET /api/analytics/summary?range=…   → headline numbers + throughput
//    GET /api/queues                       → queue health derivation
//    GET /api/tickets?queueId=…           → next-in-line for the busiest queue
//    GET /api/activities                  → live activity feed
// ============================================================================

import { useMemo, useState } from 'react';
import { ArrowRight, ListPlus, QrCode } from 'lucide-react';
import { Link } from 'react-router-dom';
import HybridDashboardShell from '@/features/dashboard/components/HybridDashboardShell.jsx';
import CustomerFlowChart from '@/features/analytics/components/CustomerFlowChart.jsx';
import OperationalQuickGrid from '@/features/operations/components/OperationalQuickGrid.jsx';
import QueueHealthPanel from '@/features/queue/components/QueueHealthPanel.jsx';
import SmartInsightsPanel from '@/features/smart-insights/components/SmartInsightsPanel.jsx';
import NextInLineTimeline from '@/features/queue/components/NextInLineTimeline.jsx';
import SystemStatusCenter from '@/features/operations/components/SystemStatusCenter.jsx';
import BootSequence from '@/features/operations/components/BootSequence.jsx';
import QueueManagerCard from '@/features/queue/components/QueueManagerCard.jsx';
import LiveTicketsCard from '@/features/queue/components/LiveTicketsCard.jsx';
import BackendActivityTimeline from '@/features/customer-feed/components/BackendActivityTimeline.jsx';

import useAnalyticsSummary from '@/features/analytics/hooks/useAnalyticsSummary.js';
import { useQueues } from '@/features/queue/hooks/useQueues.js';
import useTickets from '@/features/queue/hooks/useTickets.js';

const NEXT_TONES = ['emerald', 'violet', 'slate', 'amber', 'rose'];

export default function BusinessOwnerDashboard() {
  const [booted, setBooted] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.sessionStorage.getItem('flowops:booted') === '1';
  });

  // Range for the customer-flow chart (24h / 7d / 30d). Drives the
  // analytics fetch and the X-axis labels alike.
  const [chartRange, setChartRange] = useState('24h');

  // ── Real data sources ────────────────────────────────────────────────
  const { summary, status: analyticsStatus } = useAnalyticsSummary({ range: chartRange });
  const { queues } = useQueues();

  // For "Next in line" we focus on the busiest queue from analytics, or
  // fall back to the first active queue if analytics hasn't named one yet.
  const focusQueueId =
    summary?.busiestQueueId
    || queues.find((q) => q.status === 'active')?._id
    || queues[0]?._id
    || null;
  const { tickets: focusTickets } = useTickets(focusQueueId, { pollMs: 5000 });

  // ── Derived numbers (with safe fallbacks while loading) ──────────────
  const totals     = summary?.totals || {};
  const totalServed     = totals.served ?? 0;
  const avgWaitMins     = summary?.avgWaitMins ?? 0;
  const activeCounters  = queues.filter((q) => q.status === 'active').length;
  const totalCounters   = queues.length;
  const waiting         = totals.waitingNow ?? 0;
  const serving         = totals.servingNow ?? 0;

  // Three real time-series straight from analytics. Each carries a
  // distinct operational signal so the chart layers actually MEAN
  // something instead of being three offsets of the same number.
  const { joinedSeries, servedSeries, abandonedSeries, bucketLabels } = useMemo(() => {
    const buckets = summary?.throughputByHour || [];
    return {
      joinedSeries:    buckets.map((b) => b.joined    ?? 0),
      servedSeries:    buckets.map((b) => b.served    ?? 0),
      abandonedSeries: buckets.map((b) => b.abandoned ?? 0),
      bucketLabels:    buckets.map((b) => b.label     ?? ''),
    };
  }, [summary]);

  // Real wait-time classification: counts of CURRENTLY waiting tickets
  // bucketed by their current age (the backend computes this from
  // joinedAt against `now`). No more fake arithmetic on a single total.
  const { normal, delayed, critical } = summary?.waitBuckets || {
    normal: 0, delayed: 0, critical: 0,
  };

  // "Next in line" items from the busiest queue's waiting tickets.
  const nextItems = useMemo(() => {
    const waitingList = (focusTickets || [])
      .filter((t) => t.status === 'waiting')
      .slice()
      .sort((a, b) => new Date(a.joinedAt) - new Date(b.joinedAt))
      .slice(0, 5);

    if (!waitingList.length) return [];
    const avgSvcMins = Math.max(2, Math.round(summary?.avgServiceMins ?? 6));
    return waitingList.map((t, i) => ({
      ticket: t.ticketNumber || `#${i + 1}`,
      desk: t.customerName || '—',
      eta:  `${avgSvcMins * (i + 1)}m`,
      tone: NEXT_TONES[i % NEXT_TONES.length],
      status: i === 0 ? 'Ready' : i === 1 ? 'On deck' : 'Queued',
    }));
  }, [focusTickets, summary]);

  const handleBootDone = () => {
    setBooted(true);
    try { window.sessionStorage.setItem('flowops:booted', '1'); } catch { /* noop */ }
  };

  return (
    <>
      {!booted && <BootSequence onDone={handleBootDone} />}

      <HybridDashboardShell
        darkSlot={
          <div className="grid gap-5 lg:grid-cols-12">
            {/* ── Main column: monitor first, manage last ───────────── */}
            <div className="space-y-5 lg:col-span-8">
              <OnboardingCard
                queues={queues}
                totalActivity={(totals.served ?? 0) + (totals.waitingNow ?? 0) + (totals.servingNow ?? 0)}
              />
              {/* 1. Headline analytics — the reason this page exists */}
              <CustomerFlowChart
                totalServed={totalServed}
                avgWait={avgWaitMins}
                activeCounters={activeCounters}
                totalCounters={totalCounters}
                joinedSeries={joinedSeries}
                servedSeries={servedSeries}
                abandonedSeries={abandonedSeries}
                bucketLabels={bucketLabels}
                previous={summary?.previous || null}
                range={chartRange}
                onRangeChange={setChartRange}
              />

              {/* 2. Secondary KPI tiles — honest, complementary to chart */}
              <OperationalQuickGrid
                waiting={waiting}
                serving={serving}
                abandonRate={summary?.abandonRate ?? 0}
                prevAbandonRate={summary?.previous?.abandonRate ?? null}
                peakHour={summary?.peakHour ?? null}
                totalCounters={totalCounters}
                avgWaitMins={avgWaitMins}
              />

              {/* 3. Live operational detail (read-mostly) */}
              <LiveTicketsCard />

              {/* 4. Management / CRUD — lowest priority on an overview page */}
              <QueueManagerCard />
            </div>

            {/* ── Right rail: glance widgets clustered together ─────── */}
            <div className="space-y-5 lg:col-span-4">
              <QueueHealthPanel
                normal={normal}
                delayed={delayed}
                critical={critical}
                servedSeries={servedSeries}
                joinedSeries={joinedSeries}
                abandonedSeries={abandonedSeries}
                queueLength={waiting}
              />
              {nextItems.length > 0 ? (
                <NextInLineTimeline items={nextItems} />
              ) : (
                <EmptyNextInLine />
              )}
              <SystemStatusCenter />
              {analyticsStatus === 'error' && (
                <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-xs text-rose-200">
                  Analytics service is unreachable. Numbers above may be stale.
                </div>
              )}
            </div>
          </div>
        }
        lightSlot={
          <div className="grid gap-5 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <BackendActivityTimeline />
            </div>
            <div className="space-y-5 lg:col-span-4">
              <SmartInsightsPanel />
            </div>
          </div>
        }
      />
    </>
  );
}

function EmptyNextInLine() {
  return (
    <section className="rounded-3xl border border-white/[0.06] bg-slate-950/40 p-5">
      <h3 className="text-sm font-semibold text-white">Upcoming queue sequence</h3>
      <p className="mt-0.5 text-xs text-slate-400">Predicted hand-offs across counters</p>
      <p className="mt-5 text-center text-xs text-slate-500">
        No customers currently waiting. Share your queue's QR code to start the flow.
      </p>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Onboarding card — shown only when the workspace is still empty.
//
//  Two states:
//    1. No queues exist          → prompt to create the first queue.
//    2. Queues exist, zero       → prompt to share the queue's customer link,
//       lifetime activity          since the operational shell is set up but
//                                   no one has joined yet.
//  Once the org has any served / waiting / serving ticket activity, the card
//  silently disappears — this is a get-you-started nudge, not a permanent UI.
// ─────────────────────────────────────────────────────────────────────────────
function OnboardingCard({ queues, totalActivity }) {
  const noQueues = queues.length === 0;
  const noActivity = !noQueues && totalActivity === 0;

  if (!noQueues && !noActivity) return null;

  if (noQueues) {
    return (
      <section
        className="relative overflow-hidden rounded-3xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-violet-500/10 p-5"
      >
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 text-slate-900 shadow-[0_0_24px_-6px_rgba(34,211,238,0.7)]">
            <ListPlus className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
              Welcome to FlowOps
            </p>
            <h3 className="mt-1 text-lg font-bold text-white">Create your first queue</h3>
            <p className="mt-1 text-xs text-slate-300">
              A queue is a line of customers waiting for one of your services or
              counters. Scroll down to <span className="font-semibold text-white">Queue manager</span>{' '}
              and add one to see live tickets, analytics and AI insights appear here.
            </p>
          </div>
          <a
            href="#queue-manager"
            onClick={(e) => {
              // Soft anchor — the manager card lives further down in the same page.
              const el = document.getElementById('queue-manager');
              if (el) { e.preventDefault(); el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
            }}
            className="hidden shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-3.5 py-2 text-xs font-semibold text-slate-900 shadow-[0_0_22px_-6px_rgba(34,211,238,0.7)] sm:inline-flex"
          >
            Create queue <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </section>
    );
  }

  // queues exist but zero traffic
  return (
    <section
      className="relative overflow-hidden rounded-3xl border border-violet-400/30 bg-gradient-to-br from-violet-500/10 via-cyan-500/5 to-slate-900/30 p-5"
    >
      <div className="flex items-start gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 text-white">
          <QrCode className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-200">
            Almost there
          </p>
          <h3 className="mt-1 text-lg font-bold text-white">Share your queue with customers</h3>
          <p className="mt-1 text-xs text-slate-300">
            Your queue is live but nobody has joined yet. Open the{' '}
            <span className="font-semibold text-white">Queue manager</span> below and
            click the QR icon next to a queue to grab the customer link — print it,
            text it, or stick it at your counter.
          </p>
        </div>
        <Link
          to="/owner/queues"
          className="hidden shrink-0 items-center gap-1.5 rounded-xl border border-violet-400/40 bg-violet-500/10 px-3.5 py-2 text-xs font-semibold text-violet-100 hover:bg-violet-500/20 sm:inline-flex"
        >
          Manage queues <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  );
}
