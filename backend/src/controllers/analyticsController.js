// ============================================================================
//  analyticsController — org-scoped operational analytics
// ----------------------------------------------------------------------------
//  All metrics are derived live from real Ticket records, not from any
//  background aggregation. That keeps the schema small (no rollups to
//  maintain) at the cost of a couple of indexed COUNTs per request — fine
//  at the scales this product needs for the foreseeable future.
//
//  Endpoint:
//    GET /api/analytics/summary?range=24h|7d|30d
//
//  Response shape (data):
//    {
//      range, since, now,
//      totals: { joined, served, skipped, cancelled, waitingNow, servingNow },
//      avgWaitMins,
//      avgServiceMins,
//      abandonRate,            // (skipped+cancelled) / joined
//      peakHour,               // 0-23 (local server time) with most joins
//      busiestQueueId,         // queueId with most joins (or null)
//      waitBuckets: {          // CURRENT waiting tickets bucketed by age
//        normal,               //   < 15m
//        delayed,              //   15 – 30m
//        critical,             //   ≥ 30m
//      },
//      previous: {             // same metrics for the prior window of equal length
//        joined, served, avgWaitMins, abandonRate,
//      },
//      throughputByHour: [     // ALWAYS exactly `buckets` entries, oldest → newest
//        { bucket: 0, joined: 5, served: 4, abandoned: 1, label: '14:00' }, ...
//      ],
//      byStaff: [              // top 10 operators by served, sorted desc
//        { userId, name, email, role, served, avgHandleMins }, ...
//      ]
//    }
// ============================================================================

import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { success } from '../utils/apiResponse.js';
import Ticket, { TICKET_STATUSES } from '../models/Ticket.js';
import User, { USER_ROLES } from '../models/User.js';

const RANGE_CONFIG = {
  '24h': { ms: 24 * 60 * 60 * 1000,        bucketMs: 60 * 60 * 1000,        buckets: 24 },
  '7d':  { ms: 7  * 24 * 60 * 60 * 1000,   bucketMs: 24 * 60 * 60 * 1000,    buckets: 7 },
  '30d': { ms: 30 * 24 * 60 * 60 * 1000,   bucketMs: 24 * 60 * 60 * 1000,    buckets: 30 },
};

const orgScope = (user) => {
  if (user.role === USER_ROLES.PLATFORM_ADMIN) {
    // Admin can target one org via ?organizationId=, otherwise platform-wide.
    return {};
  }
  if (!user.organizationId) return { _id: null }; // matches nothing
  return { organizationId: user.organizationId };
};

