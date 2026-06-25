// ============================================================================
//  useEventStream — Server-Sent Events subscription with auto-reconnect
// ----------------------------------------------------------------------------
//  Thin wrapper around the browser's native `EventSource` that:
//    - Authenticates the org stream via `?token=` (EventSource can't set
//      custom headers).
//    - Reads the current token from localStorage on every (re)connect so a
//      refresh-rotated token is picked up automatically.
//    - Exposes a stable `on(eventName, handler)` API \u2014 mounting components
//      register their listeners once and forget about the underlying socket.
//    - Reconnects with exponential backoff capped at 30s when the browser
//      closes the EventSource (network drop, sleep, etc.).
//
//  Two factory hooks are exported:
//    - useOrgEventStream()       \u2014 authed stream (/api/events/org)
//    - useTicketEventStream(id)  \u2014 public per-ticket stream
// ============================================================================

import { useEffect, useRef } from 'react';
import { STORAGE_KEYS } from '@/shared/constants/storage.js';

const BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
  'http://localhost:5000/api';

function useStream(urlFactory, { enabled = true, deps = [] } = {}) {
  // handlersRef maps event-name -> Map(originalHandler -> wrappedHandler).
  // We keep the wrappers so we can `removeEventListener` precisely on the
  // current EventSource and so a reconnect can re-attach the same wrappers.
  const handlersRef = useRef(new Map());
  const esRef       = useRef(null);
  const retryRef    = useRef(0);
  const retryTimerRef = useRef(null);

  // Build the SSE wrapper exactly once per (event, handler) pair.
  const makeWrapped = (handler) => (ev) => {
    try {
      const data = ev.data ? JSON.parse(ev.data) : null;
      handler(data, ev);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[useEventStream] handler error:', err);
    }
  };

  // Attach all known handlers to a fresh EventSource. Wrappers are
  // recreated per-connection because removeEventListener is per-instance.
  const attachAll = (es) => {
    for (const [event, handlerMap] of handlersRef.current.entries()) {
      for (const [original] of handlerMap.entries()) {
        const wrapped = makeWrapped(original);
        handlerMap.set(original, wrapped);
        es.addEventListener(event, wrapped);
      }
    }
  };

  // ── connect / reconnect loop ───────────────────────────────────────────
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return undefined;

    let cancelled = false;

    const open = () => {
      if (cancelled) return;

      const url = urlFactory();
      if (!url) {
        // URL not ready yet (e.g. waiting for a token). Retry shortly.
        retryTimerRef.current = setTimeout(open, 1_000);
        return;
      }

      if (esRef.current) {
        try { esRef.current.close(); } catch { /* noop */ }
      }
      const es = new EventSource(url, { withCredentials: false });
      esRef.current = es;

      es.onopen = () => {
        retryRef.current = 0;
      };
      es.onerror = () => {
        try { es.close(); } catch { /* noop */ }
        if (cancelled) return;
        const delay = Math.min(30_000, 1_000 * 2 ** retryRef.current);
        retryRef.current += 1;
        retryTimerRef.current = setTimeout(open, delay);
      };

      attachAll(es);
    };

    open();

    return () => {
      cancelled = true;
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      if (esRef.current) {
        try { esRef.current.close(); } catch { /* noop */ }
      }
      esRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  // ── public registration API ────────────────────────────────────────────
  const on = (event, handler) => {
    let handlerMap = handlersRef.current.get(event);
    if (!handlerMap) {
      handlerMap = new Map();
      handlersRef.current.set(event, handlerMap);
    }
    // If the socket is open, attach right away so this handler fires for
    // subsequent events without waiting for a reconnect. Otherwise just
    // record the original; `attachAll` will wrap+attach on next open.
    let wrapped = null;
    const es = esRef.current;
    if (es) {
      wrapped = makeWrapped(handler);
      es.addEventListener(event, wrapped);
    }
    handlerMap.set(handler, wrapped);

    return () => {
      const map = handlersRef.current.get(event);
      if (!map) return;
      const existingWrapper = map.get(handler);
      const liveSocket = esRef.current;
      if (liveSocket && existingWrapper) {
        liveSocket.removeEventListener(event, existingWrapper);
      }
      map.delete(handler);
      if (map.size === 0) handlersRef.current.delete(event);
    };
  };

  return { on };
}

/**
 * Subscribe to the authenticated org event stream.
 *
 *   const stream = useOrgEventStream();
 *   useEffect(() => stream.on('queue:created', (q) => ...), []);
 *
 * IMPORTANT: Every component that calls this gets a handle to the SAME
 * underlying EventSource. Browsers cap HTTP/1.1 connections per origin
 * at ~6, and EventSource holds a persistent connection. If each consumer
 * opened its own EventSource, a single page with 6+ consumers would
 * exhaust the connection pool and block all regular API requests
 * (refresh buttons hang forever). The singleton below is shared by every
 * consumer; each consumer's `on(event, handler)` registers/unregisters
 * its own listeners on that shared socket.
 */

// ── Singleton org-stream socket ──────────────────────────────────────────
// One EventSource for the entire app, lazily opened the first time any
// component subscribes and never recreated until the token changes or
// the network drops.
let orgEs = null;
let orgRetry = 0;
let orgRetryTimer = null;
let orgConnectedFor = null; // the token used to open the current socket
// listeners: Map<eventName, Set<handler>>
const orgListeners = new Map();
// wrappers: Map<eventName, fn> — JSON-parsing wrapper attached to ES
const orgWrappers = new Map();

function orgDispatch(eventName, payload) {
  const set = orgListeners.get(eventName);
  if (!set) return;
  for (const h of Array.from(set)) {
    try { h(payload); } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[useOrgEventStream] handler error:', err);
    }
  }
}

