import { ROLES, useAuth } from '../auth/AuthContext.jsx';
import BusinessOwnerDashboard from '../dashboards/BusinessOwnerDashboard.jsx';
import StaffDashboard from '../dashboards/StaffDashboard.jsx';
import AdminDashboard from '../dashboards/AdminDashboard.jsx';

/**
 * Renders the role-specific dashboard. Auth guard is handled by
 * <PrivateRoute> in App.jsx — unauthenticated visitors never reach here.
 */
export default function DashboardPage() {
  const { role } = useAuth();

  switch (role) {
    case ROLES.BUSINESS_OWNER:
      return <BusinessOwnerDashboard />;
    case ROLES.STAFF:
      return <StaffDashboard />;
    case ROLES.ADMIN:
      return <AdminDashboard />;
    default:
      return null;
  }
}
