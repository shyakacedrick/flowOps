// ============================================================================
//  UserMenu — interactive profile chip with dropdown
// ----------------------------------------------------------------------------
//  Replaces the previously static avatar+name chip in every shell's top bar.
//  Click the chip to open a panel with:
//    • account card (avatar, name, email, role)
//    • shortcut to the role-appropriate Settings page
//    • Sign out (revokes refresh token + access JWT, then bounces to /login)
//
//  Dismisses on outside click, Escape, or route change. Keyboard accessible
//  (aria-expanded / aria-haspopup, focus-trap not needed for a small menu).
//
//  Props:
//    settingsPath — where the "Profile & settings" item navigates to.
//                   Caller passes ROUTES.owner.settings / ROUTES.staff.settings
//                   / ROUTES.admin.settings so this component stays role-agnostic.
//    gradient     — Tailwind gradient stops for the initials fallback.
//    align        — 'right' (default) | 'left' — panel alignment relative to chip.
//    nameTone     — Tailwind text color override for the role line in the chip
//                   (e.g. 'text-violet-300/80' for the admin theme).
// ============================================================================

import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Settings as SettingsIcon, Mail, ShieldCheck, ChevronDown } from 'lucide-react';
import { useAuth, ROLE_META } from '@/app/providers/AuthProvider.jsx';
import { useToast } from '@/shared/components/ToastProvider.jsx';
import Avatar from '@/shared/components/Avatar.jsx';

export default function UserMenu({
  settingsPath,
  gradient = 'from-cyan-400 to-blue-500',
  align = 'right',
  nameTone = 'text-slate-500',
}) {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  const meta = ROLE_META[session?.role] || {};
  const user = session?.user;
  const displayName = session?.displayName || user?.name || 'User';
  const email = session?.email || user?.email || '';
  const verified = Boolean(user?.emailVerifiedAt);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e) => {
      if (!wrapperRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  // Close on route change.
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    toast.success('Signed out');
    navigate('/login', { replace: true });
  };

  const panelSide = align === 'left' ? 'left-0' : 'right-0';

  return (
    <div ref={wrapperRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${displayName}`}
        className={`flex shrink-0 items-center gap-2 rounded-xl border bg-white/[0.04] px-2 py-1.5 transition-colors hover:bg-white/[0.08] ${
          open ? 'border-cyan-400/40' : 'border-white/10'
        }`}
      >
        <Avatar
          user={user}
          name={displayName}
          size={28}
          gradient={gradient}
        />
        <div className="hidden min-w-0 text-right sm:block">
          <p className="truncate text-xs font-semibold leading-tight text-white">
            {displayName}
          </p>
          <p className={`truncate text-[10px] leading-tight ${nameTone}`}>
            {meta.label || 'Member'}
          </p>
        </div>
        <ChevronDown
          className={`hidden h-3.5 w-3.5 text-slate-400 transition-transform sm:block ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{    opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            role="menu"
            className={`absolute ${panelSide} z-50 mt-2 w-72 max-w-[calc(100vw-1rem)] origin-top overflow-hidden rounded-2xl border border-white/10 bg-[#0B1120]/95 shadow-[0_24px_60px_-20px_rgba(2,8,23,0.9)] backdrop-blur-xl`}
          >
            {/* ── Identity header ───────────────────────────────────── */}
            <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3.5">
              <Avatar
                user={user}
                name={displayName}
                size={44}
                rounded="xl"
                gradient={gradient}
                ring="ring-1 ring-white/10"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{displayName}</p>
                <p className="flex items-center gap-1 truncate text-[11px] text-slate-400">
                  <Mail className="h-3 w-3 shrink-0" />
                  <span className="truncate">{email || '—'}</span>
                </p>
                <p className="mt-1 inline-flex items-center gap-1 rounded-md bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-semibold text-slate-300">
                  <ShieldCheck className="h-2.5 w-2.5 text-cyan-300" />
                  {meta.label || session?.role || 'Member'}
                  {verified && (
                    <span className="ml-1 text-emerald-300">· verified</span>
                  )}
                </p>
              </div>
            </div>

            {/* ── Actions ───────────────────────────────────────────── */}
            <div className="p-1.5">
              {settingsPath && (
                <Link
                  to={settingsPath}
                  role="menuitem"
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-slate-200 transition-colors hover:bg-white/[0.06]"
                  onClick={() => setOpen(false)}
                >
                  <SettingsIcon className="h-4 w-4 text-slate-400" />
                  Profile &amp; settings
                </Link>
              )}
              <button
                type="button"
                role="menuitem"
                onClick={handleSignOut}
                className="mt-1 flex w-full items-center gap-2.5 rounded-xl border-t border-white/[0.04] px-3 pt-3 pb-2 text-sm text-rose-300 transition-colors hover:bg-rose-500/[0.08]"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
