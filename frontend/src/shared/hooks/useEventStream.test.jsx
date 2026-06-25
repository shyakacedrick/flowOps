// ============================================================================
//  useEventStream.test.jsx — singleton SSE socket
// ----------------------------------------------------------------------------
//  Regression test for the connection-exhaustion bug fixed 2026-06-24:
//  every consumer used to open its own EventSource, eating all 6 HTTP/1.1
//  connection slots and blocking API requests. The fix is a module-level
//  singleton shared by every consumer.
//
//  Because the singleton is module-level state, we use vi.resetModules()
//  inside each test that needs a clean baseline.
// ============================================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

beforeEach(async () => {
  // Reset module state so each test starts with a clean singleton.
  vi.resetModules();
  window.localStorage.setItem('flowops.token', 'tok');
  // Drain any pending close timers from the previous test.
  await new Promise((r) => setTimeout(r, 0));
});

async function importHook() {
  const mod = await import('@/shared/hooks/useEventStream.js');
  return mod.useOrgEventStream;
}

describe('useOrgEventStream — singleton', () => {
  it('opens exactly ONE EventSource even when many consumers subscribe', async () => {
    const useOrgEventStream = await importHook();
    const before = globalThis.__MockEventSource.instances.length;

    // Mount five independent consumers, each registering a listener.
    const handlers = Array.from({ length: 5 }, () => vi.fn());
    const rendered = handlers.map((h) =>
      renderHook(() => {
        const s = useOrgEventStream();
        s.on('queue:created', h);
        return s;
      })
    );

    await waitFor(() => expect(globalThis.__MockEventSource.instances.length).toBeGreaterThan(before));

    const opened = globalThis.__MockEventSource.instances.length - before;
    expect(opened).toBe(1);

    rendered.forEach((r) => r.unmount());
  });

  it('one server event reaches every subscribed handler', async () => {
    const useOrgEventStream = await importHook();
    const h1 = vi.fn();
    const h2 = vi.fn();

    const r1 = renderHook(() => {
      const s = useOrgEventStream();
      s.on('queue:created', h1);
      return s;
    });
    const r2 = renderHook(() => {
      const s = useOrgEventStream();
      s.on('queue:created', h2);
      return s;
    });

    await waitFor(() => expect(globalThis.__MockEventSource.instances.length).toBeGreaterThan(0));
    const es = globalThis.__MockEventSource.instances.at(-1);

    act(() => { es.emit('queue:created', { _id: 'q1', name: 'N' }); });

    expect(h1).toHaveBeenCalledWith({ _id: 'q1', name: 'N' });
    expect(h2).toHaveBeenCalledWith({ _id: 'q1', name: 'N' });

    r1.unmount();
    r2.unmount();
  });

  it('the `on` function identity is stable across re-renders', async () => {
    // If `on` weren't stable, consumers' `useEffect(() => stream.on(...), [])`
    // wouldn't see new identity and that's fine — but more importantly the
    // common pattern `const off = stream.on(...)` followed by a deps-array
    // useEffect can lead to subtle leaks if `on` recreates the handler.
    const useOrgEventStream = await importHook();
    const seen = [];
    const { rerender } = renderHook(() => {
      const s = useOrgEventStream();
      seen.push(s.on);
      return s;
    });

    rerender();
    rerender();
    rerender();

    // All captured `on` functions must be the same reference.
    expect(new Set(seen).size).toBe(1);
  });

  it('does not open a socket while no token is present', async () => {
    window.localStorage.removeItem('flowops.token');
    const useOrgEventStream = await importHook();
    const before = globalThis.__MockEventSource.instances.length;

    renderHook(() => {
      const s = useOrgEventStream();
      s.on('queue:created', () => {});
      return s;
    });

    // The hook should retry until a token appears; for now no ES exists.
    await new Promise((r) => setTimeout(r, 50));
    expect(globalThis.__MockEventSource.instances.length).toBe(before);
  });
});
