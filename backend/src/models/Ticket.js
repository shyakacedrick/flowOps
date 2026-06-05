import mongoose from 'mongoose';

export const TICKET_STATUSES = Object.freeze({
  WAITING: 'waiting',
  SERVING: 'serving',
  SERVED: 'served',
  SKIPPED: 'skipped',
  CANCELLED: 'cancelled',
});

const ticketSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      required: true,
      trim: true,
    },
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      minlength: [1, 'Customer name must not be empty'],
      maxlength: [120, 'Customer name must be at most 120 characters'],
    },
    queueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Queue',
      required: [true, 'queueId is required'],
      index: true,
    },
    /**
     * Denormalized for fast org-scoped queries (BI, activity feeds, etc.).
     * Always set from the parent queue at creation time.
     */
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: Object.values(TICKET_STATUSES),
        message: 'Status must be one of: {VALUES}',
      },
      default: TICKET_STATUSES.WAITING,
      index: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    servedAt: {
      type: Date,
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

// Tickets are uniquely numbered within a queue.
ticketSchema.index({ queueId: 1, ticketNumber: 1 }, { unique: true });

const Ticket = mongoose.model('Ticket', ticketSchema);
export default Ticket;
