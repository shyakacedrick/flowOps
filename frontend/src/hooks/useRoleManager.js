// ============================================================================
//  useRoleManager — role-aware façade over AuthContext
// ----------------------------------------------------------------------------
//  Adds derived helpers (isStaff / isOwner / isAdmin) so dashboards can
//  branch on role without re-importing the ROLES enum everywhere.
// ============================================================================

import { useMemo } from 'react';
import { ROLES, useAuth } from '../auth/AuthContext.jsx';

export function useRoleManager() {
  const { session, signIn, signOut } = useAuth();
  const role = session?.role ?? null;

  return useMemo(() => ({
    role,
    session,
    isAuthenticated: Boolean(session),
    isStaff: role === ROLES.STAFF,
    isOwner: role === ROLES.BUSINESS_OWNER,
    isAdmin: role === ROLES.ADMIN,
    signIn,
    signOut,
  }), [role, session, signIn, signOut]);
}

export { ROLES };
