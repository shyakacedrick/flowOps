// ============================================================================
//  BackendStatusPill — proof-of-life indicator for the live backend
// ----------------------------------------------------------------------------
//  Renders a small pill that calls GET /api/queues on mount and shows
//  whether the authenticated round-trip succeeded:
//    • "API connected · N queues"   (200)
//    • "API offline"                 (network / 5xx)
//    • "Session expired"            (401 — token cleared by AuthProvider)
//
//  Intentionally tiny so it can sit at the top of any dashboard without
//  conflicting with simulation-driven panels.
// ============================================================================

import { useQueues } from '@/features/queue/hooks/useQueues.js';

const dotByStatus = {
  loading: 'bg-amber-400 animate-pulse',
  ready:   'bg-emerald-400',
  error:   'bg-red-400',
  idle:    'bg-slate-500',
};

function labelFor(status, queues, error) {
  if (status === 'loading' || status === 'idle') return 'Checking API…';
  if (status === 'error') {
    if (error && /401|unauthorized|invalid/i.test(error)) return 'Session expired';
    return 'API offline';
  }
  const count = queues.length;
  return `API connected · ${count} ${count === 1 ? 'queue' : 'queues'}`;
}

export default function BackendStatusPill() {
  const { queues, status, error, refresh } = useQueues();

  return (
    <button
      type="button"
      onClick={refresh}
      title="Click to re-check the live backend"
      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-slate-300 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotByStatus[status] || dotByStatus.idle}`} />
      {labelFor(status, queues, error)}
    </button>
  );
}
