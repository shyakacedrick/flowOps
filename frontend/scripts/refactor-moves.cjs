#!/usr/bin/env node
/*
 * Phase 3 path remap — applies the move map by:
 *   1) Renaming/moving files on disk
 *   2) Rewriting all `@/<old>` -> `@/<new>` references across src/
 *
 * Safe to run multiple times: missing source files are skipped.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');

// [from, to]  — paths relative to src/ (without leading src/)
const MOVES = [
  // ---- shared/components ----
  ['components/Logo.jsx',                'shared/components/Logo.jsx'],
  ['components/ErrorBoundary.jsx',       'shared/components/ErrorBoundary.jsx'],
  ['components/EmptyState.jsx',          'shared/components/EmptyState.jsx'],
  ['components/LoadingState.jsx',        'shared/components/LoadingState.jsx'],

  // ---- shared/hooks ----
  ['hooks/useSimulation.js',             'shared/hooks/useSimulation.js'],

  // ---- features/marketing ----
  ['pages/LandingPage.jsx',              'features/marketing/pages/LandingPage.jsx'],
  ['pages/BookDemoPage.jsx',             'features/marketing/pages/BookDemoPage.jsx'],
  ['pages/NotFoundPage.jsx',             'features/marketing/pages/NotFoundPage.jsx'],
  ['components/Hero.jsx',                'features/marketing/components/Hero.jsx'],
  ['components/Navbar.jsx',              'features/marketing/components/Navbar.jsx'],
  ['components/Footer.jsx',              'features/marketing/components/Footer.jsx'],
  ['components/ScrollRail.jsx',          'features/marketing/components/ScrollRail.jsx'],
  ['components/LogoMotif.jsx',           'features/marketing/components/LogoMotif.jsx'],
  ['components/BeforeAfter.jsx',         'features/marketing/components/BeforeAfter.jsx'],
  ['components/ClosingCTA.jsx',          'features/marketing/components/ClosingCTA.jsx'],
  ['components/DashboardMock.jsx',       'features/marketing/components/DashboardMock.jsx'],
  ['components/FAQ.jsx',                 'features/marketing/components/FAQ.jsx'],
  ['components/Features.jsx',            'features/marketing/components/Features.jsx'],
  ['components/FutureVision.jsx',        'features/marketing/components/FutureVision.jsx'],
  ['components/HowItWorks.jsx',          'features/marketing/components/HowItWorks.jsx'],
  ['components/Industries.jsx',          'features/marketing/components/Industries.jsx'],
  ['components/LiveStats.jsx',           'features/marketing/components/LiveStats.jsx'],
  ['components/Pricing.jsx',             'features/marketing/components/Pricing.jsx'],
  ['components/ProductPreview.jsx',      'features/marketing/components/ProductPreview.jsx'],
  ['components/Reveal.jsx',              'features/marketing/components/Reveal.jsx'],
  ['components/Stagger.jsx',             'features/marketing/components/Stagger.jsx'],
  ['components/Testimonial.jsx',         'features/marketing/components/Testimonial.jsx'],
  ['components/Trust.jsx',               'features/marketing/components/Trust.jsx'],
  ['components/LiveDashboard.jsx',       'features/marketing/components/LiveDashboard.jsx'],

  // ---- features/auth ----
  ['pages/LoginPage.jsx',                'features/auth/pages/LoginPage.jsx'],
  ['pages/SignupPage.jsx',               'features/auth/pages/SignupPage.jsx'],
  ['components/PrivateRoute.jsx',        'features/auth/components/PrivateRoute.jsx'],
  ['components/RoleTransitionLoader.jsx','features/auth/components/RoleTransitionLoader.jsx'],
  ['hooks/useRoleManager.js',            'features/auth/hooks/useRoleManager.js'],

  // ---- features/dashboard ----
  ['pages/DashboardPage.jsx',                  'features/dashboard/pages/DashboardPage.jsx'],
  ['dashboards/BusinessOwnerDashboard.jsx',    'features/dashboard/components/BusinessOwnerDashboard.jsx'],
  ['dashboards/HybridDashboardShell.jsx',      'features/dashboard/components/HybridDashboardShell.jsx'],

  // ---- features/queue ----
  ['pages/owner/LiveQueuePage.jsx',                       'features/queue/pages/LiveQueuePage.jsx'],
  ['pages/staff/MyQueuePage.jsx',                         'features/queue/pages/MyQueuePage.jsx'],
  ['components/owner/hybrid/QueueHealthPanel.jsx',        'features/queue/components/QueueHealthPanel.jsx'],
  ['components/owner/hybrid/NextInLineTimeline.jsx',      'features/queue/components/NextInLineTimeline.jsx'],
  ['hooks/useQueueEngine.js',                             'features/queue/hooks/useQueueEngine.js'],

  // ---- features/operations ----
  ['pages/owner/OperationsPage.jsx',                      'features/operations/pages/OperationsPage.jsx'],
  ['components/owner/hybrid/SystemStatusCenter.jsx',      'features/operations/components/SystemStatusCenter.jsx'],
  ['components/owner/hybrid/OperationalQuickGrid.jsx',    'features/operations/components/OperationalQuickGrid.jsx'],
  ['components/owner/hybrid/BootSequence.jsx',            'features/operations/components/BootSequence.jsx'],
  ['components/SystemPhaseBanner.jsx',                    'features/operations/components/SystemPhaseBanner.jsx'],
  ['hooks/useSystemPhase.js',                             'features/operations/hooks/useSystemPhase.js'],
  ['hooks/useSystemStatusEngine.js',                      'features/operations/hooks/useSystemStatusEngine.js'],

  // ---- features/customer-feed ----
  ['pages/owner/CustomerFeedPage.jsx',                    'features/customer-feed/pages/CustomerFeedPage.jsx'],
  ['pages/staff/ActivityFeedPage.jsx',                    'features/customer-feed/pages/ActivityFeedPage.jsx'],
  ['components/LiveActivityFeed.jsx',                     'features/customer-feed/components/LiveActivityFeed.jsx'],
  ['components/owner/hybrid/LiveActivityFeed.jsx',        'features/customer-feed/components/LiveActivityFeedHybrid.jsx'],
  ['hooks/useEventLog.js',                                'features/customer-feed/hooks/useEventLog.js'],

  // ---- features/analytics ----
  ['pages/owner/AnalyticsPage.jsx',                       'features/analytics/pages/AnalyticsPage.jsx'],
  ['pages/admin/PlatformAnalytics.jsx',                   'features/analytics/pages/PlatformAnalytics.jsx'],
  ['components/owner/hybrid/CustomerFlowChart.jsx',       'features/analytics/components/CustomerFlowChart.jsx'],

  // ---- features/smart-insights ----
  ['pages/owner/SmartInsightsPage.jsx',                   'features/smart-insights/pages/SmartInsightsPage.jsx'],
  ['components/owner/hybrid/SmartInsightsPanel.jsx',      'features/smart-insights/components/SmartInsightsPanel.jsx'],
  ['components/SmartInsightsDemo.jsx',                    'features/smart-insights/components/SmartInsightsDemo.jsx'],
  ['components/InsightsEngine.jsx',                       'features/smart-insights/components/InsightsEngine.jsx'],
  ['hooks/useRotatingInsight.js',                         'features/smart-insights/hooks/useRotatingInsight.js'],

  // ---- features/schedule ----
  ['pages/owner/SchedulePage.jsx',                        'features/schedule/pages/OwnerSchedulePage.jsx'],
  ['pages/staff/SchedulePage.jsx',                        'features/schedule/pages/StaffSchedulePage.jsx'],

  // ---- features/settings ----
  ['pages/owner/SettingsPage.jsx',                        'features/settings/pages/OwnerSettingsPage.jsx'],
  ['pages/staff/StaffSettingsPage.jsx',                   'features/settings/pages/StaffSettingsPage.jsx'],

  // ---- features/staff ----
  ['pages/staff/StaffDashboardPage.jsx',                  'features/staff/pages/StaffDashboardPage.jsx'],
  ['pages/staff/CustomersPage.jsx',                       'features/staff/pages/CustomersPage.jsx'],
  ['pages/staff/ServiceDeskPage.jsx',                     'features/staff/pages/ServiceDeskPage.jsx'],
  ['pages/staff/NotificationsPage.jsx',                   'features/staff/pages/NotificationsPage.jsx'],
  ['dashboards/StaffShell.jsx',                           'features/staff/components/StaffShell.jsx'],

  // ---- features/admin ----
  ['pages/admin/Overview.jsx',                            'features/admin/pages/Overview.jsx'],
  ['pages/admin/Organizations.jsx',                       'features/admin/pages/Organizations.jsx'],
  ['pages/admin/Users.jsx',                               'features/admin/pages/Users.jsx'],
  ['pages/admin/Subscriptions.jsx',                       'features/admin/pages/Subscriptions.jsx'],
  ['pages/admin/SystemMonitoring.jsx',                    'features/admin/pages/SystemMonitoring.jsx'],
  ['pages/admin/AuditLogs.jsx',                           'features/admin/pages/AuditLogs.jsx'],
  ['pages/admin/SupportCenter.jsx',                       'features/admin/pages/SupportCenter.jsx'],
  ['pages/admin/Settings.jsx',                            'features/admin/pages/Settings.jsx'],
  // rename layout/AdminLayout.jsx -> AdminShell.jsx to avoid collision with app/layouts/AdminLayout.jsx
  ['layout/AdminLayout.jsx',                              'features/admin/components/AdminShell.jsx'],
  ['layout/AdminSidebar.jsx',                             'features/admin/components/AdminSidebar.jsx'],
];

// Drop trailing `.jsx`/`.js` from a `@/...` import key so that bare-extension
// references (rare) also match when we rewrite.
function stripExt(p) {
  return p.replace(/\.(jsx|js)$/, '');
}

// Build the replacement map (both extension-having and extension-less).
const replacements = [];
for (const [from, to] of MOVES) {
  replacements.push([`@/${from}`, `@/${to}`]);
  const fromNoExt = stripExt(from);
  const toNoExt = stripExt(to);
  if (fromNoExt !== from) {
    replacements.push([`@/${fromNoExt}`, `@/${toNoExt}`]);
  }
}

// --- Physical file moves ---
let moved = 0;
for (const [from, to] of MOVES) {
  const src = path.join(SRC, from);
  const dst = path.join(SRC, to);
  if (!fs.existsSync(src)) continue;
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.renameSync(src, dst);
  moved++;
}
console.log(`Moved ${moved} file(s).`);

// --- Rewrite imports across all .js/.jsx under src/ ---
const exts = new Set(['.js', '.jsx']);
function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (exts.has(path.extname(entry.name))) out.push(p);
  }
  return out;
}

// Replace longest keys first so e.g. `@/components/owner/hybrid/X` doesn't get
// half-matched by `@/components/...`. Sort by `from` length desc.
replacements.sort((a, b) => b[0].length - a[0].length);

function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

let touched = 0;
for (const file of walk(SRC)) {
  let code = fs.readFileSync(file, 'utf8');
  let changed = false;
  for (const [fromKey, toKey] of replacements) {
    // Require boundary on the right (quote, slash, dot, end) to avoid partial matches.
    const re = new RegExp(escapeRe(fromKey) + '(?=[\'"\\s)/])', 'g');
    const next = code.replace(re, toKey);
    if (next !== code) {
      code = next;
      changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(file, code);
    touched++;
  }
}
console.log(`Rewrote imports in ${touched} file(s).`);
