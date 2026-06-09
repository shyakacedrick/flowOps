// ============================================================================
//  VerificationToken — single-use, hashed transactional token
// ----------------------------------------------------------------------------
//  Used for both email verification (`type: 'verify'`) and password reset
//  (`type: 'reset'`). The raw token is sent in the link; only its sha256
//  hash is stored, so a DB leak doesn't expose live tokens.
//
//  Lifecycle:
//    - Created with expiresAt → Mongo TTL index reaps automatically.
//    - `consumedAt` set on first successful use → prevents reuse.
//    - On a new request for the same (userId,type), older unconsumed
//      tokens are deleted by the caller (one live token at a time).
// ============================================================================

import mongoose from 'mongoose';
import crypto from 'crypto';

export const TOKEN_TYPES = Object.freeze({
  VERIFY_EMAIL:   'verify',
  PASSWORD_RESET: 'reset',
});

const verificationTokenSchema = new mongoose.Schema(
  {
    tokenHash: { type: String, required: true, unique: true, index: true },
    type: {
      type: String,
      enum: Object.values(TOKEN_TYPES),
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    consumedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

verificationTokenSchema.index({ userId: 1, type: 1 });

verificationTokenSchema.statics.generate = function generate() {
  const raw = crypto.randomBytes(32).toString('base64url');
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  return { raw, hash };
};

verificationTokenSchema.statics.hash = function hash(raw) {
  return crypto.createHash('sha256').update(String(raw)).digest('hex');
};

const VerificationToken = mongoose.model('VerificationToken', verificationTokenSchema);
export default VerificationToken;
