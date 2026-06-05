import mongoose from 'mongoose';

export const QUEUE_STATUSES = Object.freeze({
  ACTIVE: 'active',
  PAUSED: 'paused',
  CLOSED: 'closed',
});

const queueSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Queue name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [120, 'Name must be at most 120 characters'],
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'organizationId is required'],
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: Object.values(QUEUE_STATUSES),
        message: 'Status must be one of: {VALUES}',
      },
      default: QUEUE_STATUSES.ACTIVE,
    },
    /**
     * Monotonic counter used to generate human-friendly ticket numbers
     * for tickets in this queue (e.g. A001, A002...). Tickets bump this
     * atomically via $inc so numbers are unique per queue.
     */
    ticketCounter: {
      type: Number,
      default: 0,
      min: 0,
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

const Queue = mongoose.model('Queue', queueSchema);
export default Queue;
