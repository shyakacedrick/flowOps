import { useMemo, useState } from 'react';
import { Search, Filter, Users, Clock, CheckCircle2, XCircle } from 'lucide-react';
import StaffShell from '@/features/staff/components/StaffShell.jsx';
import PageHeader, { StatCard } from '@/shared/components/PageHeader.jsx';
import { useSimulationSlice } from '@/engine/SimulationProvider.jsx';

/**
 * CustomersPage — searchable, filterable customer roster across statuses.
 */
const STATUSES = ['all', 'waiting', 'serving', 'served', 'skipped', 'cancelled'];

const STATUS_STYLES = {
  waiting:   { dot: 'bg-cyan-400',    text: 'text-cyan-300',    ring: 'ring-cyan-400/30',    bg: 'bg-cyan-500/10' },
  serving:   { dot: 'bg-violet-400',  text: 'text-violet-300',  ring: 'ring-violet-400/30',  bg: 'bg-violet-500/10' },
  served:    { dot: 'bg-emerald-400', text: 'text-emerald-300', ring: 'ring-emerald-400/30', bg: 'bg-emerald-500/10' },
  skipped:   { dot: 'bg-amber-400',   text: 'text-amber-300',   ring: 'ring-amber-400/30',   bg: 'bg-amber-500/10' },
  cancelled: { dot: 'bg-rose-400',    text: 'text-rose-300',    ring: 'ring-rose-400/30',    bg: 'bg-rose-500/10' },
};

const HARDCODED_EXTRAS = [
  { id: 'A-098', name: 'Priya Singh',  service: 'Account help',   status: 'served',    arrival: '09:14', desk: 'Desk 2' },
  { id: 'A-097', name: 'Tom Becker',   service: 'New account',    status: 'skipped',   arrival: '09:08', desk: '—' },
  { id: 'A-096', name: 'Layla Hassan', service: 'Withdrawal',     status: 'served',    arrival: '09:01', desk: 'Desk 2' },
  { id: 'A-095', name: 'Diego Ortiz',  service: 'Loan inquiry',   status: 'cancelled', arrival: '08:52', desk: '—' },
];

export default function CustomersPage() {
  const queue       = useSimulationSlice((s) => s.queue);
  const recent      = useSimulationSlice((s) => s.recent);
  const currentSrv  = useSimulationSlice((s) => s.business.currentServing);

  const [filter, setFilter] = useState('all');
  const [query, setQuery]   = useState('');

  const rows = useMemo(() => {
    const all = [
      ...(currentSrv ? [{ ...currentSrv, status: 'serving', arrival: '—', desk: 'Desk 2' }] : []),
      ...queue.map((c) => ({ ...c, status: 'waiting', arrival: '—', desk: '—' })),
      ...recent.map((c) => ({ ...c, status: 'served', arrival: '—', desk: 'Desk 2' })),
      ...HARDCODED_EXTRAS,
    ];
    return all.filter((r) => {
      if (filter !== 'all' && r.status !== filter) return false;
      if (query && !`${r.id} ${r.name}`.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [queue, recent, currentSrv, filter, query]);

  const counts = useMemo(() => {
    const base = { waiting: queue.length, serving: currentSrv ? 1 : 0, served: recent.length };
    return base;
  }, [queue, recent, currentSrv]);

  return (
    <StaffShell>
      <div className="space-y-6 pt-2">
        <PageHeader
          eyebrow="Roster"
          title="Customers"
          subtitle="Every customer touched by your shift — searchable, filterable, complete."
          crumbs={[{ label: 'Staff', to: '/staff/dashboard' }, { label: 'Customers' }]}
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total today" value={rows.length}        delta="All statuses"  tone="cyan"    icon={Users} />
          <StatCard label="Serving"     value={counts.serving}      delta="At your desk"  tone="violet" />
          <StatCard label="Waiting"     value={counts.waiting}      delta="In line"       tone="amber"   icon={Clock} />
          <StatCard label="Served"      value={counts.served}       delta="Completed"     tone="emerald" icon={CheckCircle2} />
        </div>

        <section className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or ticket"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400/40"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-slate-500" />
              <div className="flex flex-wrap gap-1 rounded-xl border border-white/10 bg-white/[0.04] p-0.5 text-[11px] font-semibold">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilter(s)}
                    className={`rounded-lg px-2.5 py-1 capitalize transition-colors ${
                      filter === s ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >{s}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                <tr className="border-b border-white/[0.05]">
                  <th className="px-3 py-2.5 text-left">Customer</th>
                  <th className="px-3 py-2.5 text-left">Ticket</th>
                  <th className="px-3 py-2.5 text-left">Service</th>
                  <th className="px-3 py-2.5 text-left">Status</th>
                  <th className="px-3 py-2.5 text-left">Arrival</th>
                  <th className="px-3 py-2.5 text-left">Desk</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-10 text-center text-sm text-slate-500">
                      No customers match the current filter.
                    </td>
                  </tr>
                ) : rows.map((r) => {
                  const style = STATUS_STYLES[r.status] || STATUS_STYLES.waiting;
                  return (
                    <tr key={`${r.id}-${r.status}`} className="border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02]">
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <span className="grid h-8 w-8 place-items-center rounded-full bg-white/[0.06] text-[10px] font-bold text-slate-300">
                            {(r.name || '?').split(' ').map((p) => p[0]).slice(0,2).join('')}
                          </span>
                          <span className="font-medium text-white">{r.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-xs text-slate-400">{r.id}</td>
                      <td className="px-3 py-2.5 text-slate-300">{r.service || 'General'}</td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ring-1 ${style.text} ${style.ring} ${style.bg}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                          {r.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-xs text-slate-400">{r.arrival}</td>
                      <td className="px-3 py-2.5 text-slate-400">{r.desk}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </StaffShell>
  );
}
