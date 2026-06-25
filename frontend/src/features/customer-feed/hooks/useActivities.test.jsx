// ============================================================================
//  useActivities.test.jsx
// ----------------------------------------------------------------------------
//  Covers: happy load, fetch throw, ok:false, SSE prepend, limit clamp.
// ============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

vi.mock('@/services/activityApi.js', () => ({
  default: { list: vi.fn() },
}));

import activityApi from '@/services/activityApi.js';
import useActivities from '@/features/customer-feed/hooks/useActivities.js';

const ACTIVITY = (i) => ({
  _id: `a${i}`,
  type: 'ticket_created',
  description: `evt ${i}`,
  createdAt: new Date(Date.now() - i * 1000).toISOString(),
});
const DATA = [ACTIVITY(1), ACTIVITY(2), ACTIVITY(3)];

beforeEach(() => {
  activityApi.list.mockReset();
});

describe('useActivities', () => {
  it('loads activities on mount', async () => {
    activityApi.list.mockResolvedValueOnce({ ok: true, status: 200, data: DATA });
    const { result } = renderHook(() => useActivities({ pollMs: 0 }));
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.activities).toEqual(DATA);
  });

  it('recovers from a fetch throw (regression: spinner stuck on /activities)', async () => {
    activityApi.list.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    const { result } = renderHook(() => useActivities({ pollMs: 0 }));
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBeTruthy();
  });

  it('reports error on ok:false', async () => {
    activityApi.list.mockResolvedValueOnce({ ok: false, status: 401, message: 'unauthorized' });
    const { result } = renderHook(() => useActivities({ pollMs: 0 }));
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBe('unauthorized');
  });

  it('SSE activity:new prepends and respects the limit', async () => {
    window.localStorage.setItem('flowops.token', 'tok');
    activityApi.list.mockResolvedValueOnce({ ok: true, status: 200, data: DATA });
    const { result } = renderHook(() => useActivities({ limit: 3, pollMs: 0 }));
    await waitFor(() => expect(result.current.status).toBe('ready'));

    await waitFor(() => expect(globalThis.__MockEventSource.instances.length).toBeGreaterThan(0));
    const es = globalThis.__MockEventSource.instances.at(-1);

    act(() => { es.emit('activity:new', { ...ACTIVITY(99), _id: 'a99' }); });

    expect(result.current.activities[0]._id).toBe('a99');
    expect(result.current.activities).toHaveLength(3); // clamped to limit
  });

  it('SSE respects the type filter', async () => {
    window.localStorage.setItem('flowops.token', 'tok');
    activityApi.list.mockResolvedValueOnce({ ok: true, status: 200, data: DATA });
    const { result } = renderHook(() => useActivities({ type: 'queue_created', pollMs: 0 }));
    await waitFor(() => expect(result.current.status).toBe('ready'));

    await waitFor(() => expect(globalThis.__MockEventSource.instances.length).toBeGreaterThan(0));
    const es = globalThis.__MockEventSource.instances.at(-1);

    // Wrong type — ignored.
    act(() => { es.emit('activity:new', { _id: 'wrong', type: 'ticket_created' }); });
    expect(result.current.activities.find((a) => a._id === 'wrong')).toBeUndefined();

    // Right type — prepended.
    act(() => { es.emit('activity:new', { _id: 'right', type: 'queue_created' }); });
    expect(result.current.activities[0]._id).toBe('right');
  });
});
