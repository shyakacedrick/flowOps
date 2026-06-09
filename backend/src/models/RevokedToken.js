import mongoose from 'mongoose';

/**
 * RevokedToken — access-token blacklist.
 *
 * We store the `jti` of access tokens that have been explicitly logged
 * out. The auth middleware checks this set before trusting any token.
 *
 * Mongo's TTL index drops entries once the original token would have
 * expired anyway — so the collection stays bounded and small.
 */
const revokedTokenSchema = new mongoose.Schema(
  {
    jti:       { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true },
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reason:    { type: String, default: 'logout' },
  },
  { timestamps: true }
);

revokedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RevokedToken = mongoose.model('RevokedToken', revokedTokenSchema);
export default RevokedToken;
