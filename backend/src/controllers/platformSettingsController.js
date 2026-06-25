import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { success } from '../utils/apiResponse.js';
import PlatformSettings from '../models/PlatformSettings.js';

// ============================================================================
//  platformSettingsController — singleton GET/PATCH for /api/admin/settings
// ----------------------------------------------------------------------------
//  Authorization is enforced at the route layer (platform_admin only). Here
//  we just whitelist patchable fields so the document can't accept arbitrary
//  keys via the request body.
// ============================================================================

const TOP_LEVEL_FIELDS = [
  'platformName',
  'supportEmail',
  'defaultRegion',
  'systemTimeZone',
  'allowNewSignups',
  'maintenanceBannerEnabled',
  'maintenanceBannerMessage',
  'sessionTimeoutDays',
];

const PASSWORD_POLICY_FIELDS = [
  'minLength',
  'requireUppercase',
  'requireDigit',
  'requireSymbol',
];

/**
 * GET /api/admin/settings
 */
export const getSettings = asyncHandler(async (_req, res) => {
  const doc = await PlatformSettings.getSingleton();
  return success(res, doc);
});

/**
 * PATCH /api/admin/settings
 * Body: { ...fields, passwordPolicy?: {...} }
 *
 * Unknown keys are silently dropped so the API surface stays additive-safe.
 * Mongoose schema validators run on save and produce 400s via the global
 * error handler.
 */
export const updateSettings = asyncHandler(async (req, res) => {
  const body = req.body || {};
  if (typeof body !== 'object' || Array.isArray(body)) {
    throw ApiError.badRequest('Request body must be an object');
  }

  const doc = await PlatformSettings.getSingleton();

  for (const key of TOP_LEVEL_FIELDS) {
    if (key in body) doc[key] = body[key];
  }

  // Nested passwordPolicy. PATCH semantics: only override the fields the
  // client explicitly sent; preserve everything else on the sub-document.
  if (body.passwordPolicy && typeof body.passwordPolicy === 'object') {
    for (const k of PASSWORD_POLICY_FIELDS) {
      if (k in body.passwordPolicy) {
        doc.passwordPolicy[k] = body.passwordPolicy[k];
      }
    }
  }

  doc.updatedBy = req.user?._id || null;
  await doc.save();

  return success(res, doc);
});

export default { getSettings, updateSettings };
