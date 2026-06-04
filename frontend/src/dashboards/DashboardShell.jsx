import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LogOut,
  Bell,
  Search,
  ChevronDown,
} from 'lucide-react';
import Logo from '../components/Logo.jsx';
import { LiveActivityFeedDock } from '../components/LiveActivityFeed.jsx';
import { ROLE_META, useAuth } from '../auth/AuthContext.jsx';
import { ease } from '../animations/motion.js';

export default function DashboardShell({ navItems, activeKey, onNav, children }) {
  const navigate = useNavigate();
  const { session, signOut } = useAuth();
  const meta = ROLE_META[session?.role] || {};

  const initials = (session?.displayName || 'FO')
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('');

  const handleSignOut = () => {
    signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="relative min-h-screen bg-bg text-slate-200">
      {/* ambient glow */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[1000px] -translate-x-1/2 rounded-full bg-primary/[0.07] blur-[140px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-secondary/[0.06] blur-[120px]" />
      </div>

      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-white/[0.06] bg-slate-950/60 px-4 py-6 backdrop-blur-xl lg:flex">
        <Link to="/" className="px-2"><Logo /></Link>
        <div className="mt-2 px-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            {meta.workspace}
          </p>
          <p className="mt-0.5 truncate text-sm font-semibold text-white">
            {session?.orgName}
          </p>
        </div>

        <nav className="mt-8 flex-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.key === activeKey;
            return (
              <button
                key={item.key}
                onClick={() => onNav(item.key)}
                className={`relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-white/[0.05] text-white'
                    : 'text-slate-400 hover:bg-white/[0.03] hover:text-slate-200'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-gradient-to-b from-primary to-secondary"
                    transition={{ duration: 0.3, ease: ease.out }}
                  />
                )}
                <Icon className="h-4 w-4" strokeWidth={2} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-white/[0.03] hover:text-rose-300"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </aside>

      {/* Main */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-bg/70 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4 px-6 py-3 sm:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <div className="lg:hidden"><Logo /></div>
              <div className="relative hidden flex-1 max-w-md sm:block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search customers, services, locations…"
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] py-2 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-primary/40 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="grid h-9 w-9 place-items-center rounded-lg border border-white/[0.08] bg-white/[0.02] text-slate-300 hover:border-white/20 hover:text-white">
                <Bell className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.02] px-2.5 py-1.5">
                <span className="grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br from-primary to-secondary text-xs font-bold text-white">
                  {initials}
                </span>
                <div className="hidden text-right sm:block">
                  <p className="text-xs font-semibold leading-tight text-white">
                    {session?.displayName}
                  </p>
                  <p className="text-[10px] leading-tight text-slate-500">{meta.label}</p>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-6 py-8 sm:px-8">
          <motion.div
            key={activeKey}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: ease.out }}
          >
            {children}
          </motion.div>
        </main>
      </div>
      <LiveActivityFeedDock />
    </div>
  );
}
