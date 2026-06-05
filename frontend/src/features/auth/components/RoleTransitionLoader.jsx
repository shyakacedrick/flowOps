// ============================================================================
//  RoleTransitionLoader
// ----------------------------------------------------------------------------
//  A premium fullscreen loader shown during the role-switch handshake. Sits
//  between the login form and the dashboard mount so users see a clear,
//  product-quality "configuring your workspace" moment instead of an abrupt
//  route swap.
//
//  Behaviour
//  ---------
//   • Role-aware copy and gradient — each role gets its own color story
//   • Three-stage progress timeline (auth → preferences → workspace ready)
//   • Soft animated progress bar that fills across the supplied `duration`
//   • Mounted inside <AnimatePresence> so it can fade out smoothly
//
//  Architectural note
//  ------------------
//  Loaders are PRESENTATION only. They never call signIn() or navigate().
//  The parent owns the timing contract and the actions that follow.
// ============================================================================

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Headphones, ShieldCheck, Check, Loader2 } from 'lucide-react';
import Logo from '@/shared/components/Logo.jsx';
import { ROLES } from '@/app/providers/AuthProvider.jsx';
import { ease } from '@/animations/motion';

const ROLE_THEME = {
  [ROLES.BUSINESS_OWNER]: {
    label:   'Business Owner workspace',
    Icon:    BarChart3,
    accent:  'text-primary',
    border:  'border-primary/30',
    chip:    'bg-primary/10',
    gradient:'from-primary via-blue-400 to-secondary',
    glow:    'bg-primary/20',
    tagline: 'Calibrating analytics & KPIs',
  },
  [ROLES.STAFF]: {
    label:   'Staff operator console',
    Icon:    Headphones,
    accent:  'text-secondary',
    border:  'border-secondary/30',
    chip:    'bg-secondary/10',
    gradient:'from-secondary via-cyan-400 to-primary',
    glow:    'bg-secondary/20',
    tagline: 'Connecting to the live queue',
  },
  [ROLES.ADMIN]: {
    label:   'Platform admin console',
    Icon:    ShieldCheck,
    accent:  'text-emerald-400',
    border:  'border-emerald-400/30',
    chip:    'bg-emerald-400/10',
    gradient:'from-emerald-400 via-emerald-300 to-secondary',
    glow:    'bg-emerald-400/20',
    tagline: 'Aggregating platform telemetry',
  },
};

const STAGES = [
  'Verifying credentials',
  'Loading role preferences',
  'Initializing live workspace',
];

export default function RoleTransitionLoader({ role, duration = 1100 }) {
  const theme = ROLE_THEME[role] ?? ROLE_THEME[ROLES.STAFF];
  const { Icon } = theme;

  // Walk through the three stages over the loader's lifetime.
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const step = duration / STAGES.length;
    const timers = STAGES.map((_, i) =>
      setTimeout(() => setStage(i + 1), step * (i + 1) - 80),
    );
    return () => timers.forEach(clearTimeout);
  }, [duration]);

  return (
    <motion.div
      key="role-loader"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: ease.out }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg/90 backdrop-blur-xl"
    >
      {/* Ambient role-tinted glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className={`absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[140px] ${theme.glow}`}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0,  scale: 1 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.45, ease: ease.out }}
        className="relative w-full max-w-md px-6"
      >
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8 backdrop-blur-2xl shadow-2xl shadow-black/40">
          <div className="flex flex-col items-center text-center">
            <Logo />

            {/* Role icon with soft rotating ring */}
            <div className="relative mt-8 grid h-20 w-20 place-items-center">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                className={`absolute inset-0 rounded-2xl border ${theme.border}`}
                style={{ borderStyle: 'dashed' }}
              />
              <span className={`grid h-16 w-16 place-items-center rounded-xl border ${theme.border} ${theme.chip}`}>
                <Icon className={`h-7 w-7 ${theme.accent}`} strokeWidth={2.2} />
              </span>
            </div>

            <p className={`mt-5 text-[10px] font-bold uppercase tracking-widest ${theme.accent}`}>
              {theme.label}
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white">
              Setting up your{' '}
              <span className={`bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent`}>
                workspace
              </span>
            </h2>
            <p className="mt-2 text-sm text-slate-400">{theme.tagline}…</p>

            {/* Progress bar */}
            <div className="mt-6 h-1 w-full overflow-hidden rounded-full bg-white/[0.05]">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: duration / 1000, ease: ease.out }}
                className={`h-full rounded-full bg-gradient-to-r ${theme.gradient}`}
              />
            </div>

            {/* Stage checklist */}
            <ul className="mt-6 w-full space-y-2">
              {STAGES.map((label, i) => {
                const done    = stage > i;
                const active  = stage === i;
                return (
                  <li
                    key={label}
                    className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                      done
                        ? `${theme.border} ${theme.chip}`
                        : active
                          ? 'border-white/10 bg-white/[0.03]'
                          : 'border-white/[0.04] bg-white/[0.01]'
                    }`}
                  >
                    <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-md ${
                      done
                        ? `${theme.chip} ${theme.accent}`
                        : 'bg-white/[0.04] text-slate-500'
                    }`}>
                      {done ? (
                        <Check className="h-3 w-3" strokeWidth={3} />
                      ) : active ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
                      )}
                    </span>
                    <span className={done || active ? 'text-white' : 'text-slate-500'}>
                      {label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
