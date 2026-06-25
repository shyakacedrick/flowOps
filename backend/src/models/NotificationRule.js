import mongoose from 'mongoose';

// ============================================================================
//  NotificationRule — admin-curated platform alert routing
// ----------------------------------------------------------------------------
//  Each rule says "when event of type X happens, dispatch a notification to
//  channel Y at severity Z, optionally to address `target`". The actual
//  dispatch wiring lives outside this model (a follow-up release); for now
//  this is the configuration surface so admins can declare intent.
//
//  Why a flat collection (not embedded on PlatformSettings):
//    - Rules grow over time and we want an admin to add/remove without
//      shipping schema changes.
//    - Audit trail (updatedBy / updatedAt) is per-rule.
//
//  `key` is the immutable machine-name. `eventType` is the upstream
//  ACTIVITY_TYPES value the rule listens to — kept as a free-form string so
//  callers don't have to import ACTIVITY_TYPES here and create a cycle.
// ============================================================================

export const NOTIFICATION_CHANNELS = Object.freeze([
  'email',
  'slack',
  'pagerduty',
  'webhook',
]);

export const NOTIFICATION_SEVERITIES = Object.freeze([
  'info',
  'warning',
  'critical',
]);

// Lower-snake-case so rule keys are stable identifiers across releases.
const KEY_PATTERN = /^[a-z][a-z0-9_]{1,63}$/;

const notificationRuleSchema = new mongoose.Schema(
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
    label: {
      type: String,
      required: [true, 'label is required'],
      trim: true,
      maxlength: [120, 'label must be at most 120 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [280, 'description must be at most 280 characters'],
      default: '',
    },
    // Optional pointer to an ACTIVITY_TYPES value the rule fires on.
    // Empty string = "any event" so the rule is just an output channel
    // configuration the admin can attach manually elsewhere.
    eventType: {
      type: String,
      trim: true,
      maxlength: [80, 'eventType must be at most 80 characters'],
      default: '',
    },
    channel: {
      type: String,
      enum: {
        values: NOTIFICATION_CHANNELS,
        message: 'channel must be one of: {VALUES}',
      },
      default: 'email',
      lowercase: true,
      trim: true,
    },
    severity: {
      type: String,
      enum: {
        values: NOTIFICATION_SEVERITIES,
        message: 'severity must be one of: {VALUES}',
      },
      default: 'info',
      lowercase: true,
      trim: true,
    },
    // For channel='email' an email; for 'slack' a webhook URL or channel
    // name; for 'webhook' a URL; for 'pagerduty' a service key. Validated
    // loosely here — strict validation happens at dispatch time once we
    // know the channel.
    target: {
      type: String,
      trim: true,
      maxlength: [500, 'target must be at most 500 characters'],
      default: '',
    },
    enabled: {
      type: Boolean,
      default: true,
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

const NotificationRule = mongoose.model('NotificationRule', notificationRuleSchema);
export default NotificationRule;
