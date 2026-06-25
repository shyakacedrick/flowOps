// ============================================================================
//  Admin · User Activity — full audit trail for a single user
// ----------------------------------------------------------------------------
//  Route:  /admin/users/:userId/activity (platform_admin only)
//  Backed by GET /api/activities?actorId=<userId>&limit=200.
//
//  Navigation: opened from the Users page drawer ("View activity log"). If
//  the admin navigates to the URL directly we fall back to populated actor
//  metadata from the first matching activity row, so a deep-link still
//  works without an extra round-trip.
// ============================================================================

import { useMemo } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import {
  ScrollText, ArrowLeft, RefreshCw, AlertCircle, User as UserIcon, ShieldCheck,
} from 'lucide-react';
import AdminLayout from '@/features/admin/components/AdminShell.jsx';
import PageHeader, { StatCard } from '@/shared/components/PageHeader.jsx';
import { SkeletonListRows } from '@/shared/components/Skeleton.jsx';
import { useActivities } from '@/features/customer-feed/hooks/useActivities.js';
import { ROUTES } from '@/shared/constants/routes.js';

const TONE = {
  user_registered:      'cyan',
  user_login:           'sky',
  organization_created: 'violet',
  queue_created:        'cyan',
  queue_updated:        'amber',
  queue_deleted:        'rose',
  ticket_created:       'cyan',
  ticket_serving:       'sky',
  ticket_served:        'emerald',
  ticket_skipped:       'amber',
  ticket_cancelled:     'rose',
};

const TONE_STYLE = {
  cyan:    'bg-cyan-500/10 text-cyan-300 ring-cyan-400/30',
  sky:     'bg-sky-500/10 text-sky-300 ring-sky-400/30',
  emerald: 'bg-emerald-500/10 text-emerald-300 ring-emerald-400/30',
  amber:   'bg-amber-500/10 text-amber-300 ring-amber-400/30',
  rose:    'bg-rose-500/10 text-rose-300 ring-rose-400/30',
  violet:  'bg-violet-500/10 text-violet-300 ring-violet-400/30',
};

export default function UserActivity() {
  const { userId } = useParams();
  const { state }  = useLocation();
  // Optional hand-off from the Users drawer — saves us a name lookup.
  const seedUser   = state?.user || null;

  const { activities, status, error, refresh } =
    useActivities({ actorId: userId, limit: 200, pollMs: 10000 });

  // If the page is deep-linked (no state), fall back to the populated actor
  // returned with each activity row so we can still show a friendly name.
  const headerUser = useMemo(() => {
    if (seedUser) return seedUser;
    const first = activities.find((a) => a.actorId && typeof a.actorId === 'object');
    return first?.actorId || null;
  }, [seedUser, activities]);

  const last24h = useMemo(() => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    return activities.filter((a) => new Date(a.createdAt).getTime() >= cutoff);
  }, [activities]);

  const typesSeen = useMemo(
    () => new Set(activities.map((a) => a.type)).size,
    [activities]
  );

  const displayName = headerUser?.name || 'User';
  const displayMeta = [
    headerUser?.email,
    headerUser?.role,
  ].filter(Boolean).join(' · ');

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Identity · audit"
          title={`${displayName}'s activity`}
          subtitle={displayMeta || 'Full audit trail for this user (newest first).'}
          crumbs={[
            { label: 'Admin' },
            { label: 'Users', to: ROUTES.admin.users },
            { label: 'Activity' },
          ]}
          actions={(
            <div className="flex items-center gap-2">
              <Link
                to={ROUTES.admin.users}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/[0.08]"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                All users
              </Link>
              <button
                onClick={refresh}
                disabled={status === 'loading'}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/[0.08] disabled:opacity-50"
                aria-label="Refresh activity"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${status === 'loading' ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          )}
        />

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Events (loaded)" value={activities.length} delta="Newest 200" tone="violet" icon={ScrollText} />
          <StatCard label="Last 24h"        value={last24h.length}    delta="By this user" tone="cyan" />
          <StatCard label="Action types"    value={typesSeen}         delta="Distinct" tone="sky" icon={ShieldCheck} />
          <StatCard label="User ID"         value={shortId(userId)}   delta="Click refresh for live" tone="amber" icon={UserIcon} />
        </div>

        <section className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
          <ol className="relative space-y-2 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-px before:bg-white/[0.05]">
            {activities.map((a) => {
              const tone = TONE_STYLE[TONE[a.type] || 'cyan'];
              return (
                <li key={a._id} className="relative flex items-start gap-3">
                  <span className="relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/[0.04] ring-2 ring-[#0B1120]">
                    <span className={`h-2 w-2 rounded-full ${tone.split(' ')[0].replace('/10', '')}`} />
                  </span>
                  <div className="min-w-0 flex-1 rounded-2xl border border-white/[0.05] bg-white/[0.02] p-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      <p className="text-sm font-semibold text-white">
                        <span className="font-mono text-cyan-300">{a.type}</span>
                      </p>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ring-1 ${tone}`}>
                          {a.type}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500">{fmtTs(a.createdAt)}</span>
                      </div>
                    </div>
                    {a.description && <p className="mt-1 text-[12px] text-slate-300">→ {a.description}</p>}
                    {a.metadata && Object.keys(a.metadata).length > 0 && (
                      <pre className="mt-2 max-h-32 overflow-auto rounded-lg bg-black/30 p-2 font-mono text-[10px] text-slate-400">
{JSON.stringify(a.metadata, null, 2)}
                      </pre>
                    )}
                    <p className="mt-1 font-mono text-[10px] text-slate-500">{a._id}</p>
                  </div>
                </li>
              );
            })}
            {activities.length === 0 && status === 'ready' && (
              <li className="py-10 text-center text-sm text-slate-500">No activity recorded for this user yet.</li>
            )}
            {status === 'loading' && activities.length === 0 && (
              <SkeletonListRows rows={5} />
            )}
          </ol>
        </section>
      </div>
    </AdminLayout>
  );
}

function shortId(id) {
  if (!id) return '—';
  return id.length > 8 ? `…${id.slice(-6)}` : id;
}

function fmtTs(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  const now = Date.now();
  const diff = Math.floor((now - d.getTime()) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
