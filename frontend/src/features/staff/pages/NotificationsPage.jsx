import {
  Bell,
  CheckCheck,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
  SkipForward,
  PlayCircle,
  TicketPlus,
  ListPlus,
  Pencil,
  Trash2,
  UserPlus,
  LogIn as LogInIcon,
  Building2,
} from 'lucide-react';
import StaffShell from '@/features/staff/components/StaffShell.jsx';
import PageHeader, { StatCard } from '@/shared/components/PageHeader.jsx';
import EmptyState from '@/shared/components/EmptyState.jsx';
import { useUnreadActivity } from '@/shared/hooks/useUnreadActivity.js';

/**
 * NotificationsPage — operator inbox of system + management alerts.
 *
 * Wired to the real Activity feed via useUnreadActivity so what staff see in
 * the bell dropdown matches what they see here. No mock seed data.
 */
const TYPE_META = {
  user_registered:      { icon: UserPlus,     priority: 'info' },
  user_login:           { icon: LogInIcon,    priority: 'info' },
  organization_created: { icon: Building2,    priority: 'info' },
  queue_created:        { icon: ListPlus,     priority: 'info' },
  queue_updated:        { icon: Pencil,       priority: 'info' },
  queue_deleted:        { icon: Trash2,       priority: 'high' },
  ticket_created:       { icon: TicketPlus,   priority: 'info' },
  ticket_serving:       { icon: PlayCircle,   priority: 'medium' },
  ticket_served:        { icon: CheckCircle2, priority: 'info' },
  ticket_skipped:       { icon: SkipForward,  priority: 'medium' },
  ticket_cancelled:     { icon: XCircle,      priority: 'high' },
};

const STYLE = {
  high:   { bg: 'bg-rose-500/10',   ring: 'ring-rose-400/30',   text: 'text-rose-300',   pill: 'bg-rose-500/20 text-rose-200' },
  medium: { bg: 'bg-amber-500/10',  ring: 'ring-amber-400/30',  text: 'text-amber-300',  pill: 'bg-amber-500/20 text-amber-200' },
  info:   { bg: 'bg-cyan-500/10',   ring: 'ring-cyan-400/30',   text: 'text-cyan-300',   pill: 'bg-cyan-500/20 text-cyan-200' },
};

function timeAgo(iso) {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const secs = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (secs < 60)  return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60)  return `${mins}m ago`;
  const hrs  = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)   return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function NotificationsPage() {
  const { items, count, loading, error, markAllRead } = useUnreadActivity();

  const high = items.filter((it) => (TYPE_META[it.type]?.priority) === 'high').length;
  const medium = items.filter((it) => (TYPE_META[it.type]?.priority) === 'medium').length;

  return (
    <StaffShell>
      <div className="space-y-6 pt-2">
        <PageHeader
          eyebrow="Inbox"
          title="Notifications"
          subtitle="Operational alerts from your workspace activity feed."
          crumbs={[{ label: 'Staff', to: '/staff/dashboard' }, { label: 'Notifications' }]}
          actions={(
            <button
              onClick={markAllRead}
              disabled={count === 0}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCheck className="h-3.5 w-3.5" /> Mark all read
            </button>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total"   value={items.length} delta="In your inbox"     tone="cyan"  icon={Bell} />
          <StatCard label="Unread"  value={count}        delta="Need review"       tone="rose"  />
          <StatCard label="High"    value={high}         delta="Urgent"            tone="amber" icon={AlertTriangle} />
          <StatCard label="Medium"  value={medium}       delta="Worth a look"      tone="violet" icon={Info} />
        </div>

        <section className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
          {loading && items.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">Loading notifications…</div>
          ) : error ? (
            <div className="py-12 text-center text-xs text-rose-300">{error}</div>
          ) : items.length === 0 ? (
            <EmptyState
              icon={Bell}
              tone="info"
              size="md"
              title="Inbox zero"
              message="You're all caught up. New tickets, queue updates, and team activity will appear here as they happen."
            />
          ) : (
            <ul className="space-y-2">
              {items.map((it) => {
                const meta = TYPE_META[it.type] || { icon: Bell, priority: 'info' };
                const s = STYLE[meta.priority];
                const Icon = meta.icon;
                const actorName = it.actorId?.name || 'System';
                return (
                  <li
                    key={it._id}
                    className="flex items-start gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 transition-colors hover:bg-white/[0.05]"
                  >
                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ring-1 ${s.bg} ${s.ring}`}>
                      <Icon className={`h-4 w-4 ${s.text}`} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-white">{it.description}</p>
                        <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${s.pill}`}>
                          {meta.priority}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-500">
                        {actorName} · {timeAgo(it.createdAt)}
                      </p>
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
