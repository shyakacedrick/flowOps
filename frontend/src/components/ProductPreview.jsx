import { useState } from 'react';

const TABS = [
  { id: 'queue', label: 'Queue Management' },
  { id: 'analytics', label: 'Analytics Dashboard' },
  { id: 'live', label: 'Live Operations' },
];

/* ───────────────────────── Screen 1: Queue Management ───────────────────────── */

const QUEUE_ROWS = [
  { id: 'A-104', name: 'Aisha Mensah', svc: 'Consultation', wait: '0m', state: 'serving' },
  { id: 'A-105', name: 'Daniel Kofi', svc: 'Lab Pickup', wait: '3m', state: 'next' },
  { id: 'A-106', name: 'Priya Sharma', svc: 'Consultation', wait: '8m', state: 'waiting' },
  { id: 'A-107', name: 'Omar Lawal', svc: 'Billing', wait: '12m', state: 'waiting' },
  { id: 'A-108', name: 'Maya Chen', svc: 'Consultation', wait: '17m', state: 'waiting' },
  { id: 'A-109', name: 'Tobi Adekunle', svc: 'Pharmacy', wait: '22m', state: 'waiting' },
];

function StateBadge({ state }) {
  const map = {
    serving: { c: 'text-emerald-300 bg-emerald-400/10 ring-emerald-400/20', l: 'Now serving' },
    next: { c: 'text-secondary bg-secondary/10 ring-secondary/30', l: 'Up next' },
    waiting: { c: 'text-slate-400 bg-white/[0.03] ring-white/10', l: 'Waiting' },
  }[state];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-medium ring-1 ${map.c}`}>
      {state === 'serving' && (
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
      )}
      {map.l}
    </span>
  );
}

function QueueScreen() {
  return (
    <div className="grid grid-cols-12 gap-4 p-4 sm:p-6">
      {/* Header */}
      <div className="col-span-12 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-base font-semibold text-white">Queue · Reception</h4>
          <p className="text-xs text-slate-500">Clarity Clinics — Main Branch</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-300 hover:bg-white/[0.06]">
            Filter
          </button>
          <button className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-glow">
            + Add Customer
          </button>
        </div>
      </div>

      {/* Stat strip */}
      <div className="col-span-12 grid grid-cols-3 gap-3">
        {[
          { l: 'In Queue', v: '24' },
          { l: 'Avg Wait', v: '8m 24s' },
          { l: 'Counters', v: '6 / 8' },
        ].map((s) => (
          <div key={s.l} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">{s.l}</p>
            <p className="mt-0.5 text-lg font-bold text-white">{s.v}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="col-span-12 overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.015]">
        <div className="grid grid-cols-12 gap-3 border-b border-white/[0.05] px-4 py-2 text-[10px] uppercase tracking-wider text-slate-500">
          <div className="col-span-2">Ticket</div>
          <div className="col-span-4">Customer</div>
          <div className="col-span-3">Service</div>
          <div className="col-span-1 text-right">Wait</div>
          <div className="col-span-2 text-right">Status</div>
        </div>
        <ul>
          {QUEUE_ROWS.map((r, i) => (
            <li
              key={r.id}
              className={`grid grid-cols-12 items-center gap-3 px-4 py-3 text-xs transition-colors hover:bg-white/[0.025] ${
                i !== QUEUE_ROWS.length - 1 ? 'border-b border-white/[0.04]' : ''
              }`}
            >
              <div className="col-span-2 font-mono text-slate-400">{r.id}</div>
              <div className="col-span-4 flex items-center gap-2.5">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-primary/40 to-secondary/40 text-[10px] font-semibold text-white">
                  {r.name.split(' ').map((n) => n[0]).join('')}
                </span>
                <span className="text-slate-200">{r.name}</span>
              </div>
              <div className="col-span-3 text-slate-400">{r.svc}</div>
              <div className="col-span-1 text-right font-mono text-slate-400">{r.wait}</div>
              <div className="col-span-2 flex justify-end">
                <StateBadge state={r.state} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ───────────────────────── Screen 2: Analytics Dashboard ───────────────────────── */

function BigBars() {
  const bars = [38, 55, 62, 75, 90, 82, 68, 88, 95, 78, 60, 48];
  return (
    <div className="flex h-44 items-end gap-1.5">
      {bars.map((h, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
          <div
            className="w-full rounded-md bg-gradient-to-t from-primary/70 to-secondary/60 transition-all hover:from-primary hover:to-secondary"
            style={{ height: `${h}%` }}
          />
          <span className="text-[9px] text-slate-600">{8 + i}h</span>
        </div>
      ))}
    </div>
  );
}

function Donut({ pct = 84 }) {
  return (
    <div className="relative grid h-28 w-28 place-items-center">
      <div
        className="h-28 w-28 rounded-full"
        style={{
          background: `conic-gradient(#3B82F6 0 ${pct * 0.7}%, #06B6D4 ${pct * 0.7}% ${pct}%, rgba(148,163,184,0.12) ${pct}% 100%)`,
        }}
      />
      <div className="absolute inset-3 grid place-items-center rounded-full bg-slate-950">
        <div className="text-center">
          <p className="text-xl font-bold text-white">{pct}%</p>
          <p className="text-[9px] uppercase tracking-wider text-slate-500">SLA</p>
        </div>
      </div>
    </div>
  );
}

