import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import env from '../config/env.js';

export const USER_ROLES = Object.freeze({
  PLATFORM_ADMIN: 'platform_admin',
  BUSINESS_OWNER: 'business_owner',
  STAFF: 'staff',
});

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name must be at most 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [EMAIL_REGEX, 'Email is not valid'],
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: Object.values(USER_ROLES),
        message: 'Role must be one of: {VALUES}',
      },
      default: USER_ROLES.STAFF,
      required: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      default: null,
      index: true,
    },
    // Set when the user confirms their email via the verification link.
    // null means unverified; we still let unverified users sign in, but
    // UI surfaces a banner + certain admin actions can be gated on this.
    emailVerifiedAt: {
      type: Date,
      default: null,
    },
    // Per-user suspension. Set by platform admin via PATCH /api/users/:id.
    // While set, the auth middleware rejects all requests from this user.
    // Platform admins cannot be suspended (enforced in userController).
    suspendedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

/**
 * Hash a plain password using the configured bcrypt salt rounds.
 * Static so callers (e.g. controllers) don't need to know the cost.
 */
userSchema.statics.hashPassword = function hashPassword(plain) {
  return bcrypt.hash(plain, env.bcryptSaltRounds);
};

userSchema.methods.comparePassword = function comparePassword(plain) {
  if (!this.passwordHash) return Promise.resolve(false);
  return bcrypt.compare(plain, this.passwordHash);
};

const User = mongoose.model('User', userSchema);
export default User;
