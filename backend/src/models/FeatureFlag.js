import mongoose from 'mongoose';

// ============================================================================
//  FeatureFlag — platform-wide rollout switches
// ----------------------------------------------------------------------------
//  Each flag is keyed by a stable machine-name (e.g. `smart_insights_v2`).
//  `stage` is editorial / display-only — it doesn't gate access, it just
//  tells admins where the feature is in its lifecycle so they can decide
//  whether to enable it for production traffic.
//
//  This is intentionally a flat key/value store — no per-org overrides yet.
//  When percentage-based rollouts are needed, add a `percent` + `overrides`
//  field; existing consumers can keep reading `enabled` as a boolean.
// ============================================================================

export const FEATURE_FLAG_STAGES = Object.freeze(['internal', 'beta', 'ga']);

// Flag keys are restricted to lowercase letters, digits and underscores so
// they can be safely used as object property names by frontend consumers.
const KEY_PATTERN = /^[a-z][a-z0-9_]{1,63}$/;

const featureFlagSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: [true, 'key is required'],
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
      match: [KEY_PATTERN, 'key must be lowercase snake_case, 2-64 chars'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [280, 'description must be at most 280 characters'],
      default: '',
    },
    stage: {
      type: String,
      enum: {
        values: FEATURE_FLAG_STAGES,
        message: 'stage must be one of: {VALUES}',
      },
      default: 'internal',
      lowercase: true,
      trim: true,
    },
    enabled: {
      type: Boolean,
      default: false,
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

const FeatureFlag = mongoose.model('FeatureFlag', featureFlagSchema);
export default FeatureFlag;
