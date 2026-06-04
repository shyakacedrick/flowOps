import { useId, useMemo } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

/**
 * LogoMotif
 * ---------
 * Decorative system that re-uses the FlowOps "Zap" mark across the landing
 * page. Every variant is purely cosmetic (`pointer-events-none`, low z-index,
 * `aria-hidden`) so it never competes with content.
 *
 * Design principles applied:
 *  - Hierarchy:   hero glyphs are huge & soft; divider accents are small & sharp.
 *  - Repetition:  the same mark at many scales builds brand recall.
 *  - Rhythm:      marquee + orbit produce predictable motion cadence.
 *  - Contrast:    blurred glow halos sit behind crisp stroked marks.
 *  - Balance:     asymmetric drift fields feel organic, not pasted-on.
 *  - Motion:      idle drift, parallax via scroll, slow rotation, breathing pulse.
 */

/* ---------- Atom: the raw mark (matches public/favicon.svg geometry) ---------- */

export function ZapGlyph({
  size = 32,
  variant = 'gradient', // 'gradient' | 'outline' | 'ghost'
  stroke = 1.6,
  className = '',
  ...rest
}) {
  const id = useId();
  const isOutline = variant === 'outline';
  const isGhost = variant === 'ghost';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
      className={className}
      {...rest}
    >
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#22D3EE" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id={`${id}-stroke`} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#67E8F9" />
          <stop offset="100%" stopColor="#60A5FA" />
        </linearGradient>
      </defs>

      {!isOutline && !isGhost && (
        <rect x="0" y="0" width="32" height="32" rx="8" fill={`url(#${id}-bg)`} />
      )}
      {isOutline && (
        <rect
          x="0.75"
          y="0.75"
          width="30.5"
          height="30.5"
          rx="7.25"
          fill="none"
          stroke={`url(#${id}-stroke)`}
          strokeWidth="1.5"
        />
      )}

      <path
        d="M18 6 L9 18 L15 18 L14 26 L23 14 L17 14 Z"
        fill={isGhost ? 'none' : isOutline ? 'none' : '#0F172A'}
        stroke={isGhost || isOutline ? `url(#${id}-stroke)` : 'none'}
        strokeWidth={stroke}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ---------- Variant: ambient floating field (hero / large empty sections) ---------- */

const FIELD_NODES = [
  { x: '6%',  y: '12%', size: 56,  rot: -14, op: 0.07, blur: 1,  delay: 0,    dur: 9 },
  { x: '88%', y: '8%',  size: 38,  rot:  18, op: 0.10, blur: 0,  delay: 0.8,  dur: 7 },
  { x: '78%', y: '70%', size: 72,  rot: -8,  op: 0.05, blur: 1.5, delay: 0.3, dur: 11 },
  { x: '12%', y: '78%', size: 44,  rot:  22, op: 0.08, blur: 0,  delay: 1.4,  dur: 8 },
  { x: '48%', y: '38%', size: 120, rot: -6,  op: 0.035, blur: 3, delay: 0.6,  dur: 13 },
  { x: '92%', y: '45%', size: 26,  rot:  4,  op: 0.14, blur: 0,  delay: 1.0,  dur: 6 },
  { x: '24%', y: '46%', size: 30,  rot: -20, op: 0.12, blur: 0,  delay: 1.7,  dur: 7.5 },
];

export function LogoField({ density = 1, className = '' }) {
  const nodes = useMemo(
    () => FIELD_NODES.slice(0, Math.max(3, Math.round(FIELD_NODES.length * density))),
    [density]
  );
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      {nodes.map((n, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            left: n.x,
            top: n.y,
            opacity: n.op,
            filter: n.blur ? `blur(${n.blur}px)` : undefined,
          }}
          initial={{ y: 0, rotate: n.rot }}
          animate={{ y: [0, -14, 0, 10, 0], rotate: [n.rot, n.rot + 6, n.rot - 4, n.rot] }}
          transition={{
            duration: n.dur,
            delay: n.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <ZapGlyph size={n.size} variant={i % 3 === 0 ? 'gradient' : i % 3 === 1 ? 'outline' : 'ghost'} />
        </motion.div>
      ))}
    </div>
  );
}

