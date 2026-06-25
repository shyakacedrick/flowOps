import mongoose from 'mongoose';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { success } from '../utils/apiResponse.js';
import Subscription, {
  SUBSCRIPTION_STATUSES,
  PLAN_DEFAULT_PRICE_CENTS,
} from '../models/Subscription.js';
import Organization, { ORGANIZATION_PLANS } from '../models/Organization.js';

// ============================================================================
//  subscriptionController — /api/admin/subscriptions
// ----------------------------------------------------------------------------
//  Platform-admin only. Owner-side billing endpoints are not part of this
//  release — owners will read their subscription via the org payload in a
//  follow-up. Authorization is enforced at the route layer.
// ============================================================================

// Mongo $lookup pipeline that joins organization name/suspendedAt so the
// admin list view can render rows without a second round-trip per org.
const ORG_LOOKUP_STAGES = [
  {
    $lookup: {
      from:         'organizations',
      localField:   'organizationId',
      foreignField: '_id',
      as:           'organization',
    },
  },
  { $unwind: { path: '$organization', preserveNullAndEmptyArrays: true } },
  {
    $project: {
      organizationId:         1,
      plan:                   1,
      status:                 1,
      monthlyPriceCents:      1,
      currency:               1,
      seats:                  1,
      currentPeriodStart:     1,
      currentPeriodEnd:       1,
      trialEndsAt:            1,
      cancelledAt:            1,
      notes:                  1,
      externalCustomerId:     1,
      externalSubscriptionId: 1,
      createdAt:              1,
      updatedAt:              1,
      organization: {
        _id:         '$organization._id',
        name:        '$organization.name',
        industry:    '$organization.industry',
        plan:        '$organization.plan',
        suspendedAt: '$organization.suspendedAt',
      },
    },
  },
];

// Effective price for MRR aggregation (used in JS — Mongo aggregation
// would duplicate the fallback logic). Returns dollars × 100.
function effectivePriceCents(sub) {
  if (sub.monthlyPriceCents !== null && sub.monthlyPriceCents !== undefined) {
    return sub.monthlyPriceCents;
  }
  return PLAN_DEFAULT_PRICE_CENTS[sub.plan] ?? 0;
}

/**
 * GET /api/admin/subscriptions
 * Returns subscriptions joined with their organization, plus a summary
 * block (`meta`) the admin page renders directly as MRR / counts /
 * plan distribution. We also synthesize a row for any org that doesn't
 * yet have a Subscription document (legacy data), so the admin sees
 * every org in one consistent table.
 */
export const listSubscriptions = asyncHandler(async (_req, res) => {
  const [subs, orgs] = await Promise.all([
    Subscription.aggregate([
      ...ORG_LOOKUP_STAGES,
      { $sort: { 'organization.name': 1 } },
    ]),
    Organization.find({}, '_id name industry plan suspendedAt').lean(),
  ]);

  // Synthesize implicit subscriptions for orgs that don't have one yet so
  // the admin always sees the full roster. These rows have null _id and
  // status='trialing' as conservative defaults until upserted.
  const subsByOrg = new Map(subs.map((s) => [String(s.organizationId), s]));
  const merged = [...subs];
  for (const org of orgs) {
    if (subsByOrg.has(String(org._id))) continue;
    merged.push({
      _id:                null,
      organizationId:     org._id,
      plan:               org.plan || 'starter',
      status:             'trialing',
      monthlyPriceCents:  null,
      currency:           'USD',
      seats:              1,
      currentPeriodStart: null,
      currentPeriodEnd:   null,
      trialEndsAt:        null,
      cancelledAt:        null,
      notes:              '',
      organization: {
        _id:         org._id,
        name:        org.name,
        industry:    org.industry,
        plan:        org.plan,
        suspendedAt: org.suspendedAt,
      },
      _synthetic: true,
    });
  }
  merged.sort((a, b) => (a.organization?.name || '').localeCompare(b.organization?.name || ''));

  // MRR = sum of effective monthly prices for active + trialing + past_due
  // subscriptions (cancelled/paused are excluded). Done in JS so the
  // fallback to PLAN_DEFAULT_PRICE_CENTS is consistent with the model.
  const REVENUE_STATUSES = new Set(['active', 'trialing', 'past_due']);
  let mrrCents = 0;
  const planCounts   = Object.fromEntries(ORGANIZATION_PLANS.map((p) => [p, 0]));
  const statusCounts = Object.fromEntries(SUBSCRIPTION_STATUSES.map((s) => [s, 0]));
  for (const sub of merged) {
    if (REVENUE_STATUSES.has(sub.status)) mrrCents += effectivePriceCents(sub);
    if (ORGANIZATION_PLANS.includes(sub.plan))      planCounts[sub.plan]   += 1;
    if (SUBSCRIPTION_STATUSES.includes(sub.status)) statusCounts[sub.status] += 1;
  }

  return success(res, merged, 200, {
    totalOrganizations: orgs.length,
    totalSubscriptions: merged.length,
    mrrCents,
    currency: 'USD',
    planCounts,
    statusCounts,
  });
});

