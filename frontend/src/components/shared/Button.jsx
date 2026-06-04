// ============================================================================
//  Button
// ----------------------------------------------------------------------------
//  Single canonical button primitive. Enforces the FlowOps micro-interaction
//  spec: hover scale 1.02, active scale 0.98, 200ms ease. Variants and sizes
//  cover every dashboard need so consumers never hand-roll button styles.
// ============================================================================

import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { ease } from '../../animations/motion';

const VARIANTS = {
  primary:
    'bg-primary text-white shadow-glow border border-primary/40 hover:bg-blue-500 hover:shadow-glow-lg',
  secondary:
    'border border-white/10 bg-white/[0.04] text-slate-200 hover:border-white/20 hover:text-white',
  ghost:
    'text-slate-300 hover:bg-white/[0.04] hover:text-white',
  success:
    'border border-emerald-400/30 bg-emerald-400/10 text-emerald-300 hover:border-emerald-400/50',
  danger:
    'border border-rose-400/30 bg-rose-400/10 text-rose-300 hover:border-rose-400/50',
  warning:
    'border border-amber-400/30 bg-amber-400/10 text-amber-300 hover:border-amber-400/50',
};

const SIZES = {
  xs: 'h-7 px-2.5 text-[11px] gap-1 rounded-md',
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-lg',
  lg: 'h-12 px-5 text-base gap-2.5 rounded-xl',
};

const Button = forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
    icon: Icon,
    iconRight: IconRight,
    loading = false,
    disabled = false,
    full = false,
    className = '',
    children,
    type = 'button',
    ...rest
  },
  ref,
) {
  const inert = disabled || loading;
  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={inert}
      whileHover={inert ? undefined : { scale: 1.02, y: -1 }}
      whileTap={inert ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.18, ease: ease.out }}
      className={`inline-flex select-none items-center justify-center font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${full ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : Icon ? (
        <Icon className="h-3.5 w-3.5" />
      ) : null}
      {children}
      {!loading && IconRight ? <IconRight className="h-3.5 w-3.5" /> : null}
    </motion.button>
  );
});

export default Button;
