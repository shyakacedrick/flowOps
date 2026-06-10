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
import { STORAGE_KEYS } from '@/shared/constants/storage.js';

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

const STORAGE_KEY = STORAGE_KEYS.SESSION;

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
        // Preserve the original `signedInAt` from the persisted session so
        // re-hydration doesn't churn the localStorage payload (and trigger
        // `storage` events in other tabs / DevTools panels).
        setSession((prev) => {
          const next = sessionFromUser(res.data.user);
          if (prev?.signedInAt) next.signedInAt = prev.signedInAt;
          return next;
        });
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

  // ── Cross-tab + global auth-expiry sync ─────────────────────────────────
  // 1. `storage` events fire when *another* tab writes to localStorage. If
  //    a second tab signs in/out (or signs in as a different user), we
  //    reload so this tab can't keep operating on the now-stale session.
  //    IMPORTANT: only reload when the user *identity* changes — not on
  //    every write. Re-hydration after a page load rewrites the session
  //    blob (same user, refreshed timestamps); reloading on those would
  //    create a multi-tab reload loop.
  // 2. `flowops:auth-expired` is dispatched by services/api.js when a token
  //    refresh fails. Without this listener the UI would happily keep
  //    rendering signed-in chrome until the next API call returned 401.
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const identityFromSessionJSON = (raw) => {
      if (!raw) return null;
      try {
        const parsed = JSON.parse(raw);
        return parsed?.userId || parsed?.user?._id || parsed?.user?.id || null;
      } catch {
        return null;
      }
    };

    const onStorage = (e) => {
      // Only react to *cross-tab* writes that change something we care about.
      if (e.storageArea && e.storageArea !== window.localStorage) return;

      if (e.key === STORAGE_KEYS.TOKEN) {
        // Token value swapped (sign-in/out in another tab). A null → value
        // or value → null transition matters; value → same-value doesn't.
        if (e.oldValue === e.newValue) return;
        window.location.reload();
        return;
      }

      if (e.key === STORAGE_KEYS.SESSION) {
        // Re-hydration rewrites the session blob with the same userId but
        // (potentially) a fresh `signedInAt`. Only reload if the underlying
        // user identity actually changed — otherwise we'd loop endlessly.
        const oldId = identityFromSessionJSON(e.oldValue);
        const newId = identityFromSessionJSON(e.newValue);
        if (oldId === newId) return;
        window.location.reload();
      }
    };
    const onExpired = () => {
      setAuthToken(null);
      setSession(null);
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('flowops:auth-expired', onExpired);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('flowops:auth-expired', onExpired);
    };
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
    // cookie. Failures are non-fatal — the user should still end up logged
    // out locally, so we always clear the token + session afterwards.
    try {
      await authApi.logout();
    } catch {
      /* network error — ignore; local cleanup still runs below */
    }
    setAuthToken(null);
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