import mongoose from 'mongoose';

/**
 * Activity types the platform recognizes today. Stored as strings so we
 * can add new ones without a migration; the enum keeps writes consistent.
 */
export const ACTIVITY_TYPES = Object.freeze({
  USER_REGISTERED: 'user_registered',
  USER_LOGIN: 'user_login',
  ORGANIZATION_CREATED: 'organization_created',
  QUEUE_CREATED: 'queue_created',
  QUEUE_UPDATED: 'queue_updated',
  QUEUE_DELETED: 'queue_deleted',
  TICKET_CREATED: 'ticket_created',
  TICKET_SERVING: 'ticket_serving',
  TICKET_SERVED: 'ticket_served',
  TICKET_SKIPPED: 'ticket_skipped',
  TICKET_CANCELLED: 'ticket_cancelled',
});

const activitySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: {
        values: Object.values(ACTIVITY_TYPES),
        message: 'Activity type must be one of: {VALUES}',
      },
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      default: null,
      index: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    /**
     * Free-form structured payload (queueId, ticketId, before/after, etc.).
     * Kept loose so Analytics & Smart Insights engines can consume it later.
     */
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

activitySchema.index({ organizationId: 1, createdAt: -1 });

const Activity = mongoose.model('Activity', activitySchema);
export default Activity;
