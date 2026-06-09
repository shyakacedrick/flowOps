// ============================================================================
//  AppRouter — single source of truth for every URL in the app
// ----------------------------------------------------------------------------
//  Routes are organized by audience:
//    PUBLIC          — landing + auth funnel
//    OWNER           — /dashboard, /live-queue, /operations, …
//    STAFF           — /staff/*
//    ADMIN           — /admin/*
//
//  Every authenticated route is wrapped in <PrivateRoute>. Page chrome is
//  applied per-page via the layout wrappers inside each page file (today)
//  or via the role layouts in @/app/layouts/* (canonical).
//
//  Code-splitting: every page is lazy-loaded so first paint stays cheap.
// ============================================================================

import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import PrivateRoute from '@/features/auth/components/PrivateRoute.jsx';
import { ROUTES } from '@/shared/constants/routes.js';

// ── Public ────────────────────────────────────────────────────────────────
const LandingPage  = lazy(() => import('@/features/marketing/pages/LandingPage.jsx'));
const LoginPage    = lazy(() => import('@/features/auth/pages/LoginPage.jsx'));
const SignupPage   = lazy(() => import('@/features/auth/pages/SignupPage.jsx'));
const BookDemoPage = lazy(() => import('@/features/marketing/pages/BookDemoPage.jsx'));
const NotFoundPage = lazy(() => import('@/features/marketing/pages/NotFoundPage.jsx'));
const JoinQueuePage = lazy(() => import('@/features/public/pages/JoinQueuePage.jsx'));
const AcceptInvitePage = lazy(() => import('@/features/auth/pages/AcceptInvitePage.jsx'));

// ── Owner workspace ───────────────────────────────────────────────────────
const DashboardPage     = lazy(() => import('@/features/dashboard/pages/DashboardPage.jsx'));
const LiveQueuePage     = lazy(() => import('@/features/queue/pages/LiveQueuePage.jsx'));
const OperationsPage    = lazy(() => import('@/features/operations/pages/OperationsPage.jsx'));
const CustomerFeedPage  = lazy(() => import('@/features/customer-feed/pages/CustomerFeedPage.jsx'));
const AnalyticsPage     = lazy(() => import('@/features/analytics/pages/AnalyticsPage.jsx'));
const SmartInsightsPage = lazy(() => import('@/features/smart-insights/pages/SmartInsightsPage.jsx'));
const SchedulePage      = lazy(() => import('@/features/schedule/pages/OwnerSchedulePage.jsx'));
const SettingsPage      = lazy(() => import('@/features/settings/pages/OwnerSettingsPage.jsx'));

// ── Staff operator console ────────────────────────────────────────────────
const StaffDashboardPage = lazy(() => import('@/features/staff/pages/StaffDashboardPage.jsx'));
const MyQueuePage        = lazy(() => import('@/features/queue/pages/MyQueuePage.jsx'));
const StaffCustomersPage = lazy(() => import('@/features/staff/pages/CustomersPage.jsx'));
const ServiceDeskPage    = lazy(() => import('@/features/staff/pages/ServiceDeskPage.jsx'));
const ActivityFeedPage   = lazy(() => import('@/features/customer-feed/pages/ActivityFeedPage.jsx'));
const NotificationsPage  = lazy(() => import('@/features/staff/pages/NotificationsPage.jsx'));
const StaffSchedulePage  = lazy(() => import('@/features/schedule/pages/StaffSchedulePage.jsx'));
const StaffSettingsPage  = lazy(() => import('@/features/settings/pages/StaffSettingsPage.jsx'));