function ensureOrgWrapper(eventName) {
  if (orgWrappers.has(eventName)) return;
  const wrapped = (ev) => {
    let data = null;
    try { data = ev.data ? JSON.parse(ev.data) : null; } catch { /* noop */ }
    orgDispatch(eventName, data);
  };
  orgWrappers.set(eventName, wrapped);
  if (orgEs) orgEs.addEventListener(eventName, wrapped);
}

function currentToken() {
  try { return window.localStorage.getItem(STORAGE_KEYS.TOKEN); } catch { return null; }
}

function openOrgSocket() {
  if (typeof window === 'undefined') return;
  const token = currentToken();
  if (!token) {
    // No token yet — try again shortly. Browsers reconnect via 401 too.
    orgRetryTimer = setTimeout(openOrgSocket, 1_000);
    return;
  }
  // Already connected for this token? Reuse.
  if (orgEs && orgConnectedFor === token) return;
  if (orgEs) { try { orgEs.close(); } catch { /* noop */ } }

  const url = `${BASE_URL}/events/org?token=${encodeURIComponent(token)}`;
  const es = new EventSource(url, { withCredentials: false });
  orgEs = es;
  orgConnectedFor = token;

  es.onopen = () => { orgRetry = 0; };
  es.onerror = () => {
    try { es.close(); } catch { /* noop */ }
    if (orgEs === es) orgEs = null;
    orgConnectedFor = null;
    // Only reconnect if there are still subscribers.
    if (orgListeners.size === 0) return;
    const delay = Math.min(30_000, 1_000 * 2 ** orgRetry);
    orgRetry += 1;
    orgRetryTimer = setTimeout(openOrgSocket, delay);
  };

  // Re-attach all existing event wrappers on this fresh socket.
  for (const [eventName, wrapped] of orgWrappers.entries()) {
    es.addEventListener(eventName, wrapped);
  }
}

function closeOrgSocketIfIdle() {
  if (orgListeners.size > 0) return;
  if (orgRetryTimer) { clearTimeout(orgRetryTimer); orgRetryTimer = null; }
  if (orgEs) { try { orgEs.close(); } catch { /* noop */ } }
  orgEs = null;
  orgConnectedFor = null;
  orgRetry = 0;
}

export function useOrgEventStream({ enabled = true } = {}) {
  // Use a ref to keep the same `on` function identity for the lifetime
  // of the consumer, so consumers' `useEffect(() => stream.on(...), [])`
  // never re-runs across renders.
  const apiRef = useRef(null);
  if (apiRef.current === null) {
    apiRef.current = {
      on: (eventName, handler) => {
        let set = orgListeners.get(eventName);
        if (!set) { set = new Set(); orgListeners.set(eventName, set); }
        set.add(handler);
        ensureOrgWrapper(eventName);
        // Make sure the socket is open.
        if (!orgEs) openOrgSocket();
        return () => {
          const s = orgListeners.get(eventName);
          if (!s) return;
          s.delete(handler);
          if (s.size === 0) orgListeners.delete(eventName);
          // Don't close the socket on every unsubscribe — the next
          // render is likely to subscribe again. Defer the idle check.
          setTimeout(closeOrgSocketIfIdle, 0);
        };
      },
    };
  }

  useEffect(() => {
    if (!enabled) return undefined;
    if (!orgEs) openOrgSocket();
    return undefined;
  }, [enabled]);

  return apiRef.current;
}

/**
 * Subscribe to the public per-ticket event stream. No auth \u2014 the ticket id
 * is the bearer (same model as GET /api/public/tickets/:id).
 */
export function useTicketEventStream(ticketId, { enabled = true } = {}) {
  return useStream(
    () => (ticketId ? `${BASE_URL}/public/events/tickets/${ticketId}` : null),
    { enabled: enabled && !!ticketId, deps: [ticketId] }
  );
}

export default useOrgEventStream;
