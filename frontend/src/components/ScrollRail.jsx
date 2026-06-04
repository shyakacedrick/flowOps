import { motion, useScroll, useSpring, useTransform } from 'framer-motion';

/**
 * ScrollRail — minimal scroll tracker:
 *  1. A gradient progress beam pinned to the very top of the viewport.
 *  2. A floor-to-ceiling vertical line on the left side. A gradient fill
 *     grows top → bottom along the line in sync with page scroll.
 */
// eslint-disable-next-line no-unused-vars
export default function ScrollRail({ sections } = {}) {
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 24,
    restDelta: 0.001,
  });
  const progressWidth = useTransform(progress, (v) => `${v * 100}%`);
  const progressScaleY = progress; // 0 → 1

  return (
    <>
      {/* Top progress bar */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-gradient-to-r from-primary via-secondary to-primary shadow-[0_0_12px_rgba(34,211,238,0.6)]"
        style={{ width: progressWidth }}
      />

      {/* Full-height vertical line — clean, no dots */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-y-0 left-8 z-50 hidden w-px lg:block xl:left-10"
      >
        <div className="absolute inset-y-24">
          {/* Static track */}
          <div className="absolute inset-0 w-px bg-gradient-to-b from-white/0 via-white/10 to-white/0" />
          {/* Scroll-driven gradient fill (top → bottom) */}
          <motion.div
            style={{ scaleY: progressScaleY }}
            className="absolute inset-0 w-px origin-top bg-gradient-to-b from-primary via-secondary to-primary shadow-[0_0_10px_rgba(34,211,238,0.55)]"
          />
        </div>
      </div>
    </>
  );
}
