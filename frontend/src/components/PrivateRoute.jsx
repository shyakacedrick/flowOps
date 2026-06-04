import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

/**
 * Wraps a route element so unauthenticated visitors are redirected to /login.
 * Use this instead of inline auth checks in page components.
 *
 *   <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
 */
export default function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}
