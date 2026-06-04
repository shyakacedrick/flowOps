import { useState } from 'react';
import { LifeBuoy, Clock, CheckCircle2, AlertTriangle, MessageSquare, ArrowUpRight } from 'lucide-react';
import AdminLayout from '../../layout/AdminLayout.jsx';
import PageHeader, { StatCard } from '../../components/shared/PageHeader.jsx';

const TICKETS = [
  { id: 'TK-3091', subject: 'Queue engine showing stale data after deploy', org: 'NorthBank Queue',     priority: 'urgent', status: 'open',        owner: 'Omar K.',     updated: '4m ago',  messages: 8 },
  { id: 'TK-3088', subject: 'SSO integration with Okta fails on callback',  org: 'St. Mary Hospital',   priority: 'high',   status: 'open',        owner: 'Priya P.',    updated: '18m ago', messages: 4 },
  { id: 'TK-3085', subject: 'Cannot export analytics CSV beyond 90 days',   org: 'Banco Central',       priority: 'medium', status: 'in_progress', owner: 'Marcus C.',   updated: '1h ago',  messages: 12 },
  { id: 'TK-3081', subject: 'Custom branding logo not rendering on mobile', org: 'Lush Salon',          priority: 'low',    status: 'open',        owner: 'Unassigned',  updated: '2h ago',  messages: 1 },
  { id: 'TK-3074', subject: 'Add multi-counter support to Premium plan',    org: 'Sakura Ramen House',  priority: 'medium', status: 'waiting',     owner: 'Hannah W.',   updated: '5h ago',  messages: 6 },
  { id: 'TK-3068', subject: 'Billing — duplicate charge on June 1',         org: 'City Hall · Permits', priority: 'high',   status: 'resolved',    owner: 'Omar K.',     updated: '1d ago',  messages: 9 },
  { id: 'TK-3062', subject: 'API rate limit too aggressive for webhooks',   org: 'Skyline Dental',      priority: 'medium', status: 'resolved',    owner: 'Marcus C.',   updated: '2d ago',  messages: 14 },
];

const PRIO_STYLE = {
  urgent: 'bg-rose-500/15 text-rose-200 ring-rose-400/40',
  high:   'bg-amber-500/15 text-amber-200 ring-amber-400/40',
  medium: 'bg-cyan-500/15 text-cyan-200 ring-cyan-400/30',
  low:    'bg-white/[0.05] text-slate-300 ring-white/10',
};
const STATUS_STYLE = {
  open:        { text: 'Open',        col: 'text-rose-300',    bg: 'bg-rose-500/10',    ring: 'ring-rose-400/30' },
  in_progress: { text: 'In progress', col: 'text-cyan-300',    bg: 'bg-cyan-500/10',    ring: 'ring-cyan-400/30' },
  waiting:     { text: 'Waiting',     col: 'text-amber-300',   bg: 'bg-amber-500/10',   ring: 'ring-amber-400/30' },
  resolved:    { text: 'Resolved',    col: 'text-emerald-300', bg: 'bg-emerald-500/10', ring: 'ring-emerald-400/30' },
};

const TABS = [
  { key: 'open',     label: 'Open',         count: 4 },
  { key: 'progress', label: 'In progress',  count: 1 },
  { key: 'resolved', label: 'Resolved',     count: 2 },
  { key: 'all',      label: 'All',          count: TICKETS.length },
];

export default function SupportCenter() {
  const [tab, setTab] = useState('open');

  const filtered = TICKETS.filter((t) => {
    if (tab === 'open')     return t.status === 'open' || t.status === 'waiting';
    if (tab === 'progress') return t.status === 'in_progress';
    if (tab === 'resolved') return t.status === 'resolved';
    return true;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Customer success"
          title="Support Center"
          subtitle="Tickets, escalations, and customer conversations across the platform."
          crumbs={[{ label: 'Admin' }, { label: 'Support Center' }]}
          actions={(
            <button className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 px-3 py-1.5 text-xs font-semibold text-white shadow-[0_8px_24px_-12px_rgba(139,92,246,0.7)]">
              <MessageSquare className="h-3.5 w-3.5" /> New ticket
            </button>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Open tickets"    value="5"     delta="1 urgent · 2 high"    tone="rose"    icon={LifeBuoy} />
          <StatCard label="Avg first reply" value="42m"   delta="SLA target ≤ 1h"      tone="cyan"    icon={Clock} />
          <StatCard label="Resolved (7d)"   value="18"    delta="↑ 12% vs prev week"   tone="emerald" icon={CheckCircle2} />
          <StatCard label="CSAT"            value="4.8/5" delta="124 responses"        tone="violet" />
        </div>

        <section className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1 rounded-xl border border-white/10 bg-white/[0.04] p-0.5 text-[12px] font-semibold">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors ${
                    tab === t.key ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.label}
                  <span className="rounded-md bg-white/[0.08] px-1.5 text-[10px] font-bold text-slate-300">{t.count}</span>
                </button>
              ))}
            </div>
          </div>

          <ul className="mt-4 space-y-2">
            {filtered.map((t) => {
              const s = STATUS_STYLE[t.status];
              return (
                <li key={t.id} className="group flex items-center gap-4 rounded-2xl border border-white/[0.05] bg-white/[0.02] p-4 transition-colors hover:border-white/10 hover:bg-white/[0.04]">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="font-mono text-[11px] text-slate-500">{t.id}</span>
                      <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${PRIO_STYLE[t.priority]}`}>
                        {t.priority}
                      </span>
                      {t.priority === 'urgent' && <AlertTriangle className="h-3 w-3 text-rose-300" />}
                    </div>
                    <p className="mt-1 truncate text-sm font-semibold text-white">{t.subject}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {t.org} · {t.messages} messages · updated {t.updated}
                    </p>
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Owner</p>
                    <p className="text-xs font-semibold text-slate-200">{t.owner}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${s.col} ${s.bg} ${s.ring}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${s.col.replace('text-', 'bg-')}`} />
                    {s.text}
                  </span>
                  <button className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white">
                    <ArrowUpRight className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="py-10 text-center text-sm text-slate-500">No tickets in this view.</li>
            )}
          </ul>
        </section>
      </div>
    </AdminLayout>
  );
}
