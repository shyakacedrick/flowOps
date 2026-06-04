import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  Bell,
  Zap,
  Menu,
  X,
  HelpCircle,
} from 'lucide-react';
import { useAuth, ROLE_META } from '../auth/AuthContext.jsx';
import { ease } from '../animations/motion.js';

/**
 * HybridDashboardShell — premium enterprise dashboard shell.
 *
 * Architecture:
 *   ┌──────────┬──────────────────────────────────────────────┐
 *   │ Sidebar  │  DARK ANALYTICS REGION (#0B1120)             │
 *   │ #0B1120  │  (chart, KPIs, monitoring)                   │
 *   │ FlowOps  ├──────────────────────────────────────────────┤
 *   │ + nav    │  LIGHT OPERATIONAL WORKSPACE (#F8FAFC)       │
 *   │          │  (activity, insights, timeline)              │
 *   └──────────┴──────────────────────────────────────────────┘
 *
 * Props:
 *   activeKey, onNav  — controlled active nav state
 *   darkSlot          — content rendered in the dark analytics region
 *   lightSlot         — content rendered in the light operations region
 */

const NAV = [
  { key: 'dashboard',     label: 'Dashboard',      icon: LayoutDashboard },
  { key: 'live-queues',   label: 'Live Queues',    icon: Radio,         badge: 5 },
  { key: 'analytics',     label: 'Analytics',      icon: BarChart3 },
  { key: 'staff-desks',   label: 'Staff Desks',    icon: Users },
  { key: 'customer-feed', label: 'Customer Feed',  icon: MessageSquare },
  { key: 'smart-insights',label: 'Smart Insights', icon: Sparkles },
  { key: 'schedule',      label: 'Schedule',       icon: Calendar },
  { key: 'settings',      label: 'Settings',       icon: Settings },
];

export default function HybridDashboardShell({
  activeKey = 'dashboard',
  onNav = () => {},
  darkSlot,
  lightSlot,
}) {
  const navigate = useNavigate();
  const { session, signOut } = useAuth();
  const meta = ROLE_META[session?.role] || {};
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = (session?.displayName || 'FO')
    .split(' ').map((s) => s[0]).slice(0, 2).join('');

  const handleSignOut = () => {
    signOut();
    navigate('/login', { replace: true });
  };

  const handleNav = (key) => {
    onNav(key);
    setMobileOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      {/* ── Sidebar (desktop) ──────────────────────────────────────── */}
      <DesktopSidebar
        activeKey={activeKey}
        onNav={handleNav}
        onSignOut={handleSignOut}
        workspace={meta.workspace || 'Operations'}
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
      <div className="lg:pl-64">
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
            initials={initials}
            onMenu={() => setMobileOpen(true)}
          />

          <div className="relative px-4 pt-2 sm:px-6 lg:px-10">
            {darkSlot}
          </div>
        </div>

        {/* LIGHT OPERATIONAL REGION — seamless overlap */}
        <div className="relative -mt-12 rounded-t-[2.25rem] bg-[#F8FAFC] pb-16 pt-12 shadow-[0_-24px_60px_-30px_rgba(2,6,23,0.55)]">
          <div className="px-4 sm:px-6 lg:px-10">
            {lightSlot}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function DesktopSidebar({ activeKey, onNav, onSignOut, workspace }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-white/[0.05] bg-[#0B1120] text-slate-300 lg:flex">
      <BrandBlock workspace={workspace} />

      <nav className="mt-7 flex-1 space-y-0.5 px-3">
        {NAV.map((item) => (
          <NavItem
            key={item.key}
            item={item}
            active={item.key === activeKey}
            onClick={() => onNav(item.key)}
          />
        ))}
      </nav>

      <SidebarFooter onSignOut={onSignOut} />
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
              onClick={() => onNav(item.key)}
            />
          ))}
        </nav>
        <SidebarFooter onSignOut={onSignOut} />
      </motion.aside>
    </>
  );
}

function BrandBlock({ workspace, inline = false }) {
  return (
    <Link to="/" className={`flex items-center gap-2.5 ${inline ? '' : 'px-6 pt-7'}`}>
      <span className="grid h-9 w-9 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 text-slate-900 shadow-[0_0_22px_-3px_rgba(34,211,238,0.7)]">
        <Zap className="h-4 w-4" strokeWidth={2.5} />
      </span>
      <div className="min-w-0">
        <p className="text-[15px] font-bold leading-tight tracking-tight text-white">FlowOps</p>
        <p className="truncate text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          {workspace}
        </p>
      </div>
    </Link>
  );
}

function NavItem({ item, active, onClick }) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      className={`relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
        active
          ? 'bg-white/[0.06] text-white'
          : 'text-slate-400 hover:bg-white/[0.03] hover:text-slate-200'
      }`}
    >
      {active && (
        <motion.span
          layoutId="hybrid-nav-active"
          className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-gradient-to-b from-cyan-400 to-blue-500"
          transition={{ duration: 0.3, ease: ease.out }}
        />
      )}
      <Icon className="h-4 w-4" strokeWidth={1.8} />
      <span className="flex-1 text-left">{item.label}</span>
      {item.badge ? (
        <span className="relative grid h-5 min-w-[20px] place-items-center rounded-full bg-cyan-400 px-1.5 text-[10px] font-bold text-slate-900 shadow-[0_0_12px_-1px_rgba(34,211,238,0.95)]">
          <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-cyan-400/40" />
          {item.badge}
        </span>
      ) : null}
    </button>
  );
}

function SidebarFooter({ onSignOut }) {
  return (
    <div className="mt-2 space-y-1 border-t border-white/[0.05] p-3">
      <button className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-white/[0.04] hover:text-slate-200">
        <HelpCircle className="h-4 w-4" />
        Help & docs
      </button>
      <button
        onClick={onSignOut}
        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-white/[0.04] hover:text-rose-300"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    </div>
  );
}

function TopBar({ session, meta, initials, onMenu }) {
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
        <button className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 text-slate-300 hover:bg-white/[0.04]">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-cyan-400 ring-2 ring-[#0B1120]" />
        </button>
        <div className="flex shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-2 py-1.5">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 text-xs font-bold text-slate-900">
            {initials}
          </span>
          <div className="hidden min-w-0 text-right sm:block">
            <p className="truncate text-xs font-semibold leading-tight text-white">
              {session?.displayName || 'Operator'}
            </p>
            <p className="truncate text-[10px] leading-tight text-slate-500">{meta.label || 'Owner'}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
