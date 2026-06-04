// ============================================================================
//  LoadingState
// ----------------------------------------------------------------------------
//  Reusable inline loading indicator. Three preset copy variants matching the
//  product's loading vocabulary, plus a custom message override. Subtle pulse
//  animation — never flashy, never distracting.
//
//  Usage:
//    <LoadingState variant="system" />
//    <LoadingState variant="queue" />
//    <LoadingState variant="metrics" />
//    <LoadingState message="Custom copy…" />
// ============================================================================

import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { ease } from '../animations/motion';

const PRESETS = {
  system:  'Initializing FlowOps system…',
  queue:   'Loading live queue data…',
  metrics: 'Analyzing business metrics…',
};

export default function LoadingState({
  variant = 'system',
  message,
  className = '',
  size = 'md',
}) {
  const text = message ?? PRESETS[variant] ?? PRESETS.system;

  const sizes = {
    sm: { gap: 'gap-2', icon: 'h-3 w-3', text: 'text-[11px]' },
    md: { gap: 'gap-2.5', icon: 'h-4 w-4', text: 'text-xs' },
    lg: { gap: 'gap-3', icon: 'h-5 w-5', text: 'text-sm' },
  }[size] ?? null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: ease.out }}
      className={`inline-flex items-center ${sizes.gap} rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 backdrop-blur ${className}`}
    >
      <Loader2 className={`${sizes.icon} animate-spin text-primary`} />
      <motion.span
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        className={`${sizes.text} font-medium text-slate-300`}
      >
        {text}
      </motion.span>
    </motion.div>
  );
}
