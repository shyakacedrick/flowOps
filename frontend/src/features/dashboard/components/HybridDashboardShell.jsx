import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Radio,
  BarChart3,
  Users,
  MessageSquare,
  Sparkles,
  Calendar,
  Settings,
  LogOut,
  Search,
  Zap,
  Menu,
  X,
  HelpCircle,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { useAuth, ROLE_META } from '@/app/providers/AuthProvider.jsx';
import { ease } from '@/animations/motion.js';
import UserMenu from '@/shared/components/UserMenu.jsx';
import NotificationsMenu from '@/shared/components/NotificationsMenu.jsx';
import { ROUTES } from '@/shared/constants/routes.js';

/**
 * HybridDashboardShell — premium enterprise dashboard shell.
 *
 * Route-driven sidebar. The active nav item is derived from the current
 * URL via react-router's useLocation, so the shell is now shareable across
 * every owner workspace page (Dashboard, Live Queue, Operations, …).
 *
 * Two render modes:
 *  1. <HybridDashboardShell darkSlot={…} lightSlot={…} />
 *     Legacy two-region composition (Dashboard overview).
 *  2. <HybridDashboardShell>{children}</HybridDashboardShell>
 *     Single dark region used by every other workspace page.
 */

const NAV = [
  { key: 'dashboard',      label: 'Dashboard',     icon: LayoutDashboard, to: '/dashboard' },
  { key: 'live-queue',     label: 'Live Queue',    icon: Radio,           to: '/live-queue', badge: 5 },
  { key: 'operations',     label: 'Operations',    icon: Users,           to: '/operations' },
  { key: 'customer-feed',  label: 'Customer Feed', icon: MessageSquare,   to: '/customer-feed' },
  { key: 'analytics',      label: 'Analytics',     icon: BarChart3,       to: '/analytics' },
  { key: 'smart-insights', label: 'Smart Insights',icon: Sparkles,        to: '/smart-insights' },
  { key: 'schedule',       label: 'Schedule',      icon: Calendar,        to: '/schedule' },
  { key: 'settings',       label: 'Settings',      icon: Settings,        to: '/settings' },
];