/**
 * GET /api/admin/subscriptions/:orgId
 */
export const getSubscription = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.orgId)) {
    throw ApiError.badRequest('Invalid organization id');
  }
  const [sub] = await Subscription.aggregate([
    { $match: { organizationId: new mongoose.Types.ObjectId(req.params.orgId) } },
    ...ORG_LOOKUP_STAGES,
  ]);
  if (!sub) {
    const org = await Organization.findById(req.params.orgId, '_id name industry plan suspendedAt');
    if (!org) throw ApiError.notFound('Organization not found');
    // Return a synthetic doc the admin can immediately PATCH to upsert.
    return success(res, {
      _id:                null,
      organizationId:     org._id,
      plan:               org.plan || 'starter',
      status:             'trialing',
      monthlyPriceCents:  null,
      currency:           'USD',
      seats:              1,
      currentPeriodStart: null,
      currentPeriodEnd:   null,
      trialEndsAt:        null,
      cancelledAt:        null,
      notes:              '',
      organization:       org.toJSON(),
      _synthetic:         true,
    });
  }
  return success(res, sub);
});

/**
 * PATCH /api/admin/subscriptions/:orgId
 * Upserts the subscription. Any subset of editable fields is accepted.
 * The Organization.plan field is mirrored to the new plan so existing
 * code that reads `org.plan` stays correct.
 */
export const patchSubscription = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.orgId)) {
    throw ApiError.badRequest('Invalid organization id');
  }
  const orgId = new mongoose.Types.ObjectId(req.params.orgId);
  const org = await Organization.findById(orgId);
  if (!org) throw ApiError.notFound('Organization not found');

  const body = req.body || {};
  const updates = { updatedBy: req.user?._id || null };

  if ('plan' in body) {
    if (!ORGANIZATION_PLANS.includes(body.plan)) {
      throw ApiError.badRequest(`plan must be one of: ${ORGANIZATION_PLANS.join(', ')}`);
    }
    updates.plan = body.plan;
  }
  if ('status' in body) {
    if (!SUBSCRIPTION_STATUSES.includes(body.status)) {
      throw ApiError.badRequest(`status must be one of: ${SUBSCRIPTION_STATUSES.join(', ')}`);
    }
    updates.status = body.status;
    if (body.status === 'cancelled') updates.cancelledAt = updates.cancelledAt || new Date();
    if (body.status !== 'cancelled') updates.cancelledAt = null;
  }
  if ('monthlyPriceCents' in body) {
    const v = body.monthlyPriceCents;
    if (v === null || v === '') {
      updates.monthlyPriceCents = null;
    } else {
      const n = Number(v);
      if (!Number.isFinite(n) || n < 0) throw ApiError.badRequest('monthlyPriceCents must be a non-negative number or null');
      updates.monthlyPriceCents = Math.round(n);
    }
  }
  if ('currency' in body) {
    const c = String(body.currency || '').trim().toUpperCase();
    if (c.length !== 3) throw ApiError.badRequest('currency must be a 3-letter ISO code');
    updates.currency = c;
  }
  if ('seats' in body) {
    const n = Number(body.seats);
    if (!Number.isFinite(n) || n < 0) throw ApiError.badRequest('seats must be a non-negative number');
    updates.seats = Math.round(n);
  }
  for (const key of ['currentPeriodStart', 'currentPeriodEnd', 'trialEndsAt', 'cancelledAt']) {
    if (!(key in body)) continue;
    const v = body[key];
    if (v === null || v === '') { updates[key] = null; continue; }
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) throw ApiError.badRequest(`${key} must be a valid date or null`);
    updates[key] = d;
  }
  for (const key of ['notes', 'externalCustomerId', 'externalSubscriptionId']) {
    if (key in body) updates[key] = String(body[key] ?? '').slice(0, 1000);
  }

  const sub = await Subscription.findOneAndUpdate(
    { organizationId: orgId },
    { $set: updates, $setOnInsert: { organizationId: orgId } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

  // Mirror plan back onto the organization so org-scoped reads stay
  // consistent without a join.
  if (updates.plan && updates.plan !== org.plan) {
    org.plan = updates.plan;
    await org.save();
  }

  // Refetch with org join so the response payload matches list shape.
  const [hydrated] = await Subscription.aggregate([
    { $match: { _id: sub._id } },
    ...ORG_LOOKUP_STAGES,
  ]);
  return success(res, hydrated || sub);
});

export default { listSubscriptions, getSubscription, patchSubscription };
