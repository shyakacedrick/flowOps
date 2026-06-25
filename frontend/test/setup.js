// ============================================================================
//  test/setup.js — global test setup
// ----------------------------------------------------------------------------
//  Loaded once per test file via vitest.config.js → test.setupFiles. Wires
//  jest-dom matchers (`toBeInTheDocument`, etc.), a fresh localStorage per
//  test, and a stub EventSource so hooks that open SSE connections don't
//  hit the network and don't leak handles between tests.
// ============================================================================

import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// ── DOM cleanup after every test ──────────────────────────────────────────
afterEach(() => {
  cleanup();
});

// ── localStorage reset ────────────────────────────────────────────────────
// jsdom keeps localStorage across tests in the same file — wipe it so a
// stale token from one test never leaks into another.
beforeEach(() => {
  try { window.localStorage.clear(); } catch { /* noop */ }
  try { window.sessionStorage.clear(); } catch { /* noop */ }
});

// ── EventSource stub ──────────────────────────────────────────────────────
// `useEventStream` opens an `EventSource` against the backend. In jsdom
// that's undefined; tests that exercise SSE listeners need a controllable
// double they can drive synchronously.
//
// Tests can grab the latest instance via `MockEventSource.instances[idx]`
// and dispatch events with `instance.emit(eventName, payload)`.
class MockEventSource {
  static instances = [];
  static reset() { MockEventSource.instances = []; }

  constructor(url) {
    this.url = url;
    this.readyState = 0;
    this.listeners = new Map();
    this.onopen = null;
    this.onerror = null;
    MockEventSource.instances.push(this);
    // Open on the next microtask so consumers can register listeners
    // before `onopen` fires.
    queueMicrotask(() => {
      this.readyState = 1;
      if (this.onopen) this.onopen({ type: 'open' });
    });
  }

  addEventListener(event, handler) {
    let set = this.listeners.get(event);
    if (!set) { set = new Set(); this.listeners.set(event, set); }
    set.add(handler);
  }

  removeEventListener(event, handler) {
    const set = this.listeners.get(event);
    if (set) set.delete(handler);
  }

  /** Test-only helper: dispatch a server event with a JSON payload. */
  emit(event, payload) {
    const set = this.listeners.get(event);
    if (!set) return;
    const ev = { data: JSON.stringify(payload), type: event };
    for (const handler of set) handler(ev);
  }

  close() {
    this.readyState = 2;
    this.listeners.clear();
  }
}

vi.stubGlobal('EventSource', MockEventSource);

// We deliberately do NOT reset MockEventSource.instances between tests —
// the org-stream socket in useEventStream.js is a module-level singleton
// that may be reused across tests. Tests should grab the latest instance
// via `globalThis.__MockEventSource.instances.at(-1)`.
//
// We DO yield to the event loop after each test so any pending
// `setTimeout(closeOrgSocketIfIdle, 0)` (queued on unmount) can run.
afterEach(async () => {
  await new Promise((r) => setTimeout(r, 0));
});

// Expose for tests that need to drive the SSE channel.
globalThis.__MockEventSource = MockEventSource;