export const getSummary = asyncHandler(async (req, res) => {
  const rangeKey = String(req.query.range || '24h');
  const cfg = RANGE_CONFIG[rangeKey];
  if (!cfg) {
    throw ApiError.badRequest(`range must be one of: ${Object.keys(RANGE_CONFIG).join(', ')}`);
  }

  const scope = orgScope(req.user);
  // Admins may scope to a single org via query.
  if (
    req.user.role === USER_ROLES.PLATFORM_ADMIN &&
    typeof req.query.organizationId === 'string' &&
    req.query.organizationId
  ) {
    scope.organizationId = req.query.organizationId;
  }

  const now = new Date();
  const since = new Date(now.getTime() - cfg.ms);
  const prevSince = new Date(since.getTime() - cfg.ms);

  // ── Single pass over tickets joined in window ────────────────────────
  // Soft-deleted tickets are excluded — they're no longer real events.
  const windowed = await Ticket.find(
    { ...scope, deletedAt: null, joinedAt: { $gte: since } },
    'status joinedAt servedAt servingStartedAt servedById queueId'
  ).lean();

  // ── Previous-equal-length window, used only for delta comparisons ────
  // Cheaper than a second aggregation pipeline: same shape, smaller projection.
  const prevWindow = await Ticket.find(
    { ...scope, deletedAt: null, joinedAt: { $gte: prevSince, $lt: since } },
    'status joinedAt servedAt'
  ).lean();

  // ── Live (non-historical) counts ─────────────────────────────────────
  // waitingNow / servingNow reflect the present moment, not the window.
  // We also pull the joinedAt of currently waiting tickets so we can
  // bucket them by *current* age, which is what `Queue health` displays.
  const [waitingDocs, servingNow] = await Promise.all([
    Ticket.find(
      { ...scope, deletedAt: null, status: TICKET_STATUSES.WAITING },
      'joinedAt'
    ).lean(),
    Ticket.countDocuments({ ...scope, deletedAt: null, status: TICKET_STATUSES.SERVING }),
  ]);
  const waitingNow = waitingDocs.length;

  // ── Aggregate counters ───────────────────────────────────────────────
  let joined = 0, served = 0, skipped = 0, cancelled = 0;
  let waitSum = 0, waitCount = 0;
  let svcSum = 0, svcCount = 0;
  const perHour = new Array(24).fill(0);
  const perQueue = new Map();
  // Per-staff rollup: { userId → { served, handleMsSum, handleMsCount } }.
  // Only SERVED tickets with a known servedById contribute. Handle-time
  // requires both servingStartedAt and servedAt to be set; legacy rows
  // without servingStartedAt are counted as served but not in the average.
  const perStaff = new Map();

  // Pre-build bucket array.
  const buckets = new Array(cfg.buckets).fill(0).map((_, i) => ({
    bucket: i,
    joined: 0,
    served: 0,
    abandoned: 0,
    label: formatBucketLabel(rangeKey, i, since, cfg),
  }));

  for (const t of windowed) {
    joined += 1;
    const isServed = t.status === TICKET_STATUSES.SERVED;
    const isAbandoned =
      t.status === TICKET_STATUSES.SKIPPED ||
      t.status === TICKET_STATUSES.CANCELLED;
    if (isServed) served += 1;
    else if (t.status === TICKET_STATUSES.SKIPPED) skipped += 1;
    else if (t.status === TICKET_STATUSES.CANCELLED) cancelled += 1;

    // peakHour: hour-of-day with most joins, across the whole window.
    if (t.joinedAt) {
      perHour[new Date(t.joinedAt).getHours()] += 1;
    }

    // busiestQueueId
    if (t.queueId) {
      const k = String(t.queueId);
      perQueue.set(k, (perQueue.get(k) || 0) + 1);
    }

    // throughputByHour bucketing
    if (t.joinedAt) {
      const idx = bucketIndex(t.joinedAt, since, cfg);
      if (idx >= 0 && idx < cfg.buckets) {
        buckets[idx].joined += 1;
        if (isAbandoned) buckets[idx].abandoned += 1;
      }
    }
    if (isServed && t.servedAt) {
      const idx = bucketIndex(t.servedAt, since, cfg);
      if (idx >= 0 && idx < cfg.buckets) buckets[idx].served += 1;
    }

    // wait + service durations for served tickets
    if (t.status === TICKET_STATUSES.SERVED && t.servedAt && t.joinedAt) {
      const waitMs = new Date(t.servedAt) - new Date(t.joinedAt);
      if (waitMs >= 0) {
        // Wait = full lifecycle for now (joined → served). Service time
        // tracking lands when we record callAt; until then svc == wait.
        waitSum += waitMs; waitCount += 1;
        svcSum += waitMs;  svcCount += 1;
      }

      // Per-staff attribution. Skip if no operator was recorded (legacy
      // rows pre-servedById, or admin-bulk-actions).
      if (t.servedById) {
        const key = String(t.servedById);
        const entry = perStaff.get(key) || { served: 0, handleMsSum: 0, handleMsCount: 0 };
        entry.served += 1;
        if (t.servingStartedAt) {
          const handleMs = new Date(t.servedAt) - new Date(t.servingStartedAt);
          if (handleMs >= 0) {
            entry.handleMsSum   += handleMs;
            entry.handleMsCount += 1;
          }
        }
        perStaff.set(key, entry);
      }
    }
  }

  // peakHour: argmax. Tie-break by earliest hour.
  let peakHour = null, peakCount = -1;
  for (let h = 0; h < 24; h += 1) {
    if (perHour[h] > peakCount) { peakCount = perHour[h]; peakHour = h; }
  }
  if (peakCount <= 0) peakHour = null;

  // busiestQueueId: argmax.
  let busiestQueueId = null, busiestCount = -1;
  for (const [k, v] of perQueue) {
    if (v > busiestCount) { busiestCount = v; busiestQueueId = k; }
  }

  const avgWaitMins = waitCount ? round1(waitSum / waitCount / 60000) : null;
  const avgServiceMins = svcCount ? round1(svcSum / svcCount / 60000) : null;
  const abandonRate = joined
    ? round1(((skipped + cancelled) / joined) * 100)
    : 0;

  // ── Previous-window aggregates (for delta strings on the dashboard) ──
  let prevJoined = 0, prevServed = 0, prevSkipped = 0, prevCancelled = 0;
  let prevWaitSum = 0, prevWaitCount = 0;
  for (const t of prevWindow) {
    prevJoined += 1;
    if (t.status === TICKET_STATUSES.SERVED) {
      prevServed += 1;
      if (t.servedAt && t.joinedAt) {
        const wMs = new Date(t.servedAt) - new Date(t.joinedAt);
        if (wMs >= 0) { prevWaitSum += wMs; prevWaitCount += 1; }
      }
    } else if (t.status === TICKET_STATUSES.SKIPPED)   prevSkipped += 1;
    else if (t.status === TICKET_STATUSES.CANCELLED)   prevCancelled += 1;
  }
  const previous = {
    joined:      prevJoined,
    served:      prevServed,
    avgWaitMins: prevWaitCount ? round1(prevWaitSum / prevWaitCount / 60000) : null,
    abandonRate: prevJoined
      ? round1(((prevSkipped + prevCancelled) / prevJoined) * 100)
      : 0,
  };

  // ── Wait buckets for currently-waiting tickets ───────────────────────
  // Thresholds mirror what `QueueHealthPanel` advertises: <15m / 15–30m / ≥30m.
  const waitBuckets = { normal: 0, delayed: 0, critical: 0 };
  for (const t of waitingDocs) {
    if (!t.joinedAt) { waitBuckets.normal += 1; continue; }
    const ageMin = (now - new Date(t.joinedAt)) / 60000;
    if      (ageMin < 15) waitBuckets.normal   += 1;
    else if (ageMin < 30) waitBuckets.delayed  += 1;
    else                  waitBuckets.critical += 1;
  }

  // ── Per-staff rankings ──────────────────────────────────────────────
  // Resolve user names in one round-trip. Sort by served desc, cap at 10.
  let byStaff = [];
  if (perStaff.size) {
    const userIds = [...perStaff.keys()];
    const users = await User.find(
      { _id: { $in: userIds } },
      'name email role'
    ).lean();
    const userById = new Map(users.map((u) => [String(u._id), u]));
    byStaff = userIds
      .map((id) => {
        const e = perStaff.get(id);
        const u = userById.get(id);
        return {
          userId:        id,
          name:          u?.name  || 'Unknown',
          email:         u?.email || null,
          role:          u?.role  || null,
          served:        e.served,
          avgHandleMins: e.handleMsCount
            ? round1(e.handleMsSum / e.handleMsCount / 60000)
            : null,
        };
      })
      .sort((a, b) => b.served - a.served)
      .slice(0, 10);
  }

  return success(res, {
    range: rangeKey,
    since: since.toISOString(),
    now: now.toISOString(),
    totals: {
      joined,
      served,
      skipped,
      cancelled,
      waitingNow,
      servingNow,
    },
    avgWaitMins,
    avgServiceMins,
    abandonRate,
    peakHour,
    busiestQueueId,
    waitBuckets,
    previous,
    throughputByHour: buckets,
    byStaff,
  });
});

// ─── helpers ────────────────────────────────────────────────────────────────

function bucketIndex(timestamp, since, cfg) {
  const ms = new Date(timestamp) - since;
  if (ms < 0) return -1;
  return Math.floor(ms / cfg.bucketMs);
}

function formatBucketLabel(rangeKey, i, since, cfg) {
  const t = new Date(since.getTime() + i * cfg.bucketMs);
  if (rangeKey === '24h') {
    return `${String(t.getHours()).padStart(2, '0')}:00`;
  }
  return `${t.getMonth() + 1}/${t.getDate()}`;
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

export default { getSummary };
