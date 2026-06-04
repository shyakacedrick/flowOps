import { Navigate } from 'react-router-dom';
import { ROLES, useAuth } from '../auth/AuthContext.jsx';
import BusinessOwnerDashboard from '../dashboards/BusinessOwnerDashboard.jsx';

/**
 * Renders the role-specific dashboard. Auth guard is handled by
 * <PrivateRoute> in App.jsx — unauthenticated visitors never reach here.
 *
 * Staff operators have a dedicated /staff/* workspace and are redirected
 * to its dashboard entry point.
 */
export default function DashboardPage() {
  const { role } = useAuth();

  switch (role) {
    case ROLES.BUSINESS_OWNER:
      return <BusinessOwnerDashboard />;
    case ROLES.STAFF:
      return <Navigate to="/staff/dashboard" replace />;
    case ROLES.ADMIN:
      return <Navigate to="/admin/overview" replace />;
    default:
      return null;
  }
}
