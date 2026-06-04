import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext.jsx';
import { SimulationProvider } from './engine/SimulationProvider.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import PrivateRoute from './components/PrivateRoute.jsx';

// Route-level code splitting — each chunk loads only when its route is visited.
const LandingPage      = lazy(() => import('./pages/LandingPage.jsx'));
const LoginPage        = lazy(() => import('./pages/LoginPage.jsx'));
const SignupPage       = lazy(() => import('./pages/SignupPage.jsx'));
const BookDemoPage     = lazy(() => import('./pages/BookDemoPage.jsx'));
const DashboardPage    = lazy(() => import('./pages/DashboardPage.jsx'));
const NotFoundPage     = lazy(() => import('./pages/NotFoundPage.jsx'));

// Owner workspace pages — each sidebar item is a real page.
const LiveQueuePage     = lazy(() => import('./pages/owner/LiveQueuePage.jsx'));
const OperationsPage    = lazy(() => import('./pages/owner/OperationsPage.jsx'));
const CustomerFeedPage  = lazy(() => import('./pages/owner/CustomerFeedPage.jsx'));
const AnalyticsPage     = lazy(() => import('./pages/owner/AnalyticsPage.jsx'));
const SmartInsightsPage = lazy(() => import('./pages/owner/SmartInsightsPage.jsx'));
const SchedulePage      = lazy(() => import('./pages/owner/SchedulePage.jsx'));
const SettingsPage      = lazy(() => import('./pages/owner/SettingsPage.jsx'));

// Staff operator workspace — operational console pages under /staff/*
const StaffDashboardPage    = lazy(() => import('./pages/staff/StaffDashboardPage.jsx'));
const MyQueuePage           = lazy(() => import('./pages/staff/MyQueuePage.jsx'));
const StaffCustomersPage    = lazy(() => import('./pages/staff/CustomersPage.jsx'));
const ServiceDeskPage       = lazy(() => import('./pages/staff/ServiceDeskPage.jsx'));
const ActivityFeedPage      = lazy(() => import('./pages/staff/ActivityFeedPage.jsx'));
const NotificationsPage     = lazy(() => import('./pages/staff/NotificationsPage.jsx'));
const StaffSchedulePage     = lazy(() => import('./pages/staff/SchedulePage.jsx'));
const StaffSettingsPage     = lazy(() => import('./pages/staff/StaffSettingsPage.jsx'));

// Platform Admin portal — enterprise command center under /admin/*
const AdminOverview            = lazy(() => import('./pages/admin/Overview.jsx'));
const AdminOrganizations       = lazy(() => import('./pages/admin/Organizations.jsx'));
const AdminUsers               = lazy(() => import('./pages/admin/Users.jsx'));
const AdminSubscriptions       = lazy(() => import('./pages/admin/Subscriptions.jsx'));
const AdminPlatformAnalytics   = lazy(() => import('./pages/admin/PlatformAnalytics.jsx'));
const AdminSystemMonitoring    = lazy(() => import('./pages/admin/SystemMonitoring.jsx'));
const AdminAuditLogs           = lazy(() => import('./pages/admin/AuditLogs.jsx'));
const AdminSupportCenter       = lazy(() => import('./pages/admin/SupportCenter.jsx'));
const AdminSettings            = lazy(() => import('./pages/admin/Settings.jsx'));

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

const guard = (el) => <PrivateRoute>{el}</PrivateRoute>;

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        {/*
          SimulationProvider mounts the centralized simulationEngine — the
          single source of truth for every queue event, KPI, activity log
          entry, chart point, AI insight, and subsystem status across the
          entire app. There is exactly ONE simulation per browser tab.
        */}
        <SimulationProvider>
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/book-demo" element={<BookDemoPage />} />

                {/* Owner workspace — sidebar nav drives these routes */}
                <Route path="/dashboard"      element={guard(<DashboardPage />)} />
                <Route path="/live-queue"     element={guard(<LiveQueuePage />)} />
                <Route path="/operations"     element={guard(<OperationsPage />)} />
                <Route path="/customer-feed"  element={guard(<CustomerFeedPage />)} />
                <Route path="/analytics"      element={guard(<AnalyticsPage />)} />
                <Route path="/smart-insights" element={guard(<SmartInsightsPage />)} />
                <Route path="/schedule"       element={guard(<SchedulePage />)} />
                <Route path="/settings"       element={guard(<SettingsPage />)} />

                {/* Staff operator workspace — operational console */}
                <Route path="/staff/dashboard"     element={guard(<StaffDashboardPage />)} />
                <Route path="/staff/my-queue"      element={guard(<MyQueuePage />)} />
                <Route path="/staff/customers"     element={guard(<StaffCustomersPage />)} />
                <Route path="/staff/service-desk"  element={guard(<ServiceDeskPage />)} />
                <Route path="/staff/activity-feed" element={guard(<ActivityFeedPage />)} />
                <Route path="/staff/notifications" element={guard(<NotificationsPage />)} />
                <Route path="/staff/schedule"      element={guard(<StaffSchedulePage />)} />
                <Route path="/staff/settings"      element={guard(<StaffSettingsPage />)} />

                {/* Platform admin portal */}
                <Route path="/admin/overview"            element={guard(<AdminOverview />)} />
                <Route path="/admin/organizations"       element={guard(<AdminOrganizations />)} />
                <Route path="/admin/users"               element={guard(<AdminUsers />)} />
                <Route path="/admin/subscriptions"       element={guard(<AdminSubscriptions />)} />
                <Route path="/admin/platform-analytics"  element={guard(<AdminPlatformAnalytics />)} />
                <Route path="/admin/system-monitoring"   element={guard(<AdminSystemMonitoring />)} />
                <Route path="/admin/audit-logs"          element={guard(<AdminAuditLogs />)} />
                <Route path="/admin/support-center"      element={guard(<AdminSupportCenter />)} />
                <Route path="/admin/settings"            element={guard(<AdminSettings />)} />

                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </SimulationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
