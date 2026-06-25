// ============================================================================
//  useQueues.test.jsx
// ----------------------------------------------------------------------------
//  Regression tests for the spinner-stuck bug fixed 2026-06-24:
//    - fetch THROW must transition status to 'error', not strand 'loading'
//    - inline {} params must not cause an infinite re-fetch loop
//    - SSE queue:created prepends + dedups optimistic placeholders
//    - replaceQueue handles missing real._id gracefully
// ============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// Mock the API client BEFORE importing the hook so the hook captures the mock.
vi.mock('@/services/queueApi.js', () => ({
  default: { list: vi.fn(), get: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() },
}));

import queueApi from '@/services/queueApi.js';
import { useQueues } from '@/features/queue/hooks/useQueues.js';

const SAMPLE = [
  { _id: 'q1', name: 'Reception', status: 'active' },
  { _id: 'q2', name: 'Pharmacy',  status: 'paused' },
];

beforeEach(() => {
  queueApi.list.mockReset();
});

describe('useQueues — happy path', () => {
  it('loads queues on mount and exposes status: ready', async () => {
    queueApi.list.mockResolvedValueOnce({ ok: true, status: 200, data: SAMPLE });

    const { result } = renderHook(() => useQueues());

    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.queues).toEqual(SAMPLE);
    expect(result.current.error).toBeNull();
    expect(queueApi.list).toHaveBeenCalledTimes(1);
  });

  it('returns [] when the API returns non-array data', async () => {
    queueApi.list.mockResolvedValueOnce({ ok: true, status: 200, data: null });
    const { result } = renderHook(() => useQueues());
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.queues).toEqual([]);
  });
});

describe('useQueues — failure modes', () => {
  it('transitions to error when fetch THROWS (network drop)', async () => {
    // This is the bug we just fixed — an unhandled throw used to leave
    // the spinner stuck on 'loading' forever.
    queueApi.list.mockRejectedValueOnce(new Error('Network failure'));

    const { result } = renderHook(() => useQueues());

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toMatch(/network/i);
    expect(result.current.queues).toEqual([]);
  });

  it('transitions to error when the API returns ok:false', async () => {
    queueApi.list.mockResolvedValueOnce({ ok: false, status: 500, message: 'boom' });
    const { result } = renderHook(() => useQueues());
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBe('boom');
  });
});

describe('useQueues — stable params (no infinite refetch)', () => {
  it('does not refetch on re-render when caller passes inline {}', async () => {
    // This is the OTHER half of the spinner bug — components like
    // OperationsPage pass `useQueues({}, {...})` and each render created a
    // brand-new {} reference. Without internal stabilization the hook
    // would refire fetchOnce on every render → infinite loop.
    queueApi.list.mockResolvedValue({ ok: true, status: 200, data: SAMPLE });

    const { result, rerender } = renderHook(
      // eslint-disable-next-line react-hooks/exhaustive-deps
      () => useQueues({}, { pollMs: 0 })
    );

    await waitFor(() => expect(result.current.status).toBe('ready'));
    const callsAfterMount = queueApi.list.mock.calls.length;

    // Force several re-renders. A new {} is created on every call, but
    // the hook's internal stabilization should keep fetchOnce stable.
    for (let i = 0; i < 5; i += 1) rerender();

    // Give microtasks a chance to flush in case a stray refetch was queued.
    await new Promise((r) => setTimeout(r, 30));

    expect(queueApi.list.mock.calls.length).toBe(callsAfterMount);
  });

  it('does refetch when params CONTENT changes', async () => {
    queueApi.list.mockResolvedValue({ ok: true, status: 200, data: SAMPLE });

    const { result, rerender } = renderHook(
      ({ p }) => useQueues(p),
      { initialProps: { p: { status: 'active' } } }
    );
    await waitFor(() => expect(result.current.status).toBe('ready'));
    const callsBefore = queueApi.list.mock.calls.length;

    rerender({ p: { status: 'paused' } });

    await waitFor(() => expect(queueApi.list.mock.calls.length).toBe(callsBefore + 1));
  });
});

