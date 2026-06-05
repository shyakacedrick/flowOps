import mongoose from 'mongoose';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { success, created, noContent } from '../utils/apiResponse.js';
import Queue, { QUEUE_STATUSES } from '../models/Queue.js';
import { USER_ROLES } from '../models/User.js';
import {
  logQueueCreated,
  logQueueUpdated,
  logQueueDeleted,
} from '../services/activityService.js';

/**
 * Org-scoped filter applied to every list/read.
 *  - platform_admin: no scope (sees all).
 *  - business_owner / staff: scoped to their own organization.
 */
const orgScope = (user, baseFilter = {}) => {
  if (user.role === USER_ROLES.PLATFORM_ADMIN) return baseFilter;
  if (!user.organizationId) return { ...baseFilter, _id: null };
  return { ...baseFilter, organizationId: user.organizationId };
};

const assertObjectId = (id, label = 'id') => {
  if (!mongoose.isValidObjectId(id)) {
    throw ApiError.badRequest(`Invalid ${label}`);
  }
};

/**
 * GET /api/queues
 * Optional filters: ?status=active&organizationId=...
 */
export const listQueues = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.organizationId && req.user.role === USER_ROLES.PLATFORM_ADMIN) {
    filter.organizationId = req.query.organizationId;
  }
  const queues = await Queue.find(orgScope(req.user, filter)).sort({ createdAt: -1 });
  return success(res, queues);
});

/**
 * POST /api/queues
 */
export const createQueue = asyncHandler(async (req, res) => {
  const { name, status, organizationId } = req.body || {};
  if (!name) throw ApiError.badRequest('name is required');

  let targetOrgId = organizationId;
  if (req.user.role === USER_ROLES.PLATFORM_ADMIN) {
    if (!targetOrgId) throw ApiError.badRequest('organizationId is required');
  } else {
    if (!req.user.organizationId) {
      throw ApiError.forbidden('You must belong to an organization to create queues');
    }
    targetOrgId = req.user.organizationId;
  }
  assertObjectId(targetOrgId, 'organizationId');

  const queue = await Queue.create({
    name,
    organizationId: targetOrgId,
    status: status || QUEUE_STATUSES.ACTIVE,
  });

  await logQueueCreated(queue, req.user);
  return created(res, queue);
});

/**
 * GET /api/queues/:id
 */
export const getQueue = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id);
  const queue = await Queue.findOne(orgScope(req.user, { _id: req.params.id }));
  if (!queue) throw ApiError.notFound('Queue not found');
  return success(res, queue);
});

/**
 * PATCH /api/queues/:id
 */
export const updateQueue = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id);
  const queue = await Queue.findOne(orgScope(req.user, { _id: req.params.id }));
  if (!queue) throw ApiError.notFound('Queue not found');

  // Staff are read-only on queues.
  if (req.user.role === USER_ROLES.STAFF) {
    throw ApiError.forbidden('Staff cannot modify queues');
  }

  const updatable = ['name', 'status'];
  const changes = {};
  for (const key of updatable) {
    if (key in (req.body || {})) {
      changes[key] = { from: queue[key], to: req.body[key] };
      queue[key] = req.body[key];
    }
  }
  await queue.save();

  await logQueueUpdated(queue, req.user, changes);
  return success(res, queue);
});

/**
 * DELETE /api/queues/:id
 */
export const deleteQueue = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id);
  const queue = await Queue.findOne(orgScope(req.user, { _id: req.params.id }));
  if (!queue) throw ApiError.notFound('Queue not found');

  if (req.user.role === USER_ROLES.STAFF) {
    throw ApiError.forbidden('Staff cannot delete queues');
  }

  await queue.deleteOne();
  await logQueueDeleted(queue, req.user);
  return noContent(res);
});

export default {
  listQueues,
  createQueue,
  getQueue,
  updateQueue,
  deleteQueue,
};
