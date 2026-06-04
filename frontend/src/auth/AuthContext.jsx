import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/**
 * AuthContext — simulated multi-role auth.
 * No backend. Selected role persists to localStorage so refresh keeps you signed in.
 */

export const ROLES = {
  BUSINESS_OWNER: 'business_owner',
  STAFF:          'staff',
  ADMIN:          'admin',
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

  const signIn = useCallback((role) => {
    if (!Object.values(ROLES).includes(role)) return;
    setSession({
      role,
      signedInAt: new Date().toISOString(),
      // Plausible display name per role so the dashboard feels personal.
      displayName: {
        [ROLES.BUSINESS_OWNER]: 'Mira Patel',
        [ROLES.STAFF]:          'Jordan Lee',
        [ROLES.ADMIN]:          'Alex Hwang',
      }[role],
      orgName: {
        [ROLES.BUSINESS_OWNER]: 'Clarity Clinics',
        [ROLES.STAFF]:          'Clarity Clinics · Front Desk',
        [ROLES.ADMIN]:          'FlowOps Platform',
      }[role],
    });
  }, []);

  const signOut = useCallback(() => setSession(null), []);

  const value = useMemo(
    () => ({
      session,
      role: session?.role ?? null,
      isAuthenticated: Boolean(session),
      signIn,
      signOut,
    }),
    [session, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
