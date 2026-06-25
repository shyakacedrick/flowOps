// ============================================================================
//  routes — single source of truth for app URLs
// ----------------------------------------------------------------------------
//  Import these instead of hard-coding path strings so renames are typo-safe
//  and refactor-friendly.
// ============================================================================

export const ROUTES = {
  // Public
  landing:   '/',
  login:     '/login',
  signup:    '/signup',
  bookDemo:  '/book-demo',
  // Auth flows (templates render absolute URLs using these paths).
  forgotPassword: '/forgot-password',
  resetPassword:  '/reset-password/:token',
  verifyEmail:    '/verify-email/:token',

  // Owner workspace
  owner: {
    dashboard:     '/dashboard',
    liveQueue:     '/live-queue',
    operations:    '/operations',
    customerFeed:  '/customer-feed',
    analytics:     '/analytics',
    smartInsights: '/smart-insights',
    schedule:      '/schedule',
    settings:      '/settings',
  },

  // Staff operator console
  staff: {
    dashboard:     '/staff/dashboard',
    myQueue:       '/staff/my-queue',
    customers:     '/staff/customers',
    serviceDesk:   '/staff/service-desk',
    activityFeed:  '/staff/activity-feed',
    notifications: '/staff/notifications',
    schedule:      '/staff/schedule',
    settings:      '/staff/settings',
  },

  // Platform admin portal
  admin: {
    overview:           '/admin/overview',
    organizations:      '/admin/organizations',
    users:              '/admin/users',
    userActivity:       '/admin/users/:userId/activity',
    queues:             '/admin/queues',
    subscriptions:      '/admin/subscriptions',
    platformAnalytics:  '/admin/platform-analytics',
    systemMonitoring:   '/admin/system-monitoring',
    auditLogs:          '/admin/audit-logs',
    supportCenter:      '/admin/support-center',
    settings:           '/admin/settings',
  },
};
