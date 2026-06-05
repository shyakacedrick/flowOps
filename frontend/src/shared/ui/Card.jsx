// ============================================================================
//  Card
// ----------------------------------------------------------------------------
//  Canonical container surface. Implements the FlowOps card micro-interaction:
//  hover lift -2px, soft glow border, deeper shadow. Pass `interactive={false}`
//  to disable lift behaviour for static panels.
// ============================================================================

import { motion } from 'framer-motion';
import { ease } from '@/animations/motion';

const PADDING = {
  none: '',
  sm:   'p-3',
  md:   'p-4',
  lg:   'p-5',
  xl:   'p-6',
};

export default function Card({
  as = 'div',
  padding = 'lg',
  interactive = false,
  glow = false,
  className = '',
  children,
  ...rest
}) {
  const base =
    'rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl';
  const glowCls = glow ? 'shadow-glow' : 'shadow-2xl shadow-black/20';
  const padCls = PADDING[padding] ?? PADDING.lg;

  if (interactive) {
    return (
      <motion.div
        whileHover={{ y: -3, borderColor: 'rgba(59,130,246,0.35)' }}
        transition={{ duration: 0.22, ease: ease.out }}
        className={`${base} ${glowCls} ${padCls} transition-shadow duration-200 hover:shadow-glow ${className}`}
        {...rest}
      >
        {children}
      </motion.div>
    );
  }

  const Tag = as;
  return (
    <Tag className={`${base} ${glowCls} ${padCls} ${className}`} {...rest}>
      {children}
    </Tag>
  );
}
