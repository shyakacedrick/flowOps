import { motion } from 'framer-motion';
import { viewport, ease, duration } from '../animations/motion';

/**
 * Reveal — fade-up on scroll into view.
 * Single-fire (once: true). Respects prefers-reduced-motion (framer-motion built-in).
 *
 * Props:
 *   - delay (number, seconds) optional stagger offset
 *   - as:    render-as element (default: div)
 */
export default function Reveal({
  children,
  delay = 0,
  className = '',
  as = 'div',
  ...rest
}) {
  const MotionTag = motion[as] || motion.div;
  const variants = {
    hidden: { opacity: 0, y: 24 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: duration.slow, ease: ease.out, delay },
    },
  };
  return (
    <MotionTag
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={viewport.once}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}
