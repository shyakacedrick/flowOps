import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  BarChart3,
  Headphones,
  ShieldCheck,
  Loader2,
  Check,
  Sparkles,
} from 'lucide-react';
import Logo from '../components/Logo.jsx';
import RoleTransitionLoader from '../components/RoleTransitionLoader.jsx';
import { ROLES, useAuth } from '../auth/AuthContext.jsx';
import { ease, staggerContainer, staggerItem } from '../animations/motion.js';

const ROLE_CARDS = [
  {
    role: ROLES.BUSINESS_OWNER,
    title: 'Business Owner',
    subtitle: 'Manage your business performance and analytics.',
    points: ['Wait-time & efficiency KPIs', 'Peak-hour insights', 'Multi-location overview'],
    icon: BarChart3,
    tint: 'from-primary/25 to-primary/0 text-primary',
    ring: 'hover:border-primary/50 hover:shadow-glow',
    glow: 'bg-primary/20',
  },
  {
    role: ROLES.STAFF,
    title: 'Staff Operator',
    subtitle: 'Control live queues and serve customers efficiently.',
    points: ['Call the next customer', 'Live queue updates', 'Skip & re-queue actions'],
    icon: Headphones,
    tint: 'from-secondary/25 to-secondary/0 text-secondary',
    ring: 'hover:border-secondary/50 hover:shadow-glow-cyan',
    glow: 'bg-secondary/20',
    recommended: true,
  },
  {
    role: ROLES.ADMIN,
    title: 'Platform Admin',
    subtitle: 'View system-wide platform insights.',
    points: ['All tenants overview', 'System-level metrics', 'Aggregated activity'],
    icon: ShieldCheck,
    tint: 'from-emerald-400/25 to-emerald-400/0 text-emerald-400',
    ring: 'hover:border-emerald-400/50 hover:shadow-[0_0_40px_rgba(52,211,153,0.25)]',
    glow: 'bg-emerald-400/20',
  },
];

