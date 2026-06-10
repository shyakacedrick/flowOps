// ============================================================================
//  storage — canonical localStorage keys
// ----------------------------------------------------------------------------
//  Anything that reads/writes `window.localStorage` should import from here.
//  Hard-coded string literals scattered across files de-sync silently when
//  one location is renamed and the other isn't — these constants stop that.
// ============================================================================

export const STORAGE_KEYS = Object.freeze({
  TOKEN:   'flowops.token',   // JWT access token (api.js)
  SESSION: 'flowops.session', // denormalized session blob (AuthProvider.jsx)
});

export default STORAGE_KEYS;
