import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  ListOrdered,
  Users,
  MonitorCog,
  Activity,
  Bell,
  Calendar,
  Settings,
  LogOut,
  Zap,
  Menu,
  X,
  HelpCircle,
  Coffee,
  PlayCircle,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { useAuth, ROLE_META } from '../auth/AuthContext.jsx';
import { ease } from '../animations/motion.js';
import { useSimulationSlice } from '../engine/SimulationProvider.jsx';

/**
 * StaffShell — operational console for the Staff Operator role.
 *
 * Optimized for speed and clarity: large nav targets, a persistent shift
 * status pill, a compact "now serving" indicator in the top bar, and a
 * route-driven active state so the sidebar can be shared by every
 * /staff/* page.
 */

const NAV = [
  { key: 'dashboard',     label: 'Dashboard',     icon: LayoutDashboard, to: '/staff/dashboard' },
  { key: 'my-queue',      label: 'My Queue',      icon: ListOrdered,     to: '/staff/my-queue', primary: true },
  { key: 'customers',     label: 'Customers',     icon: Users,           to: '/staff/customers' },
  { key: 'service-desk',  label: 'Service Desk',  icon: MonitorCog,      to: '/staff/service-desk' },
  { key: 'activity-feed', label: 'Activity Feed', icon: Activity,        to: '/staff/activity-feed' },
  { key: 'notifications', label: 'Notifications', icon: Bell,            to: '/staff/notifications', badge: 3 },
  { key: 'schedule',      label: 'Schedule',      icon: Calendar,        to: '/staff/schedule' },
  { key: 'settings',      label: 'Settings',      icon: Settings,        to: '/staff/settings' },
];

export default function StaffShell({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, signOut } = useAuth();
  const meta = ROLE_META[session?.role] || {};
  const [mobileOpen, setMobileOpen] = useState(false);
  const [shiftPaused, setShiftPaused] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('flowops:staff:collapsed') === '1';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('flowops:staff:collapsed', collapsed ? '1' : '0');
  }, [collapsed]);

  const queueLen   = useSimulationSlice((s) => s.queue.length);
  const nowServing = useSimulationSlice((s) => s.business.currentServing);

  const activeKey =
    NAV.find((n) => location.pathname.startsWith(n.to))?.key || 'dashboard';

  const initials = (session?.displayName || 'FO')
    .split(' ').map((s) => s[0]).slice(0, 2).join('');

  const handleSignOut = () => {
    signOut();
    navigate('/login', { replace: true });
  };

  const handleNav = (item) => {
    navigate(item.to);
    setMobileOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-200">
      {/* desktop sidebar */}
      <DesktopSidebar
        activeKey={activeKey}
        onNav={handleNav}
        onSignOut={handleSignOut}
        shiftPaused={shiftPaused}
        onToggleShift={() => setShiftPaused((v) => !v)}
        workspace={meta.workspace || 'Live Queue Console'}
        deskLabel="Desk 2"
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((v) => !v)}
      />

      {/* mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <MobileSidebar
            activeKey={activeKey}
            onNav={handleNav}
            onClose={() => setMobileOpen(false)}
            onSignOut={handleSignOut}
            shiftPaused={shiftPaused}
            onToggleShift={() => setShiftPaused((v) => !v)}
            workspace={meta.workspace || 'Live Queue Console'}
          />
        )}
      </AnimatePresence>

      {/* main */}
      <div className={`transition-[padding] duration-200 ${collapsed ? 'lg:pl-[76px]' : 'lg:pl-64'}`}>
        <div className="relative bg-[#0B1120] pb-20">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-24 right-1/4 h-[360px] w-[640px] rounded-full bg-cyan-500/[0.06] blur-[140px]" />
          </div>

          <TopBar
            session={session}
            meta={meta}
            initials={initials}
            queueLen={queueLen}
            nowServing={nowServing}
            shiftPaused={shiftPaused}
            onMenu={() => setMobileOpen(true)}
          />

          <div className="relative px-4 pt-2 sm:px-6 lg:px-10">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sidebar variants
// ---------------------------------------------------------------------------

