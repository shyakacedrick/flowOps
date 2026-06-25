import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { success, created, noContent } from '../utils/apiResponse.js';
import NotificationRule, {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_SEVERITIES,
} from '../models/NotificationRule.js';

// ============================================================================
//  notificationRuleController — admin CRUD for /api/admin/notification-rules
// ----------------------------------------------------------------------------
//  Authorization is enforced at the route layer (platform_admin only).
// ============================================================================

const KEY_PATTERN = /^[a-z][a-z0-9_]{1,63}$/;

/**
 * GET /api/admin/notification-rules
 * Returns every rule sorted alphabetically by key for stable rendering.
 */
export const listRules = asyncHandler(async (_req, res) => {
  const rules = await NotificationRule.find({}).sort({ key: 1 });
  return success(res, rules);
});

/**
 * POST /api/admin/notification-rules
 * Body: { key, label, description?, eventType?, channel?, severity?, target?, enabled? }
 * 409 if a rule with the same key already exists.
 */
export const createRule = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const { key, label } = body;
  if (!key || typeof key !== 'string') throw ApiError.badRequest('key is required');
  if (!label || typeof label !== 'string') throw ApiError.badRequest('label is required');

  const normalizedKey = key.trim().toLowerCase();
  if (!KEY_PATTERN.test(normalizedKey)) {
    throw ApiError.badRequest('key must be lowercase snake_case, 2-64 chars');
  }
  if (body.channel && !NOTIFICATION_CHANNELS.includes(body.channel)) {
    throw ApiError.badRequest(`channel must be one of: ${NOTIFICATION_CHANNELS.join(', ')}`);
  }
  if (body.severity && !NOTIFICATION_SEVERITIES.includes(body.severity)) {
    throw ApiError.badRequest(`severity must be one of: ${NOTIFICATION_SEVERITIES.join(', ')}`);
  }

  const existing = await NotificationRule.findOne({ key: normalizedKey });
  if (existing) throw ApiError.conflict('A rule with that key already exists');

  const rule = await NotificationRule.create({
    key:         normalizedKey,
    label:       label.trim(),
    description: body.description || '',
    eventType:   body.eventType   || '',
    channel:     body.channel     || 'email',
    severity:    body.severity    || 'info',
    target:      body.target      || '',
    enabled:     body.enabled !== false,
    updatedBy:   req.user?._id || null,
  });
  return created(res, rule);
});

/**
 * PATCH /api/admin/notification-rules/:key
 * The `key` itself is immutable — changing it would break the audit trail.
 */
export const updateRule = asyncHandler(async (req, res) => {
  const key = String(req.params.key || '').trim().toLowerCase();
  if (!KEY_PATTERN.test(key)) throw ApiError.badRequest('Invalid rule key');

  const rule = await NotificationRule.findOne({ key });
  if (!rule) throw ApiError.notFound('Notification rule not found');

  const body = req.body || {};
  if ('label'       in body) rule.label       = String(body.label || '').trim() || rule.label;
  if ('description' in body) rule.description = body.description || '';
  if ('eventType'   in body) rule.eventType   = body.eventType   || '';
  if ('target'      in body) rule.target      = body.target      || '';
  if ('enabled'     in body) rule.enabled     = !!body.enabled;
  if ('channel'     in body) {
    if (!NOTIFICATION_CHANNELS.includes(body.channel)) {
      throw ApiError.badRequest(`channel must be one of: ${NOTIFICATION_CHANNELS.join(', ')}`);
    }
    rule.channel = body.channel;
  }
  if ('severity' in body) {
    if (!NOTIFICATION_SEVERITIES.includes(body.severity)) {
      throw ApiError.badRequest(`severity must be one of: ${NOTIFICATION_SEVERITIES.join(', ')}`);
    }
    rule.severity = body.severity;
  }
  rule.updatedBy = req.user?._id || null;
  await rule.save();
  return success(res, rule);
});

/**
 * DELETE /api/admin/notification-rules/:key
 */
export const deleteRule = asyncHandler(async (req, res) => {
  const key = String(req.params.key || '').trim().toLowerCase();
  if (!KEY_PATTERN.test(key)) throw ApiError.badRequest('Invalid rule key');

  const result = await NotificationRule.findOneAndDelete({ key });
  if (!result) throw ApiError.notFound('Notification rule not found');
  return noContent(res);
});

export default { listRules, createRule, updateRule, deleteRule };
