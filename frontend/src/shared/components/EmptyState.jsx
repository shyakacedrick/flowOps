// ============================================================================
//  EmptyState
// ----------------------------------------------------------------------------
//  A consistent, on-brand "nothing here yet" surface for any panel that may
//  load before data arrives. Intentional, calm, and never broken-looking.
//
//  Design contract
//  ---------------
//   • Subtle illustration: a soft glow-ring around the icon (Tailwind only)
//   • Clear title + short description
//   • Optional CTA button (primary or ghost variant)
//   • Optional "hint" pill underneath for tertiary context
//   • Sizes: sm | md | lg — drop into tight cards or full panel bodies
//   • Animates in with fade + soft scale; never blocks the UI
//
//  Usage
//  -----
//     <EmptyState
//        icon={Users}
//        title="No customers in queue"
//        message="The queue is currently empty. New customers will appear here in real time."
//        cta={{ label: 'Add demo customer', onClick: handleAdd }}
//     />
// ============================================================================

import { motion } from 'framer-motion';
import { ease } from '@/animations/motion';

const SIZE_MAP = {
  sm: {
    wrap:  'py-6 px-4',
    icon:  'h-10 w-10',
    ring:  'h-20 w-20',
    iconSize: 'h-5 w-5',
    title: 'text-sm',
    msg:   'text-[11px]',
    gap:   'gap-2',
  },
  md: {
    wrap:  'py-10 px-6',
    icon:  'h-14 w-14',
    ring:  'h-28 w-28',
    iconSize: 'h-7 w-7',
    title: 'text-base',
    msg:   'text-xs',
    gap:   'gap-3',
  },
  lg: {
    wrap:  'py-14 px-8',
    icon:  'h-16 w-16',
    ring:  'h-32 w-32',
    iconSize: 'h-8 w-8',
    title: 'text-lg',
    msg:   'text-sm',
    gap:   'gap-4',
  },
};

const TONE_MAP = {
  default: { ring: 'border-white/[0.06]',     glow: 'bg-primary/5',     icon: 'text-primary'      },
  success: { ring: 'border-emerald-400/15',   glow: 'bg-emerald-400/5', icon: 'text-emerald-300'  },
  warning: { ring: 'border-amber-400/15',     glow: 'bg-amber-400/5',   icon: 'text-amber-300'    },
  info:    { ring: 'border-cyan-400/15',      glow: 'bg-cyan-400/5',    icon: 'text-cyan-300'     },
  violet:  { ring: 'border-violet-400/15',    glow: 'bg-violet-400/5',  icon: 'text-violet-300'   },
};

export default function EmptyState({
  icon: Icon,
  title,
  message,
  hint,
  cta,           // { label, onClick, variant: 'primary' | 'ghost' }
  size = 'md',
  tone = 'default',
  className = '',
}) {
  const s = SIZE_MAP[size] ?? SIZE_MAP.md;
  const t = TONE_MAP[tone] ?? TONE_MAP.default;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: ease.out }}
      className={`flex flex-col items-center justify-center text-center ${s.wrap} ${s.gap} ${className}`}
    >
      {/* Subtle illustration — three layered rings + glow halo + icon */}
      {Icon && (
        <div className="relative grid place-items-center">
          {/* Outer dashed pulse ring */}
          <motion.span
            aria-hidden
            animate={{ rotate: 360 }}
            transition={{ duration: 28, ease: 'linear', repeat: Infinity }}
            className={`absolute ${s.ring} rounded-full border border-dashed ${t.ring}`}
          />
          {/* Soft glow halo */}
          <motion.span
            aria-hidden
            animate={{ opacity: [0.4, 0.7, 0.4], scale: [0.95, 1.05, 0.95] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
            className={`absolute ${s.ring} rounded-full blur-2xl ${t.glow}`}
          />
          {/* Inner icon plate */}
          <div className={`relative grid ${s.icon} place-items-center rounded-2xl border border-white/[0.08] bg-white/[0.03] shadow-inner ${t.icon}`}>
            <Icon className={s.iconSize} strokeWidth={1.7} />
          </div>
        </div>
      )}

      {/* Copy */}
      <div className="max-w-sm space-y-1.5">
        {title && (
          <h3 className={`${s.title} font-semibold text-white`}>{title}</h3>
        )}
        {message && (
          <p className={`${s.msg} leading-relaxed text-slate-400`}>{message}</p>
        )}
      </div>

      {/* CTA */}
      {cta?.label && (
        <button
          type="button"
          onClick={cta.onClick}
          className={
            cta.variant === 'ghost'
              ? 'mt-1 inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3.5 py-2 text-xs font-medium text-slate-200 transition-colors hover:border-white/20 hover:text-white'
              : 'mt-1 inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/15 px-3.5 py-2 text-xs font-semibold text-primary transition-colors hover:border-primary/60 hover:bg-primary/25 hover:text-white'
          }
        >
          {cta.icon ? <cta.icon className="h-3.5 w-3.5" /> : null}
          {cta.label}
        </button>
      )}

      {/* Tertiary hint */}
      {hint && (
        <span className="mt-1 rounded-full border border-white/[0.06] bg-white/[0.02] px-2.5 py-0.5 text-[10px] uppercase tracking-widest text-slate-500">
          {hint}
        </span>
      )}
    </motion.div>
  );
}