function DesktopSidebar({ activeKey, onNav, onSignOut, shiftPaused, onToggleShift, workspace, deskLabel, collapsed, onToggleCollapsed }) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-white/[0.05] bg-[#0B1120] text-slate-300 transition-[width] duration-200 lg:flex ${
        collapsed ? 'w-[76px]' : 'w-64'
      }`}
    >
      <BrandBlock workspace={workspace} collapsed={collapsed} />
      {!collapsed && <ShiftStatus paused={shiftPaused} onToggle={onToggleShift} desk={deskLabel} />}

      <nav className={`mt-4 flex-1 space-y-0.5 ${collapsed ? 'px-2' : 'px-3'}`}>
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

function MobileSidebar({ activeKey, onNav, onClose, onSignOut, shiftPaused, onToggleShift, workspace }) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
      />
      <motion.aside
        initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
        transition={{ duration: 0.25, ease: ease.out }}
        className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[#0B1120] text-slate-300 lg:hidden"
      >
        <div className="flex items-center justify-between px-4 pt-5">
          <BrandBlock workspace={workspace} inline />
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 text-slate-400">
            <X className="h-4 w-4" />
          </button>
        </div>
        <ShiftStatus paused={shiftPaused} onToggle={onToggleShift} desk="Desk 2" />
        <nav className="mt-4 flex-1 space-y-0.5 px-3">
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

// ---------------------------------------------------------------------------
// Sidebar atoms
// ---------------------------------------------------------------------------

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

function ShiftStatus({ paused, onToggle, desk }) {
  return (
    <div className="mx-3 mt-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-[11px] font-semibold text-slate-300">
          {paused ? (
            <span className="grid h-2 w-2 place-items-center">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
            </span>
          ) : (
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
          )}
          {paused ? 'On Break' : 'Shift Active'}
        </span>
        <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-500">{desk}</span>
      </div>
      <button
        onClick={onToggle}
        className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-2 py-1.5 text-[11px] font-semibold text-slate-200 transition-colors hover:bg-white/[0.08]"
      >
        {paused ? <><PlayCircle className="h-3.5 w-3.5" /> Resume shift</> : <><Coffee className="h-3.5 w-3.5" /> Take a break</>}
      </button>
    </div>
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
          layoutId="staff-nav-active"
          className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-gradient-to-b from-cyan-400 to-blue-500"
          transition={{ duration: 0.3, ease: ease.out }}
        />
      )}
      <Icon className="h-4 w-4 shrink-0" strokeWidth={1.8} />
      {!collapsed && <span className="flex-1 text-left truncate">{item.label}</span>}
      {!collapsed && item.primary && !active && (
        <span className="rounded-md bg-cyan-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-cyan-300">
          Live
        </span>
      )}
      {!collapsed && item.badge ? (
        <span className="relative grid h-5 min-w-[20px] place-items-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white shadow-[0_0_12px_-1px_rgba(244,63,94,0.9)]">
          <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-rose-500/40" />
          {item.badge}
        </span>
      ) : null}
      {collapsed && item.badge ? (
        <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-rose-500" />
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

// ---------------------------------------------------------------------------
// Top bar
// ---------------------------------------------------------------------------

function TopBar({ session, meta, initials, queueLen, nowServing, shiftPaused, onMenu }) {
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
            {meta.workspace || 'Live queue console'}
          </p>
          <h1 className="truncate text-base font-semibold text-white sm:text-lg">
            {shiftPaused ? 'On break' : 'On shift'} · {session?.displayName?.split(' ')[0] || 'Operator'}
          </h1>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <div className="hidden items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 md:flex">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Now</span>
          <span className="font-mono text-sm font-bold text-cyan-300">
            {nowServing?.id || '—'}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">·</span>
          <span className="text-[11px] font-semibold text-slate-200">{queueLen} waiting</span>
        </div>
        <button className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 text-slate-300 hover:bg-white/[0.04]">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-[#0B1120]" />
        </button>
        <div className="flex shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-2 py-1.5">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 text-xs font-bold text-slate-900">
            {initials}
          </span>
          <div className="hidden min-w-0 text-right sm:block">
            <p className="truncate text-xs font-semibold leading-tight text-white">
              {session?.displayName || 'Operator'}
            </p>
            <p className="truncate text-[10px] leading-tight text-slate-500">{meta.label || 'Staff'}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
