import { motion } from 'framer-motion';
import { staggerContainer, staggerItem, viewport } from '@/animations/motion';

/**
 * Stagger — orchestrates a row/grid reveal where children fade-up in sequence.
 *
 * Usage:
 *   <Stagger className="grid ...">
 *     <Stagger.Item>...</Stagger.Item>
 *     <Stagger.Item>...</Stagger.Item>
 *   </Stagger>
 */
export default function Stagger({
  children,
  className = '',
  as = 'div',
  stagger = 0.08,
  delayChildren = 0.05,
  ...rest
}) {
  const MotionTag = motion[as] || motion.div;
  return (
    <MotionTag
      className={className}
      variants={staggerContainer(stagger, delayChildren)}
      initial="hidden"
      whileInView="show"
      viewport={viewport.once}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}

function Item({ children, className = '', as = 'div', ...rest }) {
  const MotionTag = motion[as] || motion.div;
  return (
    <MotionTag className={className} variants={staggerItem} {...rest}>
      {children}
    </MotionTag>
  );
}

Stagger.Item = Item;
