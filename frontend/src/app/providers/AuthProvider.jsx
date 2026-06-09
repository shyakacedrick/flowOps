// ============================================================================
//  AuthProvider — real-backed session
// ----------------------------------------------------------------------------
//  Single source of truth for "who is signed in" across the app.
//  Wired to the backend via `services/authApi`:
//    - signIn(user)  → caller already obtained `user` from authApi.login/register
//                     (token is persisted by authApi via setAuthToken)
//    - signOut()     → clears local session AND the bearer token
//
//  On mount, if a JWT is present in localStorage we re-validate it against
//  GET /api/auth/me so a stale or revoked token doesn't leave the UI in a
//  ghost-logged-in state on refresh.
// ============================================================================

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getAuthToken, setAuthToken } from '@/services/api.js';
import authApi from '@/services/authApi.js';

// NOTE: values intentionally match the backend USER_ROLES enum
// (see backend/src/models/User.js). Keep them in sync.
export const ROLES = {
  BUSINESS_OWNER: 'business_owner',
  STAFF:          'staff',
  ADMIN:          'platform_admin',
};

export const ROLE_META = {
  [ROLES.BUSINESS_OWNER]: {
    label: 'Business Owner',
    workspace: 'Operations Analytics',
  },
  [ROLES.STAFF]: {
    label: 'Staff Operator',
    workspace: 'Live Queue Console',
  },
  [ROLES.ADMIN]: {
    label: 'Platform Admin',
    workspace: 'System Overview',
  },
};

const STORAGE_KEY = 'flowops.session';

const AuthContext = createContext(null);

const sessionFromUser = (user) => ({
  role: user.role,
  signedInAt: new Date().toISOString(),
  displayName: user.name || user.email || 'User',
  email: user.email,
  userId: user.id || user._id,
  organizationId: user.organizationId || null,
  user, // keep raw payload for future consumers
});

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
    
  });
  // `isBootstrapping` is true while we re-validate an existing token
  // against the backend. PrivateRoute waits for this to settle so it
  // doesn't bounce an authenticated user to /login on hard refresh.
  const [isBootstrapping, setIsBootstrapping] = useState(() =>
    typeof window !== 'undefined' && Boolean(getAuthToken())
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (session) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // QuotaExceededError in private browsing or storage-full scenarios — non-fatal.
    }
  }, [session]);

  // Hydrate from the server on first mount when a JWT is present.
  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      const token = getAuthToken();
      if (!token) {
        // No token → nothing to validate. Make sure any orphan session is cleared.
        if (session) setSession(null);
        setIsBootstrapping(false);
        return;
      }

      const res = await authApi.me();
      if (cancelled) return;

      if (res.ok && res.data?.user) {
        setSession(sessionFromUser(res.data.user));
      } else {
        // Token is invalid / expired / revoked. Clean up.
        setAuthToken(null);
        setSession(null);
      }
      setIsBootstrapping(false);
    };

    hydrate();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * signIn(user) — accepts the raw user object returned by the backend
   * (see backend/src/controllers/authController.js → buildAuthPayload).
   * Caller is responsible for having already stored the token via authApi.
   */
  const signIn = useCallback((user) => {
    if (!user || !user.role) return;
    setSession(sessionFromUser(user));
  }, []);

  const signOut = useCallback(async () => {
    // Tell the server to blacklist this access token + revoke the refresh
    // cookie. authApi.logout() clears the local token in its `finally` block
    // so we don't need to do it here. Failures are non-fatal — the user
    // should still end up logged out locally.
    try {
      await authApi.logout();
    } catch {
      setAuthToken(null);
    }
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({
      session,
      role: session?.role ?? null,
      isAuthenticated: Boolean(session),
      isBootstrapping,
      signIn,
      signOut,
    }),
    [session, isBootstrapping, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}