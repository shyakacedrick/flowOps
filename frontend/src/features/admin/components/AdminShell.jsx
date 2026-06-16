import { useEffect, useState } from 'react';
import { Search, Menu, Command, Globe2 } from 'lucide-react';
import AdminSidebar, { AdminMobileDrawer } from '@/features/admin/components/AdminSidebar.jsx';
import UserMenu from '@/shared/components/UserMenu.jsx';
import NotificationsMenu from '@/shared/components/NotificationsMenu.jsx';
import { ROUTES } from '@/shared/constants/routes.js';

/**
 * AdminLayout — page wrapper for every /admin/* route.
 * Pairs the AdminSidebar with a sticky top bar (search, env, notifications,
 * profile) and a content region that respects the sidebar's collapsed state.
 */
export default function AdminLayout({ children }) {
  // Persist collapsed state across navigations.
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('flowops:admin:collapsed') === '1';
  });
  useEffect(() => {
    window.localStorage.setItem('flowops:admin:collapsed', collapsed ? '1' : '0');
  }, [collapsed]);

  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-200">
      <AdminSidebar
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((v) => !v)}
      />
      <AdminMobileDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className={`transition-[padding] duration-200 ${collapsed ? 'lg:pl-[76px]' : 'lg:pl-64'}`}>
        <div className="relative pb-20">
          {/* ambient glow */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-24 left-1/3 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-violet-500/[0.06] blur-[140px]" />
            <div className="absolute top-40 right-0 h-[320px] w-[420px] rounded-full bg-cyan-500/[0.05] blur-[120px]" />
          </div>

          {/* Sticky top bar */}
          <header className="sticky top-0 z-20 border-b border-white/[0.04] bg-[#0B1120]/85 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3 px-4 py-3.5 sm:gap-4 sm:px-6 lg:px-8">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <button
                  onClick={() => setMobileOpen(true)}
                  aria-label="Open menu"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 text-slate-300 lg:hidden"
                >
                  <Menu className="h-4 w-4" />
                </button>
                <div className="relative hidden w-full max-w-md items-center md:flex">
                  <Search className="pointer-events-none absolute left-3 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search organizations, users, logs, tickets…"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 pl-9 pr-12 text-sm text-slate-200 placeholder:text-slate-500 focus:border-violet-400/40 focus:outline-none"
                  />
                  <kbd className="pointer-events-none absolute right-3 inline-flex items-center gap-0.5 rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
                    <Command className="h-2.5 w-2.5" /> K
                  </kbd>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                <button className="hidden items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[11px] font-semibold text-slate-300 hover:bg-white/[0.08] md:inline-flex">
                  <Globe2 className="h-3.5 w-3.5 text-violet-300" />
                  Region · US-East
                </button>
                <NotificationsMenu seeAllPath={ROUTES.admin.auditLogs} accent="violet" />
                <UserMenu
                  settingsPath={ROUTES.admin.settings}
                  gradient="from-violet-500 via-cyan-400 to-blue-500"
                  nameTone="text-violet-300/80"
                />
              </div>
            </div>
          </header>

          <main className="relative px-4 pt-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
