// ============================================================================
//  NotificationsMenu — interactive bell with live dropdown panel
// ----------------------------------------------------------------------------
//  Replaces the previously-static bell button in every shell's top bar.
//  Pulls real entries from `/api/activities` (org-scoped on the backend) and
//  treats anything created after the user's locally-tracked "last seen"
//  timestamp as unread.
//
//  Why localStorage (vs a server-side read marker)?
//    The Activity model isn't a notifications table — it's an immutable
//    audit log. Wiring a per-user read marker on top of it would require
//    a brand-new collection. localStorage is good enough for the demo
//    (and matches behaviour users expect: read-state is per-device).
//
//  Refresh strategy:
//    - fetch on mount
//    - re-fetch every 60 seconds while the tab is alive
//    - re-fetch when the dropdown opens
//
//  Props:
//    seeAllPath  — route the footer link navigates to. Owner → customer-feed,
//                  staff → notifications, admin → audit-logs.
//    seeAllLabel — footer link text. Defaults to 'See all activity →'.
//    accent      — Tailwind colour token for the unread badge ('rose' for
//                  staff, 'cyan' for owner, 'violet' for admin).
//    align       — 'right' (default) | 'left' dropdown alignment.
//    getItemPath — (item) => string|null. When provided, rows become links
//                  that navigate to the returned path. Falsy = non-navigable.
// ============================================================================

import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  CheckCheck,
  UserPlus,
  LogIn as LogInIcon,
  Building2,
  ListPlus,
  Pencil,
  Trash2,
  TicketPlus,
  PlayCircle,
  CheckCircle2,
  SkipForward,
  XCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/app/providers/AuthProvider.jsx';
import { useUnreadActivity } from '@/shared/hooks/useUnreadActivity.js';

// One unified accent across every role so the notification badge always
// reads as "unread = rose". Role-specific theming (sidebar gradients,
// dashboard tints) lives elsewhere; the notification badge stays universal
// for instant recognition.
const ACCENT = {
  rose:   { dot: 'bg-rose-500', badge: 'bg-rose-500 text-white', ring: 'ring-rose-400/40' },
  cyan:   { dot: 'bg-rose-500', badge: 'bg-rose-500 text-white', ring: 'ring-rose-400/40' },
  violet: { dot: 'bg-rose-500', badge: 'bg-rose-500 text-white', ring: 'ring-rose-400/40' },
};

/**
 * Per-activity icon + tone derived from the ACTIVITY_TYPES enum on the
 * backend. Keep the shape: { icon, tone } where `tone` selects the small
 * coloured tile behind the icon in the dropdown row.
 */
const TYPE_META = {
  user_registered:      { icon: UserPlus,      tone: 'emerald' },
  user_login:           { icon: LogInIcon,     tone: 'slate'   },
  organization_created: { icon: Building2,     tone: 'violet'  },
  queue_created:        { icon: ListPlus,      tone: 'cyan'    },
  queue_updated:        { icon: Pencil,        tone: 'cyan'    },
  queue_deleted:        { icon: Trash2,        tone: 'rose'    },
  ticket_created:       { icon: TicketPlus,    tone: 'cyan'    },
  ticket_serving:       { icon: PlayCircle,    tone: 'amber'   },
  ticket_served:        { icon: CheckCircle2,  tone: 'emerald' },
  ticket_skipped:       { icon: SkipForward,   tone: 'amber'   },
  ticket_cancelled:     { icon: XCircle,       tone: 'rose'    },
};

const TONE_CLS = {
  emerald: 'bg-emerald-500/10 text-emerald-300 ring-emerald-400/30',
  cyan:    'bg-cyan-500/10    text-cyan-300    ring-cyan-400/30',
  violet:  'bg-violet-500/10  text-violet-300  ring-violet-400/30',
  rose:    'bg-rose-500/10    text-rose-300    ring-rose-400/30',
  amber:   'bg-amber-500/10   text-amber-300   ring-amber-400/30',
  slate:   'bg-white/[0.04]   text-slate-300   ring-white/10',
};