// ── Platform admin portal ─────────────────────────────────────────────────
const AdminOverview          = lazy(() => import('@/features/admin/pages/Overview.jsx'));
const AdminOrganizations     = lazy(() => import('@/features/admin/pages/Organizations.jsx'));
const AdminUsers             = lazy(() => import('@/features/admin/pages/Users.jsx'));
const AdminSubscriptions     = lazy(() => import('@/features/admin/pages/Subscriptions.jsx'));
const AdminPlatformAnalytics = lazy(() => import('@/features/analytics/pages/PlatformAnalytics.jsx'));
const AdminSystemMonitoring  = lazy(() => import('@/features/admin/pages/SystemMonitoring.jsx'));
const AdminAuditLogs         = lazy(() => import('@/features/admin/pages/AuditLogs.jsx'));
const AdminSupportCenter     = lazy(() => import('@/features/admin/pages/SupportCenter.jsx'));
const AdminSettings          = lazy(() => import('@/features/admin/pages/Settings.jsx'));

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

const guard = (el) => <PrivateRoute>{el}</PrivateRoute>;

export default function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* ── Public ─────────────────────────────────────────────────── */}
        <Route path={ROUTES.landing}  element={<LandingPage />} />
        <Route path={ROUTES.login}    element={<LoginPage />} />
        <Route path={ROUTES.signup}   element={<SignupPage />} />
        <Route path={ROUTES.bookDemo} element={<BookDemoPage />} />
        <Route path="/q/:queueId"     element={<JoinQueuePage />} />
        <Route path="/invite/:token"  element={<AcceptInvitePage />} />

        {/* ── Owner workspace ────────────────────────────────────────── */}
        <Route path={ROUTES.owner.dashboard}     element={guard(<DashboardPage />)} />
        <Route path={ROUTES.owner.liveQueue}     element={guard(<LiveQueuePage />)} />
        <Route path={ROUTES.owner.operations}    element={guard(<OperationsPage />)} />
        <Route path={ROUTES.owner.customerFeed}  element={guard(<CustomerFeedPage />)} />
        <Route path={ROUTES.owner.analytics}     element={guard(<AnalyticsPage />)} />
        <Route path={ROUTES.owner.smartInsights} element={guard(<SmartInsightsPage />)} />
        <Route path={ROUTES.owner.schedule}      element={guard(<SchedulePage />)} />
        <Route path={ROUTES.owner.settings}      element={guard(<SettingsPage />)} />

        {/* ── Staff operator console ─────────────────────────────────── */}
        <Route path={ROUTES.staff.dashboard}     element={guard(<StaffDashboardPage />)} />
        <Route path={ROUTES.staff.myQueue}       element={guard(<MyQueuePage />)} />
        <Route path={ROUTES.staff.customers}     element={guard(<StaffCustomersPage />)} />
        <Route path={ROUTES.staff.serviceDesk}   element={guard(<ServiceDeskPage />)} />
        <Route path={ROUTES.staff.activityFeed}  element={guard(<ActivityFeedPage />)} />
        <Route path={ROUTES.staff.notifications} element={guard(<NotificationsPage />)} />
        <Route path={ROUTES.staff.schedule}      element={guard(<StaffSchedulePage />)} />
        <Route path={ROUTES.staff.settings}      element={guard(<StaffSettingsPage />)} />

        {/* ── Platform admin portal ──────────────────────────────────── */}
        <Route path={ROUTES.admin.overview}          element={guard(<AdminOverview />)} />
        <Route path={ROUTES.admin.organizations}     element={guard(<AdminOrganizations />)} />
        <Route path={ROUTES.admin.users}             element={guard(<AdminUsers />)} />
        <Route path={ROUTES.admin.subscriptions}     element={guard(<AdminSubscriptions />)} />
        <Route path={ROUTES.admin.platformAnalytics} element={guard(<AdminPlatformAnalytics />)} />
        <Route path={ROUTES.admin.systemMonitoring}  element={guard(<AdminSystemMonitoring />)} />
        <Route path={ROUTES.admin.auditLogs}         element={guard(<AdminAuditLogs />)} />
        <Route path={ROUTES.admin.supportCenter}     element={guard(<AdminSupportCenter />)} />
        <Route path={ROUTES.admin.settings}          element={guard(<AdminSettings />)} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
