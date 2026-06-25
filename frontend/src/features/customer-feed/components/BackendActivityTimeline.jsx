// ============================================================================
//  BackendActivityTimeline — live feed of /api/activities records
// ----------------------------------------------------------------------------
//  Read-only timeline rendered from the real Activity collection.
//  Polls every 5 seconds via useActivities. Designed to coexist with the
//  simulation-driven feed elsewhere on the same page.
// ============================================================================

import { useMemo } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { useActivities } from '@/features/customer-feed/hooks/useActivities.js';

const TYPE_META = {
  user_registered:       { tone: 'cyan',    label: 'Signup' },
  user_login:            { tone: 'sky',     label: 'Sign in' },
  organization_created:  { tone: 'violet',  label: 'Org' },
  queue_created:         { tone: 'cyan',    label: 'Queue +' },
  queue_updated:         { tone: 'amber',   label: 'Queue ~' },
  queue_deleted:         { tone: 'rose',    label: 'Queue \u2212' },
  ticket_created:        { tone: 'cyan',    label: 'Join' },
  ticket_serving:        { tone: 'sky',     label: 'Serving' },
  ticket_served:         { tone: 'emerald', label: 'Served' },
  ticket_skipped:        { tone: 'amber',   label: 'Skipped' },
  ticket_cancelled:      { tone: 'rose',    label: 'Cancelled' },
};

const TONES = {
  cyan:    { dot: 'bg-cyan-400',    text: 'text-cyan-300',    bg: 'bg-cyan-500/10' },
  sky:     { dot: 'bg-sky-400',     text: 'text-sky-300',     bg: 'bg-sky-500/10' },
  emerald: { dot: 'bg-emerald-400', text: 'text-emerald-300', bg: 'bg-emerald-500/10' },
  amber:   { dot: 'bg-amber-400',   text: 'text-amber-300',   bg: 'bg-amber-500/10' },
  rose:    { dot: 'bg-rose-400',    text: 'text-rose-300',    bg: 'bg-rose-500/10' },
  violet:  { dot: 'bg-violet-400',  text: 'text-violet-300',  bg: 'bg-violet-500/10' },
};

export default function BackendActivityTimeline({
  title = 'Backend activity',
  subtitle = 'Live from /api/activities \u00b7 polls every 5s \u00b7 org-scoped',
  limit = 50,
  type,
}) {
  const { activities, status, error, refresh } = useActivities({ limit, type });

  const rows = useMemo(() => {
    return activities.map((a) => {
      const meta = TYPE_META[a.type] || { tone: 'cyan', label: a.type };
      return { ...a, _meta: meta };
    });
  }, [activities]);

  return (
    <section className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <p className="text-xs text-slate-400">{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={status === 'loading'}
          title="Refresh"
          aria-label="Refresh activity"
          className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 transition hover:border-white/20 hover:text-white disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${status === 'loading' ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {status === 'error' && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {error || 'Failed to load activity log.'}
        </div>
      )}

      {status === 'loading' && rows.length === 0 && (
        <p className="py-6 text-center text-xs text-slate-500">Loading activity\u2026</p>
      )}
      {status === 'ready' && rows.length === 0 && (
        <p className="py-6 text-center text-xs text-slate-500">
          No activity yet. Create a queue or a ticket to see events flow in here.
        </p>
      )}

      {rows.length > 0 && (
        <ol className="relative mt-4 space-y-3 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-px before:bg-white/[0.06]">
          {rows.map((row) => {
            const tone = TONES[row._meta.tone] || TONES.cyan;
            return (
              <li key={row._id} className="relative flex items-start gap-4">
                <span className={`relative z-10 mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-full ring-2 ring-[#0B1120] ${tone.bg}`}>
                  <span className={`h-2 w-2 rounded-full ${tone.dot}`} />
                </span>
                <div className="min-w-0 flex-1 rounded-2xl border border-white/[0.05] bg-white/[0.02] p-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-sm text-white">{row.description}</p>
                    <span className="shrink-0 font-mono text-[10px] text-slate-500">
                      {formatTs(row.createdAt)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={`inline-block rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${tone.text} ${tone.bg}`}>
                      {row._meta.label}
                    </span>
                    {row.actorId?.name && (
                      <span className="truncate text-[11px] text-slate-400">
                        by {row.actorId.name}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

function formatTs(iso) {
  if (!iso) return '\u2014';
  const d = new Date(iso);
  const now = Date.now();
  const diff = Math.floor((now - d.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString();
}
