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
    /**
     * Set when a ticket transitions to `serving`. Used together with
     * `servedAt` to compute true handle-time (serve duration) and per-staff
     * efficiency rankings, instead of conflating it with wait-time.
     */
    servingStartedAt: {
      type: Date,
      default: null,
    },
    /**
     * User who picked up the ticket (set on transition to `serving`).
     * Lets analytics attribute served counts and handle-time to the
     * specific staff member. Null for public-joined tickets that have
     * never been called by anyone.
     */
    servedById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    servedAt: {
      type: Date,
      default: null,
    },
    /**
     * Soft-delete tombstone. Set when a ticket is explicitly removed
     * (e.g. queue purge). Hidden from all standard reads. Kept in the
     * collection so historical activity entries that reference this
     * ticket id remain meaningful.
     */
    deletedAt: {
      type: Date,
      default: null,
      index: true,
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
