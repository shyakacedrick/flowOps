// ============================================================================
//  StatusIndicator
// ----------------------------------------------------------------------------
//  Canonical "live system" pulse. Subtle breathing dot + ping ring + label.
//  Replaces every ad-hoc LivePulse implementation across dashboards so we
//  speak the same visual language everywhere.
//
//  Status tokens
//  -------------
//    live    — green, animated ping (default)
//    paused  — amber, no animation
//    idle    — slate, soft breathing
//    error   — rose, fast pulse
// ============================================================================

import { motion } from 'framer-motion';

const TOKENS = {
  live: {
    dot:    'bg-emerald-400',
    ping:   'bg-emerald-400',
    border: 'border-emerald-400/30',
    bg:     'bg-emerald-400/10',
    text:   'text-emerald-300',
    label:  'Live',
    animate: true,
  },
  paused: {
    dot:    'bg-amber-400',
    ping:   'bg-amber-400',
    border: 'border-amber-400/30',
    bg:     'bg-amber-400/10',
    text:   'text-amber-300',
    label:  'Paused',
    animate: false,
  },
  idle: {
    dot:    'bg-slate-400',
    ping:   'bg-slate-400',
    border: 'border-white/10',
    bg:     'bg-white/[0.04]',
    text:   'text-slate-300',
    label:  'Idle',
    animate: 'breathe',
  },
  error: {
    dot:    'bg-rose-400',
    ping:   'bg-rose-400',
    border: 'border-rose-400/30',
    bg:     'bg-rose-400/10',
    text:   'text-rose-300',
    label:  'Error',
    animate: true,
  },
};

const SIZES = {
  sm: { wrap: 'px-2 py-0.5 text-[10px]', dot: 'h-1.5 w-1.5' },
  md: { wrap: 'px-3 py-1 text-[11px]',   dot: 'h-2 w-2'    },
  lg: { wrap: 'px-3.5 py-1.5 text-xs',   dot: 'h-2.5 w-2.5'},
};

export default function StatusIndicator({
  status = 'live',
  label,
  size = 'md',
  showLabel = true,
  className = '',
}) {
  const t = TOKENS[status] ?? TOKENS.live;
  const s = SIZES[size] ?? SIZES.md;
  const txt = label ?? t.label;

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border font-medium ${t.border} ${t.bg} ${t.text} ${s.wrap} ${className}`}
    >
      <span className={`relative flex ${s.dot}`}>
        {t.animate === true && (
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-70 ${t.ping}`}
          />
        )}
        {t.animate === 'breathe' ? (
          <motion.span
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            className={`relative inline-flex ${s.dot} rounded-full ${t.dot}`}
          />
        ) : (
          <span className={`relative inline-flex ${s.dot} rounded-full ${t.dot}`} />
        )}
      </span>
      {showLabel && <span>{txt}</span>}
    </span>
  );
}
