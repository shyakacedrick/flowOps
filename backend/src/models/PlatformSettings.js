import mongoose from 'mongoose';

// ============================================================================
//  PlatformSettings — singleton document
// ----------------------------------------------------------------------------
//  Holds platform-wide configuration shown on the admin Settings page.
//  Modeled as a single doc (any number of writes, exactly one read target)
//  so the controller can do `findOneAndUpdate({}, ..., { upsert: true })`
//  without juggling ids.
//
//  Fields are intentionally a small subset of what the UI advertises — only
//  the platform-section controls actually persist today. Authentication,
//  notifications, security policies and role permissions still ship as
//  "coming soon" scaffolding until their underlying systems land.
// ============================================================================

const passwordPolicySchema = new mongoose.Schema(
  {
    minLength: {
      type: Number,
      min: [6, 'minLength must be ≥ 6'],
      max: [128, 'minLength must be ≤ 128'],
      default: 12,
    },
    requireUppercase: { type: Boolean, default: true },
    requireDigit:     { type: Boolean, default: true },
    requireSymbol:    { type: Boolean, default: false },
  },
  { _id: false }
);

const platformSettingsSchema = new mongoose.Schema(
  {
    platformName: {
      type: String,
      trim: true,
      maxlength: [80, 'platformName must be at most 80 characters'],
      default: 'FlowOps',
    },
    supportEmail: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: [120, 'supportEmail must be at most 120 characters'],
      // Loose check — controller does the strict validation on PATCH.
      match: [/^\S+@\S+\.\S+$/, 'supportEmail must be a valid email'],
      default: 'support@flowops.app',
    },
    defaultRegion: {
      type: String,
      trim: true,
      maxlength: [80, 'defaultRegion must be at most 80 characters'],
      default: 'US-East · Virginia',
    },
    systemTimeZone: {
      type: String,
      trim: true,
      maxlength: [80, 'systemTimeZone must be at most 80 characters'],
      default: 'UTC',
    },
    allowNewSignups: {
      type: Boolean,
      default: true,
    },
    maintenanceBannerEnabled: {
      type: Boolean,
      default: false,
    },
    maintenanceBannerMessage: {
      type: String,
      trim: true,
      maxlength: [280, 'maintenanceBannerMessage must be at most 280 characters'],
      default: '',
    },
    passwordPolicy: {
      type: passwordPolicySchema,
      default: () => ({}),
    },
    sessionTimeoutDays: {
      type: Number,
      min: [1, 'sessionTimeoutDays must be ≥ 1'],
      max: [365, 'sessionTimeoutDays must be ≤ 365'],
      default: 14,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

/**
 * Fetch the singleton document, creating defaults on first read. Use this
 * everywhere instead of `findOne({})` so callers never need to worry about
 * the document existing.
 */
platformSettingsSchema.statics.getSingleton = async function getSingleton() {
  let doc = await this.findOne({});
  if (!doc) doc = await this.create({});
  return doc;
};

const PlatformSettings = mongoose.model('PlatformSettings', platformSettingsSchema);
export default PlatformSettings;
