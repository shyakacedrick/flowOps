import { useEffect, useState } from 'react';

/**
 * useActiveSection
 * Returns the id of the section currently in view.
 *
 * Strategy: IntersectionObserver with a top-biased rootMargin so the active
 * section is the one whose top has crossed ~30% of the viewport. Stable across
 * fast scrolls because we re-resolve by sorting visible entries by their top.
 */
export function useActiveSection(ids, { rootMargin = '-30% 0px -55% 0px' } = {}) {
  const [active, setActive] = useState(ids[0] || null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    if (elements.length === 0) return;

    const visible = new Map();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visible.set(entry.target.id, entry.intersectionRatio);
          } else {
            visible.delete(entry.target.id);
          }
        }
        if (visible.size > 0) {
          // pick the topmost visible section (smallest boundingClientRect.top above viewport-mid)
          const topId = [...visible.keys()].reduce((best, id) => {
            const el = document.getElementById(id);
            if (!el) return best;
            const top = el.getBoundingClientRect().top;
            if (!best) return { id, top };
            return top > -1 && top < best.top ? { id, top } : best;
          }, null);
          if (topId) setActive(topId.id);
        }
      },
      { rootMargin, threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [ids.join('|'), rootMargin]); // eslint-disable-line react-hooks/exhaustive-deps

  return active;
}
