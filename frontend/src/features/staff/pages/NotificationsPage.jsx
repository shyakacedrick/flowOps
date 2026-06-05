import { useState } from 'react';
import { Bell, CheckCheck, X, AlertTriangle, Info, Sparkles, Clock } from 'lucide-react';
import StaffShell from '@/features/staff/components/StaffShell.jsx';
import PageHeader, { StatCard } from '@/shared/components/PageHeader.jsx';

/**
 * NotificationsPage — operator inbox of system + management alerts.
 */
const SEED = [
  { id: 'n1', priority: 'high',   icon: AlertTriangle, title: 'Customer waiting > 15 min',
    body: 'Ticket A-091 (Priya Singh) has been waiting longer than the SLA target.', time: '2m ago' },
  { id: 'n2', priority: 'info',   icon: Info,
    title: 'Schedule update', body: 'Your shift on Thursday now ends at 16:30 (-30m).', time: '14m ago' },
  { id: 'n3', priority: 'medium', icon: Sparkles,
    title: 'Smart insight', body: 'Avg service time is 12% above your weekly baseline. Consider a 5-min reset.', time: '32m ago' },
  { id: 'n4', priority: 'info',   icon: Clock,
    title: 'Break reminder', body: 'Your lunch break starts at 13:00 — 1h 28m remaining.', time: '1h ago' },
  { id: 'n5', priority: 'medium', icon: AlertTriangle,
    title: 'Card reader retry', body: 'Card reader needed 1 retry on the last transaction. Monitor for issues.', time: '2h ago' },
];

const STYLE = {
  high:   { bg: 'bg-rose-500/10',   ring: 'ring-rose-400/30',   text: 'text-rose-300',   pill: 'bg-rose-500/20 text-rose-200' },
  medium: { bg: 'bg-amber-500/10',  ring: 'ring-amber-400/30',  text: 'text-amber-300',  pill: 'bg-amber-500/20 text-amber-200' },
  info:   { bg: 'bg-cyan-500/10',   ring: 'ring-cyan-400/30',   text: 'text-cyan-300',   pill: 'bg-cyan-500/20 text-cyan-200' },
};

export default function NotificationsPage() {
  const [items, setItems]   = useState(SEED);
  const [readIds, setReadIds] = useState(new Set());

  const unread = items.length - readIds.size;
  const markAllRead = () => setReadIds(new Set(items.map((i) => i.id)));
  const dismiss     = (id) => setItems((cur) => cur.filter((i) => i.id !== id));
  const toggleRead  = (id) => setReadIds((cur) => {
    const next = new Set(cur);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  return (
    <StaffShell>
      <div className="space-y-6 pt-2">
        <PageHeader
          eyebrow="Inbox"
          title="Notifications"
          subtitle="Operational alerts, manager updates, and smart insights."
          crumbs={[{ label: 'Staff', to: '/staff/dashboard' }, { label: 'Notifications' }]}
          actions={(
            <button
              onClick={markAllRead}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/[0.08]"
            >
              <CheckCheck className="h-3.5 w-3.5" /> Mark all read
            </button>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total"    value={items.length} delta="In your inbox"  tone="cyan"  icon={Bell} />
          <StatCard label="Unread"   value={unread}        delta="Need review"    tone="rose" />
          <StatCard label="High"     value={items.filter((i) => i.priority === 'high').length}   delta="Urgent"   tone="amber" />
          <StatCard label="Insights" value={items.filter((i) => i.icon === Sparkles).length}     delta="AI tips"  tone="violet" />
        </div>

        <section className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
          {items.length === 0 ? (
            <div className="py-16 text-center">
              <Bell className="mx-auto h-8 w-8 text-slate-600" />
              <p className="mt-3 text-sm font-semibold text-slate-200">Inbox zero</p>
              <p className="mt-1 text-xs text-slate-500">You're all caught up.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {items.map((n) => {
                const s = STYLE[n.priority];
                const isRead = readIds.has(n.id);
                const Icon = n.icon;
                return (
                  <li
                    key={n.id}
                    className={`flex items-start gap-3 rounded-2xl border p-4 transition-colors ${
                      isRead
                        ? 'border-white/[0.05] bg-white/[0.015] opacity-70'
                        : 'border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.05]'
                    }`}
                  >
                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ring-1 ${s.bg} ${s.ring}`}>
                      <Icon className={`h-4 w-4 ${s.text}`} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-white">{n.title}</p>
                        <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${s.pill}`}>
                          {n.priority}
                        </span>
                        {!isRead && <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />}
                      </div>
                      <p className="mt-1 text-xs text-slate-400">{n.body}</p>
                      <p className="mt-1 text-[10px] text-slate-500">{n.time}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        onClick={() => toggleRead(n.id)}
                        title={isRead ? 'Mark unread' : 'Mark read'}
                        className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-white/[0.06] hover:text-slate-200"
                      >
                        <CheckCheck className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => dismiss(n.id)}
                        title="Dismiss"
                        className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-white/[0.06] hover:text-rose-300"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </StaffShell>
  );
}
