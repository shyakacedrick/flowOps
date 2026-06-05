import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  LineChart,
  Activity,
  ScrollText,
  LifeBuoy,
  Settings,
  Zap,
  LogOut,
  ChevronsLeft,
  ChevronsRight,
  HelpCircle,
  X,
} from 'lucide-react';
import { useAuth } from '@/app/providers/AuthProvider.jsx';
import { ease } from '@/animations/motion.js';

/**
 * AdminSidebar — collapsible, sticky, route-driven navigation for the
 * FlowOps platform admin portal. Models the IA spec exactly.
 *
 * Two render variants:
 *   • desktop="true"  → fixed left rail (collapsible)
 *   • drawer="true"   → mobile slide-over (always expanded)
 */

export const ADMIN_NAV = [
  { key: 'overview',           label: 'Platform Overview', icon: LayoutDashboard, to: '/admin/overview' },
  { key: 'organizations',      label: 'Organizations',     icon: Building2,       to: '/admin/organizations', badge: 12 },
  { key: 'users',              label: 'Users',             icon: Users,           to: '/admin/users' },
  { key: 'subscriptions',      label: 'Subscriptions',     icon: CreditCard,      to: '/admin/subscriptions' },
  { key: 'platform-analytics', label: 'Platform Analytics',icon: LineChart,       to: '/admin/platform-analytics' },
  { key: 'system-monitoring',  label: 'System Monitoring', icon: Activity,        to: '/admin/system-monitoring' },
  { key: 'audit-logs',         label: 'Audit Logs',        icon: ScrollText,      to: '/admin/audit-logs' },
  { key: 'support-center',     label: 'Support Center',    icon: LifeBuoy,        to: '/admin/support-center', badge: 4 },
  { key: 'settings',           label: 'Settings',          icon: Settings,        to: '/admin/settings' },
];

export default function AdminSidebar({
  collapsed = false,
  onToggleCollapsed,
  variant = 'desktop',          // 'desktop' | 'drawer'
  onClose,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();

  const activeKey =
    ADMIN_NAV.find((n) => location.pathname.startsWith(n.to))?.key || 'overview';

  const handleSignOut = () => {
    signOut();
    navigate('/login', { replace: true });
  };

  const isDrawer = variant === 'drawer';
  const isCollapsed = !isDrawer && collapsed;

  const widthCls = isDrawer ? 'w-72' : isCollapsed ? 'w-[76px]' : 'w-64';
  const baseCls = isDrawer
    ? 'relative flex h-full w-72 flex-col'
    : `fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-white/[0.05] lg:flex transition-[width] duration-200 ${widthCls}`;

  return (
    <aside className={`${baseCls} bg-[#0B1120] text-slate-300`}>
      {/* Brand */}
      <div className={`flex items-center gap-2.5 px-4 pt-6 ${isCollapsed ? 'justify-center px-2' : ''}`}>
        <Link to="/" className="flex items-center gap-2.5 min-w-0">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 text-slate-900 shadow-[0_0_22px_-3px_rgba(34,211,238,0.7)]">
            <Zap className="h-4 w-4" strokeWidth={2.5} />
          </span>
          {!isCollapsed && (
            <div className="min-w-0">
              <p className="text-[15px] font-bold leading-tight tracking-tight text-white">FlowOps</p>
              <p className="truncate text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                Admin Portal
              </p>
            </div>
          )}
        </Link>
        {isDrawer && (
          <button
            onClick={onClose}
            className="ml-auto grid h-9 w-9 place-items-center rounded-xl border border-white/10 text-slate-400"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Environment tag */}
      {!isCollapsed && (
        <div className="mx-4 mt-5 flex items-center justify-between rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.06] px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span className="text-[11px] font-semibold text-emerald-200">All systems operational</span>
          </div>
          <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-300/80">PROD</span>
        </div>
      )}

      {/* Nav */}
      <nav className={`mt-5 flex-1 space-y-0.5 ${isCollapsed ? 'px-2' : 'px-3'}`}>
        {ADMIN_NAV.map((item) => (
          <NavItem
            key={item.key}
            item={item}
            active={item.key === activeKey}
            collapsed={isCollapsed}
            onClick={() => {
              navigate(item.to);
              if (isDrawer) onClose?.();
            }}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="mt-2 space-y-1 border-t border-white/[0.05] p-3">
        {!isCollapsed && (
          <button className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-white/[0.04] hover:text-slate-200">
            <HelpCircle className="h-4 w-4" />
            Help & docs
          </button>
        )}
        <button
          onClick={handleSignOut}
          title={isCollapsed ? 'Sign out' : undefined}
          className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-white/[0.04] hover:text-rose-300 ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
          <LogOut className="h-4 w-4" />
          {!isCollapsed && 'Sign out'}
        </button>
        {!isDrawer && (
          <button
            onClick={onToggleCollapsed}
            className={`mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 transition-colors hover:bg-white/[0.04] hover:text-slate-200 ${
              isCollapsed ? 'justify-center' : ''
            }`}
          >
            {isCollapsed
              ? <ChevronsRight className="h-3.5 w-3.5" />
              : <><ChevronsLeft className="h-3.5 w-3.5" /> Collapse</>}
          </button>
        )}
      </div>
    </aside>
  );
}

function NavItem({ item, active, collapsed, onClick }) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
        active ? 'bg-white/[0.06] text-white' : 'text-slate-400 hover:bg-white/[0.03] hover:text-slate-200'
      } ${collapsed ? 'justify-center px-2' : ''}`}
    >
      {active && (
        <motion.span
          layoutId="admin-nav-active"
          className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-gradient-to-b from-violet-400 via-cyan-400 to-blue-500"
          transition={{ duration: 0.3, ease: ease.out }}
        />
      )}
      <Icon className="h-4 w-4 shrink-0" strokeWidth={1.8} />
      {!collapsed && <span className="flex-1 text-left truncate">{item.label}</span>}
      {!collapsed && item.badge ? (
        <span className="relative grid h-5 min-w-[20px] place-items-center rounded-full bg-violet-500 px-1.5 text-[10px] font-bold text-white shadow-[0_0_12px_-1px_rgba(139,92,246,0.9)]">
          {item.badge}
        </span>
      ) : null}
      {collapsed && item.badge ? (
        <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-violet-400" />
      ) : null}
    </button>
  );
}

// Export sidebar width helper for layout offsets
export const ADMIN_SIDEBAR_WIDTH = { collapsed: 76, expanded: 256 };

// Re-export drawer wrapper used by AdminLayout
export function AdminMobileDrawer({ open, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          />
          <motion.div
            initial={{ x: -320 }} animate={{ x: 0 }} exit={{ x: -320 }}
            transition={{ duration: 0.25, ease: ease.out }}
            className="fixed inset-y-0 left-0 z-50 lg:hidden"
          >
            <AdminSidebar variant="drawer" onClose={onClose} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
