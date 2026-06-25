// ============================================================================
//  AnalyticsPage — historical KPIs, peak demand, and trend reports
// ----------------------------------------------------------------------------
//  Pulls everything from /api/analytics/summary. The peak-hour heatmap is
//  derived from `throughputByHour` (24h view) so it reflects real ticket
//  joins. No hardcoded MONTHS/PEAK_HOURS arrays — when there's no data we
//  show an honest empty state.
// ============================================================================

import { useMemo, useState } from 'react';
import {
  BarChart3, TrendingUp, Clock, Users, Download, Activity,
} from 'lucide-react';
import HybridDashboardShell from '@/features/dashboard/components/HybridDashboardShell.jsx';
import PageHeader, { StatCard } from '@/shared/components/PageHeader.jsx';
import CustomerFlowChart from '@/features/analytics/components/CustomerFlowChart.jsx';
import useAnalyticsSummary from '@/features/analytics/hooks/useAnalyticsSummary.js';
import useQueues from '@/features/queue/hooks/useQueues.js';
import { toCsv, downloadCsv } from '@/shared/utils/csv.js';

const RANGE_LABELS = { '24h': 'Today', '7d': 'Last 7 days', '30d': 'Last 30 days' };

export default function AnalyticsPage() {
  const [range, setRange] = useState('24h');
  const { summary, status } = useAnalyticsSummary({ range, pollMs: 60_000 });
  const { queues } = useQueues();

  const joined        = summary?.totals?.joined ?? 0;
  const served        = summary?.totals?.served ?? 0;
  const avgWaitMins   = summary?.avgWaitMins != null ? Math.round(summary.avgWaitMins) : 0;
  const buckets       = summary?.throughputByHour ?? [];
  const peakHour      = summary?.peakHour;
  const peakCount     = useMemo(
    () => buckets.reduce((m, b) => Math.max(m, b.joined || 0), 0),
    [buckets],
  );
  const throughputPerHour = served > 0 && buckets.length
    ? Math.round(served / buckets.length)
    : 0;

  const joinedSeries    = buckets.map((b) => b.joined);
  const servedSeries    = buckets.map((b) => b.served);
  const abandonedSeries = buckets.map((b) => b.abandoned);
  const bucketLabels    = buckets.map((b) => b.label);

  const isEmpty = status === 'ready' && joined === 0;

  // Build a CSV of the per-bucket throughput plus a summary row so the
  // download is self-describing. Disabled while loading or empty.
  const handleExport = () => {
    const ts = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
    const filename = `flowops-analytics-${range}-${ts}.csv`;

    const summaryCsv = toCsv(
      [{
        range,
        rangeLabel: RANGE_LABELS[range],
        joined,
        served,
        abandoned: (summary?.totals?.abandoned ?? 0),
        avgWaitMins,
        peakHour: peakHour != null ? String(peakHour).padStart(2, '0') : '',
        peakCount,
        throughputPerBucket: throughputPerHour,
        exportedAt: new Date().toISOString(),
      }],
      [
        { key: 'range',                label: 'range' },
        { key: 'rangeLabel',           label: 'range_label' },
        { key: 'joined',               label: 'joined' },
        { key: 'served',               label: 'served' },
        { key: 'abandoned',            label: 'abandoned' },
        { key: 'avgWaitMins',          label: 'avg_wait_minutes' },
        { key: 'peakHour',             label: 'peak_hour' },
        { key: 'peakCount',            label: 'peak_count' },
        { key: 'throughputPerBucket',  label: 'throughput_per_bucket' },
        { key: 'exportedAt',           label: 'exported_at_iso' },
      ],
    );

    const bucketsCsv = toCsv(
      buckets,
      [
        { key: 'bucket',     label: 'bucket' },
        { key: 'label',      label: 'label' },
        { key: 'joined',     label: 'joined' },
        { key: 'served',     label: 'served' },
        { key: 'abandoned',  label: 'abandoned' },
      ],
    );

    // Two stacked tables in one file — Excel handles the blank row fine.
    const body = `# FlowOps Analytics export\r\n# range=${range}\r\n\r\n${summaryCsv}\r\n\r\n${bucketsCsv}\r\n`;
    downloadCsv(filename, body);
  };

  const exportDisabled = status === 'loading' || isEmpty || !summary;

  return (
    <HybridDashboardShell>
      <div className="space-y-6 pt-2">
        <PageHeader
          eyebrow="Business intelligence"
          title="Analytics"
          subtitle="Long-term performance, peak demand, and operational trend reports."
          crumbs={[{ label: 'Intelligence' }, { label: 'Analytics' }]}
          actions={
            <button
              onClick={handleExport}
              disabled={exportDisabled}
              title={exportDisabled ? 'Nothing to export yet' : 'Download CSV report'}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-white/[0.08] disabled:opacity-50 disabled:hover:bg-white/[0.04]"
            >
              <Download className="h-3.5 w-3.5" /> Export report
            </button>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label={`Served · ${RANGE_LABELS[range]}`} value={served} delta={`${joined} joined`} tone="cyan"    icon={Users} />
          <StatCard label="Avg wait time"     value={avgWaitMins ? `${avgWaitMins}m` : '—'} delta="Per served ticket" tone="emerald" icon={Clock} />
          <StatCard label="Peak hour"         value={peakHour != null ? `${String(peakHour).padStart(2, '0')}:00` : '—'} delta={peakCount ? `${peakCount} joined that hour` : 'No peak yet'} tone="violet"  icon={TrendingUp} />
          <StatCard label="Throughput"        value={throughputPerHour ? `${throughputPerHour} / bucket` : '—'} delta="Average across window" tone="amber"   icon={BarChart3} />
        </div>

        <CustomerFlowChart
          totalServed={served}
          avgWait={avgWaitMins}
          activeCounters={summary?.totals?.servingNow ?? 0}
          totalCounters={queues.length || null}
          joinedSeries={joinedSeries}
          servedSeries={servedSeries}
          abandonedSeries={abandonedSeries}
          bucketLabels={bucketLabels}
          previous={summary?.previous || null}
          range={range}
          onRangeChange={setRange}
        />

        <section className="grid gap-5 lg:grid-cols-2">
          <PeakHourCard buckets={buckets} peakHour={peakHour} isEmpty={isEmpty} range={range} />
          <ThroughputCard buckets={buckets} isEmpty={isEmpty} />
        </section>
      </div>
    </HybridDashboardShell>
  );
}

// ---------------------------------------------------------------------------

function PeakHourCard({ buckets, peakHour, isEmpty, range }) {
  const max = Math.max(1, ...buckets.map((b) => b.joined || 0));
  return (
    <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
      <div className="flex items-baseline justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Peak demand</h3>
          <p className="text-xs text-slate-400">Customers joined per bucket · {RANGE_LABELS[range]}</p>
        </div>
        {peakHour != null && (
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Peak {String(peakHour).padStart(2, '0')}:00
          </span>
        )}
      </div>
      {isEmpty || buckets.length === 0 ? (
        <EmptyBlock label="No demand recorded for this period yet." />
      ) : (
        <div className="mt-5 flex h-44 items-end gap-1.5">
          {buckets.map((b) => {
            const pct = ((b.joined || 0) / max) * 100;
            const hot = b.joined >= max * 0.75 && b.joined > 0;
            return (
              <div key={b.bucket} className="flex flex-1 flex-col items-center gap-1.5">
                <div className="flex h-full w-full items-end overflow-hidden rounded-md">
                  <div
                    className={`w-full rounded-md ${hot ? 'bg-gradient-to-t from-rose-500/70 to-amber-400/70' : 'bg-gradient-to-t from-cyan-500/60 to-blue-400/60'}`}
                    style={{ height: `${pct}%` }}
                  />
                </div>
                <span className="text-[9px] font-medium text-slate-500">{b.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ThroughputCard({ buckets, isEmpty }) {
  const top = useMemo(
    () => [...buckets].sort((a, b) => (b.served || 0) - (a.served || 0)).slice(0, 6),
    [buckets],
  );
  const max = Math.max(1, ...top.map((b) => b.served || 0));
  return (
    <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
      <h3 className="text-sm font-semibold text-white">Top throughput buckets</h3>
      <p className="text-xs text-slate-400">Tickets served per time bucket</p>
      {isEmpty || top.length === 0 || top[0].served === 0 ? (
        <EmptyBlock label="Once tickets are served you'll see the busiest hours here." />
      ) : (
        <ul className="mt-4 divide-y divide-white/[0.05]">
          {top.map((b) => (
            <li key={b.bucket} className="flex items-center gap-4 py-2.5">
              <span className="w-14 text-xs font-semibold text-slate-400">{b.label}</span>
              <div className="flex-1">
                <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
                    style={{ width: `${((b.served || 0) / max) * 100}%` }}
                  />
                </div>
              </div>
              <span className="w-12 text-right text-sm font-semibold text-white tabular-nums">{b.served || 0}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EmptyBlock({ label }) {
  return (
    <div className="mt-5 flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.08] py-10 text-center">
      <Activity className="h-5 w-5 text-slate-600" />
      <p className="mt-3 text-xs text-slate-400">{label}</p>
    </div>
  );
}
