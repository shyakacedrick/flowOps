// ============================================================================
//  formatTime — small, pure time-formatting helpers
// ============================================================================

/** mm:ss from seconds. */
export function formatMMSS(seconds = 0) {
  const s = Math.max(0, Math.floor(seconds));
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

/** Relative "x ago" label from a past epoch ms. */
export function formatAgo(ms, now = Date.now()) {
  const delta = Math.max(0, Math.floor((now - ms) / 1000));
  if (delta < 2)  return 'just now';
  if (delta < 60) return `${delta}s ago`;
  const m = Math.floor(delta / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/** `HH:00` label for hour-of-day buckets. */
export function formatHourLabel(hour) {
  return `${String(hour).padStart(2, '0')}:00`;
}

/** Human-friendly minutes ("4m", "1h 12m"). */
export function formatDuration(mins = 0) {
  const m = Math.max(0, Math.round(mins));
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}
