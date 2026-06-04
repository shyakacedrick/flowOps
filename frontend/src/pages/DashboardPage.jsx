import { Navigate } from 'react-router-dom';
import { ROLES, useAuth } from '../auth/AuthContext.jsx';
import BusinessOwnerDashboard from '../dashboards/BusinessOwnerDashboard.jsx';
import StaffDashboard from '../dashboards/StaffDashboard.jsx';
import AdminDashboard from '../dashboards/AdminDashboard.jsx';

/**
 * Renders a role-specific dashboard. Unauthenticated users are bounced to /login.
 */
export default function DashboardPage() {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  switch (role) {
    case ROLES.BUSINESS_OWNER:
      return <BusinessOwnerDashboard />;
    case ROLES.STAFF:
      return <StaffDashboard />;
    case ROLES.ADMIN:
      return <AdminDashboard />;
    default:
      return <Navigate to="/login" replace />;
  }
}
