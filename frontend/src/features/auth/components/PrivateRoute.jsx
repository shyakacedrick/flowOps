import { Navigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider.jsx';

/**
 * Wraps a route element so unauthenticated visitors are redirected to /login.
 * Use this instead of inline auth checks in page components.
 *
 *   <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
 *
 * While the AuthProvider is re-validating an existing token against the
 * backend (`isBootstrapping`), we render a tiny loader instead of bouncing
 * the user to /login — otherwise a hard refresh would always flash them
 * back to the login page before /me resolves.
 */
export default function PrivateRoute({ children }) {
  const { isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}
