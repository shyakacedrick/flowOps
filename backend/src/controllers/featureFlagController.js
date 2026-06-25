import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { success, created, noContent } from '../utils/apiResponse.js';
import FeatureFlag, { FEATURE_FLAG_STAGES } from '../models/FeatureFlag.js';

// ============================================================================
//  featureFlagController — admin CRUD for /api/admin/feature-flags
// ----------------------------------------------------------------------------
//  All endpoints here are platform-admin only; authorization is enforced at
//  the route layer.
// ============================================================================

const KEY_PATTERN = /^[a-z][a-z0-9_]{1,63}$/;

/**
 * GET /api/admin/feature-flags
 * Returns every flag, sorted alphabetically for stable rendering.
 */
export const listFlags = asyncHandler(async (_req, res) => {
  const flags = await FeatureFlag.find({}).sort({ key: 1 });
  return success(res, flags);
});

/**
 * POST /api/admin/feature-flags
 * Body: { key, description?, stage?, enabled? }
 * Conflict (409) when the key already exists.
 */
export const createFlag = asyncHandler(async (req, res) => {
  const { key, description, stage, enabled } = req.body || {};
  if (!key || typeof key !== 'string') {
    throw ApiError.badRequest('key is required');
  }
  const normalized = key.trim().toLowerCase();
  if (!KEY_PATTERN.test(normalized)) {
    throw ApiError.badRequest('key must be lowercase snake_case, 2-64 chars');
  }
  if (stage && !FEATURE_FLAG_STAGES.includes(stage)) {
    throw ApiError.badRequest(`stage must be one of: ${FEATURE_FLAG_STAGES.join(', ')}`);
  }

  const existing = await FeatureFlag.findOne({ key: normalized });
  if (existing) throw ApiError.conflict('A flag with that key already exists');

  const flag = await FeatureFlag.create({
    key: normalized,
    description: description || '',
    stage: stage || 'internal',
    enabled: !!enabled,
    updatedBy: req.user?._id || null,
  });
  return created(res, flag);
});

/**
 * PATCH /api/admin/feature-flags/:key
 * Body: { description?, stage?, enabled? }
 * The `key` itself is immutable — changing it would break any consumer
 * already referencing the old name.
 */
export const updateFlag = asyncHandler(async (req, res) => {
  const key = String(req.params.key || '').trim().toLowerCase();
  if (!KEY_PATTERN.test(key)) throw ApiError.badRequest('Invalid flag key');

  const flag = await FeatureFlag.findOne({ key });
  if (!flag) throw ApiError.notFound('Feature flag not found');

  const body = req.body || {};
  if ('description' in body) flag.description = body.description || '';
  if ('enabled'     in body) flag.enabled     = !!body.enabled;
  if ('stage'       in body) {
    if (!FEATURE_FLAG_STAGES.includes(body.stage)) {
      throw ApiError.badRequest(`stage must be one of: ${FEATURE_FLAG_STAGES.join(', ')}`);
    }
    flag.stage = body.stage;
  }
  flag.updatedBy = req.user?._id || null;
  await flag.save();
  return success(res, flag);
});

/**
 * DELETE /api/admin/feature-flags/:key
 */
export const deleteFlag = asyncHandler(async (req, res) => {
  const key = String(req.params.key || '').trim().toLowerCase();
  if (!KEY_PATTERN.test(key)) throw ApiError.badRequest('Invalid flag key');

  const result = await FeatureFlag.findOneAndDelete({ key });
  if (!result) throw ApiError.notFound('Feature flag not found');
  return noContent(res);
});

export default { listFlags, createFlag, updateFlag, deleteFlag };
