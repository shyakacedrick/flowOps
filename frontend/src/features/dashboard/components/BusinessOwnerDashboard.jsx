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

import { useMemo, useState } from 'react';import HybridDashboardShell from '@/features/dashboard/components/HybridDashboardShell.jsx';
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
          <div className="grid gap-5 xl:grid-cols-12">
            {/* ── Main column: monitor first, manage last ───────────── */}
            <div className="space-y-5 xl:col-span-8">
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
            <div className="space-y-5 xl:col-span-4">
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
          <div className="grid gap-5 xl:grid-cols-12">
            <div className="xl:col-span-8">
              <BackendActivityTimeline />
            </div>
            <div className="space-y-5 xl:col-span-4">
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