/**
 * Concise human-readable relative time. Avoids dropping a date-fns dep
 * for one tiny helper.
 */
function timeAgo(iso) {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const secs = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (secs < 60)    return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60)    return `${mins}m ago`;
  const hrs  = Math.floor(mins / 60);
  if (hrs  < 24)    return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)     return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function NotificationsMenu({
  seeAllPath,
  seeAllLabel = 'See all activity →',
  accent = 'rose',
  align = 'right',
  getItemPath,
}) {
  const { session } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  const {
    items,
    count: unreadCount,
    loading,
    error,
    refetch,
    markAllRead,
  } = useUnreadActivity();

  // Per-user lastSeen lookup for per-row "unread" rendering. Re-evaluated
  // when the marker advances via markAllRead (kept in localStorage by the hook).
  const storageKey = session?.userId ? `flowops:notif:lastSeen:${session.userId}` : null;
  const lastSeen = (() => {
    if (!storageKey || typeof window === 'undefined') return 0;
    const raw = window.localStorage.getItem(storageKey);
    return raw ? Number(raw) || 0 : 0;
  })();

  // Re-fetch when the menu opens so the dropdown always shows fresh data.
  useEffect(() => {
    if (open) refetch();
  }, [open, refetch]);

  // Dismissal handlers: outside click, Escape, route change.
  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e) => {
      if (!wrapperRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => { setOpen(false); }, [location.pathname]);

  const tone = ACCENT[accent] || ACCENT.rose;
  const panelSide = align === 'left' ? 'left-0' : 'right-0';

  return (
    <div ref={wrapperRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={unreadCount ? `Notifications (${unreadCount} unread)` : 'Notifications'}
        className={`relative grid h-9 w-9 shrink-0 place-items-center rounded-xl border text-slate-300 transition-colors ${
          open ? `border-white/20 bg-white/[0.06] ring-1 ${tone.ring}` : 'border-white/10 hover:bg-white/[0.04]'
        }`}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span
            className={`absolute top-1 right-1 grid h-4 min-w-[16px] place-items-center rounded-full ${tone.badge} px-1 text-[9px] font-bold ring-2 ring-[#0B1120]`}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{    opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            role="menu"
            className={`absolute ${panelSide} z-50 mt-2 w-80 max-w-[calc(100vw-1rem)] origin-top overflow-hidden rounded-2xl border border-white/10 bg-[#0B1120]/95 shadow-[0_24px_60px_-20px_rgba(2,8,23,0.9)] backdrop-blur-xl sm:w-96`}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-white">Notifications</p>
                <p className="text-[11px] text-slate-400">
                  {unreadCount > 0
                    ? `${unreadCount} new since your last visit`
                    : 'You\u2019re all caught up.'}
                </p>
              </div>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] font-semibold text-slate-200 hover:bg-white/[0.08]"
                  title="Mark all read"
                >
                  <CheckCheck className="h-3 w-3" />
                  Mark read
                </button>
              )}
            </div>

            {/* Body */}
            <div className="max-h-[60vh] overflow-y-auto">
              {error ? (
                <ErrorState message={error} onRetry={refetch} />
              ) : items.length === 0 ? (
                loading ? <SkeletonRows /> : <EmptyState role={session?.role} onClose={() => setOpen(false)} />
              ) : (
                <ul className="divide-y divide-white/[0.04]">
                  {items.map((it) => {
                    const ts = new Date(it.createdAt).getTime();
                    const unread = ts > lastSeen;
                    // Prefer the role-specific destination from getItemPath;
                    // fall back to the "See all" page so every row is always
                    // clickable (never a dead click).
                    const specific = typeof getItemPath === 'function' ? getItemPath(it) : null;
                    const to = specific || seeAllPath || null;
                    return (
                      <Row
                        key={it._id || it.id}
                        item={it}
                        unread={unread}
                        accentDot={tone.dot}
                        to={to}
                        onNavigate={() => setOpen(false)}
                      />
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Footer */}
            {seeAllPath && (
              <div className="border-t border-white/[0.06] px-2 py-2">
                <Link
                  to={seeAllPath}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-3 py-2 text-center text-xs font-semibold text-cyan-300 transition-colors hover:bg-white/[0.04]"
                >
                  {seeAllLabel}
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Subcomponents ──────────────────────────────────────────────────────────

function Row({ item, unread, accentDot, to, onNavigate }) {
  const meta = TYPE_META[item.type] || { icon: Bell, tone: 'slate' };
  const Icon = meta.icon;
  const actorName = item.actorId?.name || 'System';
  const cls = TONE_CLS[meta.tone] || TONE_CLS.slate;

  const body = (
    <>
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ring-1 ${cls}`}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">
          {item.description}
        </p>
        <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500">
          <span className="truncate">{actorName}</span>
          <span aria-hidden="true">·</span>
          <span>{timeAgo(item.createdAt)}</span>
        </p>
      </div>
      {unread && <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${accentDot}`} aria-label="Unread" />}
    </>
  );

  const baseCls = `flex items-start gap-3 px-4 py-3 transition-colors hover:bg-white/[0.03] ${unread ? '' : 'opacity-70'}`;

  return (
    <li>
      {to ? (
        <Link to={to} onClick={onNavigate} className={`${baseCls} focus:bg-white/[0.04] focus:outline-none`}>
          {body}
        </Link>
      ) : (
        <div className={baseCls}>{body}</div>
      )}
    </li>
  );
}

function SkeletonRows() {
  return (
    <div className="space-y-3 px-4 py-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="h-9 w-9 shrink-0 rounded-xl bg-white/[0.04]" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="h-2.5 w-3/4 rounded-full bg-white/[0.05]" />
            <div className="h-2 w-1/2 rounded-full bg-white/[0.03]" />
          </div>
        </div>
      ))}
      <p className="flex items-center justify-center gap-1.5 pt-1 text-[10px] text-slate-500">
        <Loader2 className="h-3 w-3 animate-spin" /> Loading…
      </p>
    </div>
  );
}

function EmptyState({ role, onClose }) {
  // Tailored copy + an actionable CTA so a brand-new workspace doesn't see a
  // generic dead-end. Mirrors how the dashboard onboards: "create a queue →
  // see activity flow."
  const cta = (() => {
    if (role === 'platform_admin') {
      return { label: 'Open audit logs', to: '/admin/audit-logs' };
    }
    if (role === 'staff') {
      return { label: 'Open my queue', to: '/staff/my-queue' };
    }
    // owner / default
    return { label: 'Manage queues', to: '/operations' };
  })();

  const subtitle =
    role === 'business_owner'
      ? 'Create a queue to start seeing activity here.'
      : role === 'staff'
      ? 'Customer activity will appear here as it happens.'
      : 'Platform events will appear here as they occur.';

  return (
    <div className="px-4 py-10 text-center">
      <Bell className="mx-auto h-6 w-6 text-slate-600" />
      <p className="mt-2 text-sm font-semibold text-slate-200">No activity yet</p>
      <p className="mt-1 text-[11px] text-slate-500">{subtitle}</p>
      <Link
        to={cta.to}
        onClick={onClose}
        className="mt-3 inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold text-slate-200 hover:bg-white/[0.08]"
      >
        {cta.label} →
      </Link>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="px-4 py-8 text-center">
      <AlertCircle className="mx-auto h-6 w-6 text-rose-400" />
      <p className="mt-2 text-sm font-semibold text-slate-200">Couldn\u2019t load notifications</p>
      <p className="mt-1 text-[11px] text-slate-500">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold text-slate-200 hover:bg-white/[0.08]"
      >
        Try again
      </button>
    </div>
  );
}
