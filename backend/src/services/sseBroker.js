// ============================================================================
//  sseBroker — in-memory Server-Sent Events publisher
// ----------------------------------------------------------------------------
//  Why SSE (not Socket.IO):
//    - All Phase 14 events are server -> client (push). Clients never need
//      to "send" through the live channel; they already POST via REST.
//    - Plain HTTP, no protocol upgrade. Works through every proxy / CDN.
//    - The browser's `EventSource` reconnects automatically.
//    - Zero new runtime deps.
//
//  Channel model:
//    - `org:<organizationId>` — broadcast to every authenticated client
//      currently connected for that organization (owner dashboards, staff
//      consoles, admin tabs scoped to that org).
//    - `ticket:<ticketId>`    — broadcast to the public customer page for
//      that specific ticket (no auth required; the ticket id is the token).
//
//  Anything more sophisticated (cross-process fanout, persistence,
//  presence) requires Redis/pub-sub later. For a single-node deployment
//  this in-memory broker is exactly enough.
// ============================================================================

const channels = new Map(); // channel -> Set<res>

/**
 * Subscribe an Express response object to a channel. Returns an unsubscribe
 * function. The caller is responsible for the SSE handshake (headers + first
 * comment) before calling this.
 */
export function subscribe(channel, res) {
  let set = channels.get(channel);
  if (!set) {
    set = new Set();
    channels.set(channel, set);
  }
  set.add(res);

  return () => {
    const current = channels.get(channel);
    if (!current) return;
    current.delete(res);
    if (current.size === 0) channels.delete(channel);
  };
}

/**
 * Publish an event to every subscriber of a channel.
 *
 *   publish('org:abc', 'activity:new', { ... })
 *
 * Writes follow the SSE wire format:
 *   event: <name>
 *   data: <json>
 *   \n\n
 *
 * Silently drops broken pipes — the `close` handler on the subscriber
 * route will clean them up shortly.
 */
export function publish(channel, event, payload) {
  const set = channels.get(channel);
  if (!set || set.size === 0) return;

  const frame = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const res of set) {
    try {
      res.write(frame);
    } catch {
      /* socket closed mid-write; cleanup runs via the route's `close` listener */
    }
  }
}

/**
 * Diagnostic: subscriber counts per channel. Wire to /health if useful.
 */
export function stats() {
  const out = {};
  for (const [channel, set] of channels) out[channel] = set.size;
  return out;
}

export default { subscribe, publish, stats };