/* ---------- Variant: hero showcase — giant glowing mark with parallax + pulse ---------- */

export function LogoHaloHero({ className = '' }) {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 600], [0, -120]);
  const rot = useTransform(scrollY, [0, 600], [0, 12]);

  return (
    <motion.div
      aria-hidden
      style={{ y, rotate: rot }}
      className={`pointer-events-none absolute -right-16 -top-10 hidden lg:block ${className}`}
    >
      {/* glow halo */}
      <motion.div
        className="absolute inset-0 -z-10 rounded-[64px] bg-gradient-to-br from-cyan-400/30 via-blue-500/20 to-transparent blur-3xl"
        animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.05, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        animate={{ y: [0, -8, 0], rotate: [-3, 3, -3] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <ZapGlyph size={220} variant="gradient" className="drop-shadow-[0_0_40px_rgba(34,211,238,0.45)]" />
      </motion.div>
    </motion.div>
  );
}

/* ---------- Variant: section divider — three marks in a measured cadence ---------- */

export function LogoDivider({ className = '' }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none mx-auto flex max-w-7xl items-center justify-center gap-6 py-10 ${className}`}
    >
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      {[
        { size: 14, variant: 'ghost', delay: 0 },
        { size: 22, variant: 'gradient', delay: 0.2 },
        { size: 14, variant: 'outline', delay: 0.4 },
      ].map((m, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, scale: 0.6 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, delay: m.delay, ease: [0.16, 1, 0.3, 1] }}
        >
          <ZapGlyph size={m.size} variant={m.variant} />
        </motion.span>
      ))}
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
}

/* ---------- Variant: marquee — continuous brand-recall strip ---------- */

export function LogoMarquee({ className = '' }) {
  const items = Array.from({ length: 14 });
  return (
    <div
      aria-hidden
      className={`pointer-events-none relative overflow-hidden py-6 [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)] ${className}`}
    >
      <motion.div
        className="flex w-[200%] items-center gap-12"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 38, repeat: Infinity, ease: 'linear' }}
      >
        {items.concat(items).map((_, i) => {
          const v = i % 3 === 0 ? 'gradient' : i % 3 === 1 ? 'outline' : 'ghost';
          const s = 18 + ((i * 7) % 18);
          return (
            <span key={i} className="opacity-30">
              <ZapGlyph size={s} variant={v} />
            </span>
          );
        })}
      </motion.div>
    </div>
  );
}

/* ---------- Variant: orbit badge — small section eyebrow accent ---------- */

export function LogoOrbit({ size = 56, className = '' }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none relative grid place-items-center ${className}`}
      style={{ width: size * 2, height: size * 2 }}
    >
      {/* orbit ring */}
      <motion.span
        className="absolute inset-0 rounded-full border border-dashed border-white/10"
        animate={{ rotate: 360 }}
        transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
      >
        <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-secondary shadow-[0_0_12px_3px_rgba(34,211,238,0.7)]" />
      </motion.span>
      {/* breathing glow */}
      <motion.span
        className="absolute h-2/3 w-2/3 rounded-full bg-cyan-400/20 blur-2xl"
        animate={{ opacity: [0.4, 0.8, 0.4], scale: [0.9, 1.1, 0.9] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <ZapGlyph size={size} variant="gradient" />
    </div>
  );
}

/* ---------- Variant: corner watermark — quiet brand stamp on tall sections ---------- */

export function LogoWatermark({ corner = 'bottom-right', className = '' }) {
  const pos = {
    'top-left': 'left-8 top-8',
    'top-right': 'right-8 top-8',
    'bottom-left': 'left-8 bottom-8',
    'bottom-right': 'right-8 bottom-8',
  }[corner];
  return (
    <motion.div
      aria-hidden
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 0.06 }}
      viewport={{ once: true }}
      transition={{ duration: 1 }}
      className={`pointer-events-none absolute ${pos} ${className}`}
    >
      <ZapGlyph size={180} variant="outline" />
    </motion.div>
  );
}