function AnalyticsScreen() {
  return (
    <div className="grid grid-cols-12 gap-4 p-4 sm:p-6">
      {/* Header */}
      <div className="col-span-12 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-base font-semibold text-white">Analytics — Past 24h</h4>
          <p className="text-xs text-slate-500">Real-time operational performance</p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] p-1 text-[11px]">
          {['1H', '24H', '7D', '30D'].map((p, i) => (
            <span
              key={p}
              className={`rounded-md px-2.5 py-1 ${
                i === 1 ? 'bg-primary/15 text-primary' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {p}
            </span>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="col-span-12 grid gap-3 sm:grid-cols-4">
        {[
          { l: 'Avg Wait', v: '6m 12s', d: '▼ 18%', t: 'good' },
          { l: 'Served', v: '486', d: '▲ 9%', t: 'good' },
          { l: 'Abandon Rate', v: '2.1%', d: '▼ 0.6%', t: 'good' },
          { l: 'CSAT', v: '4.8', d: '▲ 0.3', t: 'good' },
        ].map((k) => (
          <div key={k.l} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">{k.l}</p>
            <p className="mt-1 text-xl font-bold text-white">{k.v}</p>
            <p className="mt-0.5 text-[10px] font-medium text-emerald-400">{k.d}</p>
          </div>
        ))}
      </div>

      {/* Chart + donut */}
      <div className="col-span-12 grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-white">Customer Flow</p>
            <p className="text-[10px] text-slate-500">Hourly volume</p>
          </div>
          <BigBars />
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <p className="text-sm font-semibold text-white">Service SLA</p>
          <p className="text-[10px] text-slate-500">% served under target</p>
          <div className="mt-2 flex items-center justify-center">
            <Donut pct={84} />
          </div>
          <div className="mt-2 flex justify-around text-[10px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-primary" /> &lt; 5m
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-secondary" /> 5–10m
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Screen 3: Live Operations ───────────────────────── */

function LiveScreen() {
  const counters = [
    { n: 'Counter 01', s: 'Aisha M.', cur: 'A-104', load: 92, state: 'busy' },
    { n: 'Counter 02', s: 'Daniel K.', cur: 'A-103', load: 78, state: 'busy' },
    { n: 'Counter 03', s: 'Priya S.', cur: '—', load: 0, state: 'idle' },
    { n: 'Counter 04', s: 'Omar L.', cur: 'A-102', load: 88, state: 'busy' },
  ];
  return (
    <div className="grid grid-cols-12 gap-4 p-4 sm:p-6">
      <div className="col-span-12 flex items-center justify-between">
        <div>
          <h4 className="text-base font-semibold text-white">Live Operations</h4>
          <p className="text-xs text-slate-500">Floor view · auto-refresh</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-md border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          Streaming
        </span>
      </div>

      {/* Now serving large card */}
      <div className="col-span-12 grid gap-3 lg:grid-cols-3">
        <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-5 lg:col-span-2">
          <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
          <p className="relative text-[10px] uppercase tracking-widest text-primary">Now serving</p>
          <p className="relative mt-2 font-mono text-5xl font-bold tracking-tight text-white">A-104</p>
          <p className="relative mt-1 text-sm text-slate-300">Aisha Mensah · Consultation · Counter 01</p>
          <div className="relative mt-5 flex items-center gap-2">
            <button className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/15">
              Complete
            </button>
            <button className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/[0.05]">
              Recall
            </button>
            <button className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/[0.05]">
              Transfer
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
          <p className="text-[10px] uppercase tracking-widest text-slate-500">Up next</p>
          <p className="mt-2 font-mono text-3xl font-bold text-white">A-105</p>
          <p className="mt-1 text-xs text-slate-400">Daniel Kofi · Lab Pickup</p>
          <div className="mt-4 space-y-1.5">
            {['A-106', 'A-107', 'A-108'].map((t) => (
              <div
                key={t}
                className="flex items-center justify-between rounded-md bg-white/[0.02] px-2.5 py-1.5 text-[11px]"
              >
                <span className="font-mono text-slate-400">{t}</span>
                <span className="text-slate-500">queued</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Counters grid */}
      <div className="col-span-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {counters.map((c) => (
          <div key={c.n} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-white">{c.n}</p>
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  c.state === 'busy' ? 'bg-emerald-400 shadow-[0_0_8px_#34D399]' : 'bg-slate-500'
                }`}
              />
            </div>
            <p className="mt-2 text-[11px] text-slate-400">{c.s}</p>
            <p className="mt-1 font-mono text-sm text-slate-200">{c.cur}</p>
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.05]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                style={{ width: `${c.load}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────── Container ───────────────────────── */

export default function ProductPreview() {
  const [tab, setTab] = useState('queue');

  return (
    <section id="product" className="section">
      <div className="mx-auto max-w-3xl text-center">
        <span className="eyebrow">Product Preview</span>
        <h2 className="h-section mt-5">Designed like the product you wish you had.</h2>
        <p className="mt-5 text-lg text-muted">
          Three surfaces. One platform. Built for the people who actually run the floor.
        </p>
      </div>

      {/* Tabs */}
      <div className="mt-10 flex justify-center">
        <div className="inline-flex rounded-xl border border-white/10 bg-white/[0.03] p-1 backdrop-blur-xl">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all sm:text-sm ${
                tab === t.id
                  ? 'bg-primary text-white shadow-glow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Screen frame */}
      <div className="relative mt-10">
        <div className="absolute -inset-10 -z-10 rounded-[3rem] bg-gradient-to-tr from-primary/15 via-secondary/10 to-transparent blur-3xl" />

        <div className="relative rounded-3xl border border-white/[0.08] bg-gradient-to-b from-slate-900/80 to-slate-950/90 p-2 shadow-2xl backdrop-blur-xl sm:p-3">
          {/* Window chrome */}
          <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-3">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
            </div>
            <div className="rounded-md border border-white/[0.06] bg-white/[0.03] px-3 py-1 text-[11px] text-slate-400">
              app.flowops.io / {tab}
            </div>
            <div className="w-12" />
          </div>

          <div key={tab} className="animate-fade-in">
            {tab === 'queue' && <QueueScreen />}
            {tab === 'analytics' && <AnalyticsScreen />}
            {tab === 'live' && <LiveScreen />}
          </div>
        </div>
      </div>
    </section>
  );
}
