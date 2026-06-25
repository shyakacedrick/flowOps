import mongoose from 'mongoose';
import { ORGANIZATION_PLANS } from './Organization.js';

// ============================================================================
//  Subscription — billing state for an Organization
// ----------------------------------------------------------------------------
//  One subscription per org (unique on organizationId). Decouples billing
//  concerns from the Organization document while still mirroring `plan`
//  back onto Organization.plan so existing code that reads `org.plan`
//  keeps working without join queries.
//
//  Status semantics (free-text would be sloppy; the enum below is the
//  contract the admin UI renders against):
//    trialing  – on a free trial, will auto-convert to active
//    active    – paid + current
//    past_due  – payment failed, grace period
//    paused    – owner-initiated pause (e.g. seasonal business)
//    cancelled – terminated; access can still continue until period end
//
//  The `external*` fields are placeholders for a future Stripe integration
//  — they're optional and unindexed so adding/removing them later is cheap.
// ============================================================================

export const SUBSCRIPTION_STATUSES = Object.freeze([
  'trialing',
  'active',
  'past_due',
  'paused',
  'cancelled',
]);

// Default monthly prices in USD cents, used to seed new subscriptions and
// to compute MRR when an admin hasn't overridden the price. Kept in code
// because pricing is platform-policy, not per-tenant — admins can still
// override on a case-by-case basis via PATCH.
export const PLAN_DEFAULT_PRICE_CENTS = Object.freeze({
  starter: 0,
  growth:  4900,
  scale:   19900,
});

const subscriptionSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'organizationId is required'],
      unique: true,
      index: true,
    },
    plan: {
      type: String,
      enum: {
        values: ORGANIZATION_PLANS,
        message: 'plan must be one of: {VALUES}',
      },
      default: 'starter',
      lowercase: true,
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: SUBSCRIPTION_STATUSES,
        message: 'status must be one of: {VALUES}',
      },
      default: 'trialing',
      lowercase: true,
      trim: true,
      index: true,
    },
    // Per-tenant monthly price override. When null, the platform uses
    // PLAN_DEFAULT_PRICE_CENTS[plan] for MRR aggregation.
    monthlyPriceCents: {
      type: Number,
      min: [0, 'monthlyPriceCents cannot be negative'],
      max: [10_000_000, 'monthlyPriceCents must be reasonable'],
      default: null,
    },
    currency: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 3,
      minlength: 3,
      default: 'USD',
    },
    seats: {
      type: Number,
      min: [0, 'seats cannot be negative'],
      max: [10_000, 'seats must be reasonable'],
      default: 1,
    },
    currentPeriodStart: { type: Date, default: null },
    currentPeriodEnd:   { type: Date, default: null },
    trialEndsAt:        { type: Date, default: null },
    cancelledAt:        { type: Date, default: null },
    // Free-text admin note (e.g. "negotiated NGO discount").
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
    externalCustomerId:     { type: String, trim: true, default: '' },
    externalSubscriptionId: { type: String, trim: true, default: '' },
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

// Effective monthly price helper. Pure read; safe to call on lean docs as
// long as the caller passes the right shape.
subscriptionSchema.methods.effectiveMonthlyCents = function effective() {
  if (this.monthlyPriceCents !== null && this.monthlyPriceCents !== undefined) {
    return this.monthlyPriceCents;
  }
  return PLAN_DEFAULT_PRICE_CENTS[this.plan] ?? 0;
};

const Subscription = mongoose.model('Subscription', subscriptionSchema);
export default Subscription;