export default function HybridDashboardShell({
  darkSlot,
  lightSlot,
  children,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, signOut } = useAuth();
  const meta = ROLE_META[session?.role] || {};
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('flowops:owner:collapsed') === '1';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('flowops:owner:collapsed', collapsed ? '1' : '0');
  }, [collapsed]);

  const activeKey =
    NAV.find((n) => location.pathname.startsWith(n.to))?.key || 'dashboard';

  const handleSignOut = () => {
    signOut();
    navigate('/login', { replace: true });
  };

  const handleNav = (item) => {
    navigate(item.to);
    setMobileOpen(false);
  };

  const hasSlots = Boolean(darkSlot || lightSlot);

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-200">
      {/* ── Sidebar (desktop) ──────────────────────────────────────── */}
      <DesktopSidebar
        activeKey={activeKey}
        onNav={handleNav}
        onSignOut={handleSignOut}
        workspace={meta.workspace || 'Operations'}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((v) => !v)}
      />

      {/* ── Sidebar (mobile drawer) ────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <MobileSidebar
            activeKey={activeKey}
            onNav={handleNav}
            onClose={() => setMobileOpen(false)}
            onSignOut={handleSignOut}
            workspace={meta.workspace || 'Operations'}
          />
        )}
      </AnimatePresence>

      {/* ── Main ──────────────────────────────────────────────────── */}
      <div className={`transition-[padding] duration-200 ${collapsed ? 'lg:pl-[76px]' : 'lg:pl-64'}`}>
        {/* DARK ANALYTICS REGION */}
        <div className="relative bg-[#0B1120] pb-20">
          {/* ambient glow backdrop */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-20 left-1/3 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-blue-500/[0.07] blur-[140px]" />
            <div className="absolute top-40 right-0 h-[320px] w-[420px] rounded-full bg-cyan-500/[0.06] blur-[120px]" />
          </div>

          <TopBar
            session={session}
            meta={meta}
            onMenu={() => setMobileOpen(true)}
          />

          <div className="relative px-4 pt-2 sm:px-6 lg:px-10">
            {hasSlots ? darkSlot : children}
          </div>
        </div>

        {/* LIGHT OPERATIONAL REGION — only rendered for the dashboard overview */}
        {hasSlots && lightSlot && (
          <div className="relative -mt-12 rounded-t-[2.25rem] bg-[#0B1120] pb-16 pt-12 shadow-[0_-24px_60px_-30px_rgba(0,0,0,0.7)] ring-1 ring-white/[0.04]">
            <div className="px-4 sm:px-6 lg:px-10">
              {lightSlot}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function DesktopSidebar({ activeKey, onNav, onSignOut, workspace, collapsed, onToggleCollapsed }) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-white/[0.05] bg-[#0B1120] text-slate-300 transition-[width] duration-200 lg:flex ${
        collapsed ? 'w-[76px]' : 'w-64'
      }`}
    >
      <BrandBlock workspace={workspace} collapsed={collapsed} />

      <nav className={`mt-7 flex-1 space-y-0.5 ${collapsed ? 'px-2' : 'px-3'}`}>
        {NAV.map((item) => (
          <NavItem
            key={item.key}
            item={item}
            active={item.key === activeKey}
            collapsed={collapsed}
            onClick={() => onNav(item)}
          />
        ))}
      </nav>

      <SidebarFooter
        onSignOut={onSignOut}
        collapsed={collapsed}
        onToggleCollapsed={onToggleCollapsed}
      />
    </aside>
  );
}

function MobileSidebar({ activeKey, onNav, onClose, onSignOut, workspace }) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
      />
      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        exit={{ x: -280 }}
        transition={{ duration: 0.25, ease: ease.out }}
        className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[#0B1120] text-slate-300 lg:hidden"
      >
        <div className="flex items-center justify-between px-4 pt-5">
          <BrandBlock workspace={workspace} inline />
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 text-slate-400"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <nav className="mt-6 flex-1 space-y-0.5 px-3">
          {NAV.map((item) => (
            <NavItem
              key={item.key}
              item={item}
              active={item.key === activeKey}
              onClick={() => onNav(item)}
            />
          ))}
        </nav>
        <SidebarFooter onSignOut={onSignOut} />
      </motion.aside>
    </>
  );
}

function BrandBlock({ workspace, inline = false, collapsed = false }) {
  return (
    <Link
      to="/"
      className={`flex items-center gap-2.5 ${inline ? '' : 'pt-7'} ${
        collapsed ? 'justify-center px-2' : inline ? '' : 'px-6'
      }`}
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 text-slate-900 shadow-[0_0_22px_-3px_rgba(34,211,238,0.7)]">
        <Zap className="h-4 w-4" strokeWidth={2.5} />
      </span>
      {!collapsed && (
        <div className="min-w-0">
          <p className="text-[15px] font-bold leading-tight tracking-tight text-white">FlowOps</p>
          <p className="truncate text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            {workspace}
          </p>
        </div>
      )}
    </Link>
  );
}

function NavItem({ item, active, onClick, collapsed = false }) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={`relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
        active
          ? 'bg-white/[0.06] text-white'
          : 'text-slate-400 hover:bg-white/[0.03] hover:text-slate-200'
      } ${collapsed ? 'justify-center px-2' : ''}`}
    >
      {active && (
        <motion.span
          layoutId="hybrid-nav-active"
          className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-gradient-to-b from-cyan-400 to-blue-500"
          transition={{ duration: 0.3, ease: ease.out }}
        />
      )}
      <Icon className="h-4 w-4 shrink-0" strokeWidth={1.8} />
      {!collapsed && <span className="flex-1 text-left truncate">{item.label}</span>}
      {!collapsed && item.badge ? (
        <span className="relative grid h-5 min-w-[20px] place-items-center rounded-full bg-cyan-400 px-1.5 text-[10px] font-bold text-slate-900 shadow-[0_0_12px_-1px_rgba(34,211,238,0.95)]">
          <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-cyan-400/40" />
          {item.badge}
        </span>
      ) : null}
      {collapsed && item.badge ? (
        <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-cyan-400" />
      ) : null}
    </button>
  );
}

function SidebarFooter({ onSignOut, collapsed = false, onToggleCollapsed }) {
  return (
    <div className="mt-2 space-y-1 border-t border-white/[0.05] p-3">
      {!collapsed && (
        <button className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-white/[0.04] hover:text-slate-200">
          <HelpCircle className="h-4 w-4" />
          Help & docs
        </button>
      )}
      <button
        onClick={onSignOut}
        title={collapsed ? 'Sign out' : undefined}
        className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-white/[0.04] hover:text-rose-300 ${
          collapsed ? 'justify-center' : ''
        }`}
      >
        <LogOut className="h-4 w-4" />
        {!collapsed && 'Sign out'}
      </button>
      {onToggleCollapsed && (
        <button
          onClick={onToggleCollapsed}
          className={`mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 transition-colors hover:bg-white/[0.04] hover:text-slate-200 ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          {collapsed
            ? <ChevronsRight className="h-3.5 w-3.5" />
            : <><ChevronsLeft className="h-3.5 w-3.5" /> Collapse</>}
        </button>
      )}
    </div>
  );
}

function TopBar({ session, meta, onMenu }) {
  return (
    <header className="relative flex items-center justify-between gap-3 px-4 py-5 sm:gap-4 sm:px-6 lg:px-10">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          onClick={onMenu}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 text-slate-300 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-4 w-4" />
        </button>
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            {meta.workspace || 'Operations control center'}
          </p>
          <h1 className="truncate text-base font-semibold text-white sm:text-lg">
            Welcome back, {session?.displayName?.split(' ')[0] || 'Operator'}
          </h1>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <div className="relative hidden w-64 items-center md:flex">
          <Search className="pointer-events-none absolute left-3 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search tickets, counters…"
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-500 backdrop-blur transition-colors focus:border-cyan-400/40 focus:outline-none"
          />
        </div>
        <NotificationsMenu seeAllPath={ROUTES.owner.customerFeed} accent="cyan" />
        <UserMenu settingsPath={ROUTES.owner.settings} />
      </div>
    </header>
  );
}
