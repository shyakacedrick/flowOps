import mongoose from 'mongoose';
import crypto from 'crypto';

/**
 * Invite — single-use signup link for joining an existing organization.
 *
 * Lifecycle:
 *   1. Owner creates invite → token + email + role + organizationId
 *   2. Recipient opens /invite/:token → reviews org name + role
 *   3. Recipient POSTs name + password to accept → new User created with
 *      the embedded role/organizationId; invite is marked accepted.
 *
 * Tokens are 32 random bytes (base64url), so guessing one is infeasible.
 * Expired or already-accepted invites are rejected by the controller.
 */

const INVITE_ROLES = Object.freeze(['business_owner', 'staff']);

const inviteSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      enum: {
        values: INVITE_ROLES,
        message: 'Invite role must be one of: {VALUES}',
      },
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
    acceptedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    revokedAt: {
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

inviteSchema.index({ organizationId: 1, createdAt: -1 });

/**
 * Mint a URL-safe random token. 32 bytes → 43-char base64url string.
 */
inviteSchema.statics.generateToken = function generateToken() {
  return crypto.randomBytes(32).toString('base64url');
};

inviteSchema.virtual('status').get(function status() {
  if (this.acceptedAt) return 'accepted';
  if (this.revokedAt) return 'revoked';
  if (this.expiresAt && this.expiresAt < new Date()) return 'expired';
  return 'pending';
});

const Invite = mongoose.model('Invite', inviteSchema);
export { INVITE_ROLES };
export default Invite;
