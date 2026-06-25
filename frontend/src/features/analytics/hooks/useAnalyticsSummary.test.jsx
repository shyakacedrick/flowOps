// ============================================================================
//  useAnalyticsSummary.test.jsx
// ----------------------------------------------------------------------------
//  Most important regression: `inflightRef.current` MUST reset in a
//  `finally` block. Before the fix, a throw left it permanently true,
//  blocking every future fetch and freezing the dashboard spinner.
// ============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

vi.mock('@/services/api.js', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn(), put: vi.fn() },
}));

import { api } from '@/services/api.js';
import useAnalyticsSummary from '@/features/analytics/hooks/useAnalyticsSummary.js';

const SUMMARY = {
  totals: { joined: 10, served: 7, waitingNow: 3, servingNow: 0 },
  avgWaitMins: 4,
  throughputByHour: [],
  waitBuckets: { normal: 2, delayed: 1, critical: 0 },
};

beforeEach(() => {
  api.get.mockReset();
});

describe('useAnalyticsSummary', () => {
  it('loads summary on mount', async () => {
    api.get.mockResolvedValueOnce({ ok: true, status: 200, data: SUMMARY });
    const { result } = renderHook(() => useAnalyticsSummary({ pollMs: 0 }));
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.summary).toEqual(SUMMARY);
  });

  it('range prop is sanitized to a known value', async () => {
    api.get.mockResolvedValueOnce({ ok: true, status: 200, data: SUMMARY });
    const { result } = renderHook(() => useAnalyticsSummary({ range: 'bogus', pollMs: 0 }));
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(api.get).toHaveBeenCalledWith(expect.stringContaining('range=24h'));
    expect(result.current.range).toBe('24h');
  });

  it('reports error on fetch throw AND can still refresh afterwards', async () => {
    // The critical regression: before the try/finally fix, a throw left
    // inflightRef.current === true forever. All future refresh() calls
    // returned early without doing anything.
    api.get.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    const { result } = renderHook(() => useAnalyticsSummary({ pollMs: 0 }));

    await waitFor(() => expect(result.current.status).toBe('error'));

    // Subsequent refresh must actually fire — this is what the inflightRef
    // bug would have blocked.
    api.get.mockResolvedValueOnce({ ok: true, status: 200, data: SUMMARY });
    await act(async () => { await result.current.refresh(); });
    expect(result.current.status).toBe('ready');
    expect(result.current.summary).toEqual(SUMMARY);
  });

  it('reports error on ok:false and still recovers on retry', async () => {
    api.get.mockResolvedValueOnce({ ok: false, status: 503, message: 'unavailable' });
    const { result } = renderHook(() => useAnalyticsSummary({ pollMs: 0 }));
    await waitFor(() => expect(result.current.status).toBe('error'));

    api.get.mockResolvedValueOnce({ ok: true, status: 200, data: SUMMARY });
    await act(async () => { await result.current.refresh(); });
    expect(result.current.status).toBe('ready');
  });

  it('refetches when range changes', async () => {
    api.get.mockResolvedValue({ ok: true, status: 200, data: SUMMARY });
    const { rerender } = renderHook(({ r }) => useAnalyticsSummary({ range: r, pollMs: 0 }), {
      initialProps: { r: '24h' },
    });
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(1));
    rerender({ r: '7d' });
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(2));
    expect(api.get).toHaveBeenLastCalledWith(expect.stringContaining('range=7d'));
  });
});
