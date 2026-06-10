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
import { ROLES } from '@/app/providers/AuthProvider.jsx';
import { ROUTES } from '@/shared/constants/routes.js';

// ── Public ────────────────────────────────────────────────────────────────
const LandingPage  = lazy(() => import('@/features/marketing/pages/LandingPage.jsx'));
const LoginPage    = lazy(() => import('@/features/auth/pages/LoginPage.jsx'));
const SignupPage   = lazy(() => import('@/features/auth/pages/SignupPage.jsx'));
const BookDemoPage = lazy(() => import('@/features/marketing/pages/BookDemoPage.jsx'));
const NotFoundPage = lazy(() => import('@/features/marketing/pages/NotFoundPage.jsx'));
const JoinQueuePage = lazy(() => import('@/features/public/pages/JoinQueuePage.jsx'));
const AcceptInvitePage = lazy(() => import('@/features/auth/pages/AcceptInvitePage.jsx'));
const ForgotPasswordPage = lazy(() => import('@/features/auth/pages/ForgotPasswordPage.jsx'));
const ResetPasswordPage  = lazy(() => import('@/features/auth/pages/ResetPasswordPage.jsx'));
const VerifyEmailPage    = lazy(() => import('@/features/auth/pages/VerifyEmailPage.jsx'));

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
const AdminQueues            = lazy(() => import('@/features/admin/pages/Queues.jsx'));
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

// Role-scoped guards: each one bounces signed-in users with the wrong role
// to *their* home route, so an owner clicking an admin link doesn't get a
// 403 from the API and think the app is broken.
const ownerGuard = (el) => <PrivateRoute roles={[ROLES.BUSINESS_OWNER]}>{el}</PrivateRoute>;
const staffGuard = (el) => <PrivateRoute roles={[ROLES.STAFF]}>{el}</PrivateRoute>;
const adminGuard = (el) => <PrivateRoute roles={[ROLES.ADMIN]}>{el}</PrivateRoute>;

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
        <Route path={ROUTES.forgotPassword} element={<ForgotPasswordPage />} />
        <Route path={ROUTES.resetPassword}  element={<ResetPasswordPage />} />
        <Route path={ROUTES.verifyEmail}    element={<VerifyEmailPage />} />

        {/* ── Owner workspace ────────────────────────────────────────── */}
        <Route path={ROUTES.owner.dashboard}     element={ownerGuard(<DashboardPage />)} />
        <Route path={ROUTES.owner.liveQueue}     element={ownerGuard(<LiveQueuePage />)} />
        <Route path={ROUTES.owner.operations}    element={ownerGuard(<OperationsPage />)} />
        <Route path={ROUTES.owner.customerFeed}  element={ownerGuard(<CustomerFeedPage />)} />
        <Route path={ROUTES.owner.analytics}     element={ownerGuard(<AnalyticsPage />)} />
        <Route path={ROUTES.owner.smartInsights} element={ownerGuard(<SmartInsightsPage />)} />
        <Route path={ROUTES.owner.schedule}      element={ownerGuard(<SchedulePage />)} />
        <Route path={ROUTES.owner.settings}      element={ownerGuard(<SettingsPage />)} />

        {/* ── Staff operator console ─────────────────────────────────── */}
        <Route path={ROUTES.staff.dashboard}     element={staffGuard(<StaffDashboardPage />)} />
        <Route path={ROUTES.staff.myQueue}       element={staffGuard(<MyQueuePage />)} />
        <Route path={ROUTES.staff.customers}     element={staffGuard(<StaffCustomersPage />)} />
        <Route path={ROUTES.staff.serviceDesk}   element={staffGuard(<ServiceDeskPage />)} />
        <Route path={ROUTES.staff.activityFeed}  element={staffGuard(<ActivityFeedPage />)} />
        <Route path={ROUTES.staff.notifications} element={staffGuard(<NotificationsPage />)} />
        <Route path={ROUTES.staff.schedule}      element={staffGuard(<StaffSchedulePage />)} />
        <Route path={ROUTES.staff.settings}      element={staffGuard(<StaffSettingsPage />)} />

        {/* ── Platform admin portal ──────────────────────────────────── */}
        <Route path={ROUTES.admin.overview}          element={adminGuard(<AdminOverview />)} />
        <Route path={ROUTES.admin.organizations}     element={adminGuard(<AdminOrganizations />)} />
        <Route path={ROUTES.admin.users}             element={adminGuard(<AdminUsers />)} />
        <Route path={ROUTES.admin.queues}            element={adminGuard(<AdminQueues />)} />
        <Route path={ROUTES.admin.subscriptions}     element={adminGuard(<AdminSubscriptions />)} />
        <Route path={ROUTES.admin.platformAnalytics} element={adminGuard(<AdminPlatformAnalytics />)} />
        <Route path={ROUTES.admin.systemMonitoring}  element={adminGuard(<AdminSystemMonitoring />)} />
        <Route path={ROUTES.admin.auditLogs}         element={adminGuard(<AdminAuditLogs />)} />
        <Route path={ROUTES.admin.supportCenter}     element={adminGuard(<AdminSupportCenter />)} />
        <Route path={ROUTES.admin.settings}          element={adminGuard(<AdminSettings />)} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
