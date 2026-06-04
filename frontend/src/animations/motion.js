// FlowOps motion system
// Centralized Framer Motion variants & easings.
// Goal: Stripe / Linear / Vercel-level polish — subtle, functional, consistent.
//
// Rules:
//   - Easings are smooth `easeOut`-family curves (no springs that overshoot).
//   - Durations live in a small scale: fast 0.2s, base 0.45s, slow 0.7s.
//   - All viewport reveals fire once and respect prefers-reduced-motion automatically
//     when consumers pass `viewport={viewport.once}`.

// ---------- design tokens ----------

export const ease = {
  out:    [0.22, 1, 0.36, 1],          // smooth, premium ease-out
  inOut:  [0.65, 0, 0.35, 1],
  spring: { type: 'spring', stiffness: 260, damping: 26, mass: 0.6 },
};

export const duration = {
  fast: 0.2,
  base: 0.45,
  slow: 0.7,
};

export const viewport = {
  // Use as: <motion.div viewport={viewport.once} ...>
  once: { once: true, margin: '0px 0px -10% 0px', amount: 0.2 },
  loose: { once: true, margin: '0px 0px -5% 0px', amount: 0.1 },
};

// ---------- core variants ----------

// 1. FADE UP — primary section-entry variant
export const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.slow, ease: ease.out },
  },
};

// 2. FADE IN — for simple appearance (no movement)
export const fadeIn = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: duration.base, ease: ease.out },
  },
};

// 3. STAGGER CONTAINER — orchestrates child reveals
export const staggerContainer = (stagger = 0.08, delayChildren = 0.05) => ({
  hidden: {},
  show: {
    transition: {
      staggerChildren: stagger,
      delayChildren,
    },
  },
});

// Default child for a stagger container (uses fadeUp-style motion)
export const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.base, ease: ease.out },
  },
};

// 4. CARD HOVER — subtle lift, no bounce
export const cardHover = {
  rest:  { y: 0, scale: 1, transition: { duration: duration.fast, ease: ease.out } },
  hover: { y: -4, scale: 1.015, transition: { duration: 0.25, ease: ease.out } },
  tap:   { scale: 0.99, transition: { duration: 0.12, ease: ease.out } },
};

// 5. PAGE TRANSITION — used at the root for initial paint
export const pageTransition = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: ease.out },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.3, ease: ease.out },
  },
};

// 6. QUEUE ITEM — enter/exit for live queue lists (use with AnimatePresence + layout)
export const queueItem = {
  hidden: { opacity: 0, x: -18, scale: 0.97 },
  show: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 0.35, ease: ease.out },
  },
  exit: {
    opacity: 0,
    x: 24,
    scale: 0.97,
    transition: { duration: 0.28, ease: ease.out },
  },
};

// 7. KPI VALUE — animation trigger for metric updates
//    Use as a `key` change on motion.span to retrigger.
export const kpiValue = {
  hidden: { opacity: 0, y: 6 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: ease.out },
  },
};

// 8. PULSE — "live system" indicator (looping)
export const pulseDot = {
  animate: {
    scale: [1, 1.35, 1],
    opacity: [0.9, 0.3, 0.9],
    transition: {
      duration: 1.8,
      ease: ease.inOut,
      repeat: Infinity,
    },
  },
};

// Soft floating ambient motion (for glows / decorative blobs only)
export const floatSlow = {
  animate: {
    y: [0, -10, 0],
    transition: { duration: 6, ease: ease.inOut, repeat: Infinity },
  },
};

// ---------- helpers ----------

// Build a staggered list of fadeUp items inline
export const fadeUpItem = (delay = 0) => ({
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.base, ease: ease.out, delay },
  },
});