function RoleCard({ card, onSelect, busy, selected }) {
  const Icon = card.icon;
  const isThisBusy = busy === card.role;
  const isOther = busy && busy !== card.role;
  return (
    <motion.button
      type="button"
      onClick={() => onSelect(card.role)}
      disabled={Boolean(busy)}
      variants={staggerItem}
      whileHover={busy ? {} : { y: -4, scale: 1.015 }}
      whileTap={busy ? {} : { scale: 0.99 }}
      transition={{ duration: 0.2, ease: ease.out }}
      className={`group relative w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 text-left backdrop-blur-xl transition-all duration-300 ${card.ring} ${
        isOther ? 'opacity-40' : ''
      }`}
    >
      {/* tint glow */}
      <div className={`pointer-events-none absolute -top-16 -right-10 h-40 w-40 rounded-full ${card.glow} blur-3xl opacity-40 transition-opacity duration-500 group-hover:opacity-70`} />

      <div className="relative flex items-start gap-4">
        <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-white/10 bg-gradient-to-br ${card.tint}`}>
          <Icon className="h-5 w-5" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-white">{card.title}</h3>
            {card.recommended && (
              <span className="rounded-full border border-secondary/30 bg-secondary/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-secondary">
                Recommended
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-400">{card.subtitle}</p>
          <ul className="mt-3 space-y-1">
            {card.points.map((p) => (
              <li key={p} className="flex items-center gap-2 text-xs text-slate-400">
                <span className="grid h-3.5 w-3.5 place-items-center rounded-full bg-white/[0.06] text-slate-300">
                  <Check className="h-2 w-2" strokeWidth={3} />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-slate-400 transition-colors group-hover:border-white/20 group-hover:text-white">
          <AnimatePresence mode="wait" initial={false}>
            {isThisBusy ? (
              <motion.span
                key="spin"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ duration: 0.2 }}
              >
                <Loader2 className="h-4 w-4 animate-spin" />
              </motion.span>
            ) : selected ? (
              <motion.span
                key="check"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ duration: 0.2 }}
              >
                <Check className="h-4 w-4 text-emerald-400" />
              </motion.span>
            ) : (
              <motion.span
                key="arrow"
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 4 }}
                transition={{ duration: 0.2 }}
              >
                <ArrowRight className="h-4 w-4" />
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.button>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [busy, setBusy] = useState(null);

  // Premium boot sequence: 1100ms while the RoleTransitionLoader walks through
  // its three stages, then we sign in and hand off to the dashboard router.
  const BOOT_MS = 1100;

  const handleSelect = (role) => {
    if (busy) return;
    setBusy(role);
    setTimeout(() => {
      signIn(role);
      navigate('/dashboard', { replace: true });
    }, BOOT_MS);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-bg text-slate-200">
      {/* Premium role-switch loader — takes over while we 'configure the workspace' */}
      <AnimatePresence>
        {busy && <RoleTransitionLoader role={busy} duration={BOOT_MS} />}
      </AnimatePresence>

      {/* Login surface fades to dimmed while the loader is up */}
      <motion.div
        animate={{ opacity: busy ? 0.25 : 1, filter: busy ? 'blur(2px)' : 'blur(0px)' }}
        transition={{ duration: 0.4, ease: ease.out }}
      >
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[600px] w-[1100px] -translate-x-1/2 rounded-full bg-primary/10 blur-[140px]" />
        <div className="absolute top-[35%] -left-40 h-[500px] w-[500px] rounded-full bg-secondary/10 blur-[140px]" />
        <div className="absolute -bottom-20 right-0 h-[420px] w-[420px] rounded-full bg-primary/10 blur-[120px]" />
      </div>

      {/* Top bar */}
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 sm:px-8 lg:px-12">
        <Link to="/" className="inline-block"><Logo /></Link>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-white/20 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to site
        </Link>
      </div>

      <div className="mx-auto grid w-full max-w-7xl gap-12 px-6 pb-16 sm:px-8 lg:grid-cols-12 lg:gap-16 lg:px-12 lg:pb-24 lg:pt-8">
        {/* Left — brand & value */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: ease.out }}
          className="lg:col-span-5 lg:pt-12"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-300">
            <Sparkles className="h-3.5 w-3.5 text-secondary" />
            Welcome back
          </span>
          <h1 className="mt-6 text-4xl font-bold leading-tight text-white sm:text-5xl">
            Sign in to your{' '}
            <span className="bg-gradient-to-r from-primary via-blue-400 to-secondary bg-clip-text text-transparent">
              FlowOps
            </span>{' '}
            workspace.
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-slate-400">
            Smart queue management and business intelligence for modern service
            businesses. Choose a role to enter the workspace that fits how you
            work.
          </p>

          <div className="mt-10 space-y-3 border-t border-white/[0.06] pt-8">
            {[
              'Single sign-on across every location',
              'Role-based dashboards out of the box',
              'No setup required — try it instantly',
            ].map((t) => (
              <div key={t} className="flex items-center gap-2.5 text-sm text-slate-300">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-primary/15 text-primary">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                {t}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right — role selection */}
        <motion.div
          variants={staggerContainer(0.1, 0.2)}
          initial="hidden"
          animate="show"
          className="lg:col-span-7"
        >
          <motion.div variants={staggerItem} className="mb-5">
            <p className="text-sm font-semibold text-white">Continue as</p>
            <p className="text-xs text-slate-500">
              This is a simulated workspace — no password required.
            </p>
          </motion.div>

          <div className="space-y-3">
            {ROLE_CARDS.map((card) => (
              <RoleCard
                key={card.role}
                card={card}
                onSelect={handleSelect}
                busy={busy}
                selected={false}
              />
            ))}
          </div>

          {/* loading status — inline pill kept as a fallback signal under the cards */}
          <AnimatePresence>
            {busy && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25, ease: ease.out }}
                className="mt-5 flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-xs text-slate-300 backdrop-blur"
              >
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                Configuring your workspace…
              </motion.div>
            )}
          </AnimatePresence>

          <p className="mt-6 text-center text-xs text-slate-500">
            By continuing you agree to our terms & privacy policy.
          </p>
        </motion.div>
      </div>
      </motion.div>
    </div>
  );
}