describe('useQueues — optimistic mutators', () => {
  it('addQueueOptimistic prepends a placeholder', async () => {
    queueApi.list.mockResolvedValueOnce({ ok: true, status: 200, data: SAMPLE });
    const { result } = renderHook(() => useQueues());
    await waitFor(() => expect(result.current.status).toBe('ready'));

    const temp = { _id: 'temp:1', name: 'New', _optimistic: true };
    act(() => { result.current.addQueueOptimistic(temp); });

    expect(result.current.queues[0]).toBe(temp);
    expect(result.current.queues).toHaveLength(SAMPLE.length + 1);
  });

  it('replaceQueue swaps the temp for the real record', async () => {
    queueApi.list.mockResolvedValueOnce({ ok: true, status: 200, data: SAMPLE });
    const { result } = renderHook(() => useQueues());
    await waitFor(() => expect(result.current.status).toBe('ready'));

    act(() => { result.current.addQueueOptimistic({ _id: 'temp:1', name: 'New', _optimistic: true }); });
    act(() => { result.current.replaceQueue('temp:1', { _id: 'real-1', name: 'New' }); });

    expect(result.current.queues.find((q) => q._id === 'temp:1')).toBeUndefined();
    expect(result.current.queues.find((q) => q._id === 'real-1')).toBeDefined();
  });

  it('replaceQueue with no real._id just drops the temp placeholder', async () => {
    queueApi.list.mockResolvedValueOnce({ ok: true, status: 200, data: SAMPLE });
    const { result } = renderHook(() => useQueues());
    await waitFor(() => expect(result.current.status).toBe('ready'));

    act(() => { result.current.addQueueOptimistic({ _id: 'temp:1', name: 'New', _optimistic: true }); });
    act(() => { result.current.replaceQueue('temp:1', null); });

    expect(result.current.queues.find((q) => q._id === 'temp:1')).toBeUndefined();
    expect(result.current.queues).toHaveLength(SAMPLE.length);
  });

  it('beginMutation blocks a silent poll from overwriting local state', async () => {
    queueApi.list.mockResolvedValueOnce({ ok: true, status: 200, data: SAMPLE });
    const { result } = renderHook(() => useQueues());
    await waitFor(() => expect(result.current.status).toBe('ready'));

    act(() => { result.current.beginMutation(); });
    act(() => { result.current.addQueueOptimistic({ _id: 'temp:1', name: 'Mid' }); });

    // A poll comes in with the OLD server payload (no temp:1). The hook
    // must skip the overwrite while a mutation is in flight.
    queueApi.list.mockResolvedValueOnce({ ok: true, status: 200, data: SAMPLE });
    await act(async () => { await result.current.refresh(); });

    expect(result.current.queues.find((q) => q._id === 'temp:1')).toBeDefined();

    // After endMutation, the next refresh reconciles to the server payload.
    act(() => { result.current.endMutation(); });
    queueApi.list.mockResolvedValueOnce({ ok: true, status: 200, data: SAMPLE });
    await act(async () => { await result.current.refresh(); });
    expect(result.current.queues.find((q) => q._id === 'temp:1')).toBeUndefined();
  });
});

describe('useQueues — SSE live updates', () => {
  it('queue:created prepends a new queue from the live channel', async () => {
    // Provide a token so the singleton EventSource opens.
    window.localStorage.setItem('flowops.token', 'tok');
    queueApi.list.mockResolvedValueOnce({ ok: true, status: 200, data: SAMPLE });

    const { result } = renderHook(() => useQueues());
    await waitFor(() => expect(result.current.status).toBe('ready'));

    // Singleton ES is opened lazily on the first .on() call. Wait for it.
    await waitFor(() => expect(globalThis.__MockEventSource.instances.length).toBeGreaterThan(0));
    const es = globalThis.__MockEventSource.instances.at(-1);

    act(() => {
      es.emit('queue:created', { _id: 'q3', name: 'Triage', status: 'active' });
    });

    expect(result.current.queues[0]).toMatchObject({ _id: 'q3', name: 'Triage' });
  });

  it('queue:deleted removes the matching queue', async () => {
    window.localStorage.setItem('flowops.token', 'tok');
    queueApi.list.mockResolvedValueOnce({ ok: true, status: 200, data: SAMPLE });

    const { result } = renderHook(() => useQueues());
    await waitFor(() => expect(result.current.status).toBe('ready'));

    await waitFor(() => expect(globalThis.__MockEventSource.instances.length).toBeGreaterThan(0));
    const es = globalThis.__MockEventSource.instances.at(-1);

    act(() => { es.emit('queue:deleted', { _id: 'q1' }); });

    expect(result.current.queues.find((q) => q._id === 'q1')).toBeUndefined();
    expect(result.current.queues).toHaveLength(1);
  });
});
