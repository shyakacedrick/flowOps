import mongoose from 'mongoose';

/**
 * RefreshToken — long-lived rotating refresh tokens.
 *
 * Only the sha256 HASH of the raw token is stored. On rotation the
 * old document is marked `revokedAt = new Date()` and a fresh one is
 * issued. Mongo's TTL index drops expired documents automatically.
 */
const refreshTokenSchema = new mongoose.Schema(
  {
    tokenHash: { type: String, required: true, unique: true, index: true },
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    // Free-form context for debugging/abuse investigation. Never trust
    // these values for auth decisions.
    userAgent: { type: String, default: null },
    ip:        { type: String, default: null },
  },
  { timestamps: true }
);

// TTL: expired tokens are removed within the next sweep window.
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);
export default RefreshToken;
