import { Navigate } from 'react-router-dom';
import { ROLES, useAuth } from '@/app/providers/AuthProvider.jsx';
import { ROUTES } from '@/shared/constants/routes.js';

/**
 * Home route for a given role — used to bounce a signed-in user away from
 * pages they aren't allowed to see (instead of letting the backend 403 and
 * making it look like a permission bug).
 */
export function homeForRole(role) {
  if (role === ROLES.ADMIN)          return ROUTES.admin.overview;
  if (role === ROLES.STAFF)          return ROUTES.staff.dashboard;
  if (role === ROLES.BUSINESS_OWNER) return ROUTES.owner.dashboard;
  return ROUTES.landing;
}

/**
 * Wraps a route element so unauthenticated visitors are redirected to /login.
 * Use this instead of inline auth checks in page components.
 *
 *   <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
 *
 * Optional `roles` prop restricts the route to specific role(s). A signed-in
 * user with the wrong role is bounced to *their* home route — not /login —
 * so they don't lose their session. This prevents the "owner clicks admin
 * link → backend returns 403 → looks like a bug" failure mode.
 *
 * While the AuthProvider is re-validating an existing token against the
 * backend (`isBootstrapping`), we render a tiny loader instead of bouncing
 * the user to /login — otherwise a hard refresh would always flash them
 * back to the login page before /me resolves.
 */
export default function PrivateRoute({ children, roles }) {
  const { isAuthenticated, isBootstrapping, role } = useAuth();

  if (isBootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to={ROUTES.login} replace />;

  if (roles && roles.length > 0 && !roles.includes(role)) {
    return <Navigate to={homeForRole(role)} replace />;
  }

  return children;
}
