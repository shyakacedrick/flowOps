// ============================================================================
//  WakingSplash — full-screen overlay shown during a backend cold start
// ----------------------------------------------------------------------------
//  Why this exists: the API runs on Render's free tier. After 15 min idle the
//  dyno sleeps; the next request takes 30–50 s to wake. Without feedback the
//  app appears frozen on first load and visitors bounce.
//
//  How it works:
//    1. `api.js` arms a 1.5 s timer before the first network request of the
//       session. If the response hasn't come back by then, it dispatches
//       `flowops:waking` on `window`.
//    2. This component listens for `flowops:waking` and renders a friendly
//       full-screen overlay explaining what's happening.
//    3. As soon as the first response arrives (success OR failure), `api.js`
//       dispatches `flowops:awake` and we fade the overlay out.
//
//  Notes:
//    - Mounted ONCE at the App root (sits above all routes, providers, etc.).
//    - The overlay is fully accessible (role="status", aria-live="polite").
//    - Honours `prefers-reduced-motion` via Framer Motion's default behaviour.
//    - Self-contained — no props, no context dependency.
// ============================================================================

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ServerCog } from 'lucide-react';
import Logo from '@/shared/components/Logo.jsx';
import { wakeBackend } from '@/services/api.js';
import { ease } from '@/animations/motion';

// How long the splash has been visible — drives the secondary copy that
// reassures the user we haven't crashed when wake-up runs long.
function useElapsedSeconds(active) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!active) {
      setSeconds(0);
      return undefined;
    }
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [active]);
  return seconds;
}

function secondaryCopy(seconds) {
  if (seconds < 8) return "Render's free tier puts the API to sleep when idle.";
  if (seconds < 20) return 'Almost there — the dyno is spinning up…';
  if (seconds < 35) return 'Cold starts can take ~30–50 s. Thanks for hanging on.';
  return "Taking longer than usual — we'll keep trying.";
}

export default function WakingSplash() {
  const [visible, setVisible] = useState(false);
  const seconds = useElapsedSeconds(visible);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    // Fire a cheap /health ping on mount so a sleeping Render dyno starts
    // waking BEFORE the user clicks anything. If the API is already warm
    // this resolves in <100 ms and the splash never appears.
    wakeBackend();

    const onWaking = () => setVisible(true);
    const onAwake = () => setVisible(false);
    window.addEventListener('flowops:waking', onWaking);
    window.addEventListener('flowops:awake', onAwake);
    return () => {
      window.removeEventListener('flowops:waking', onWaking);
      window.removeEventListener('flowops:awake', onAwake);
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="waking-splash"
          role="status"
          aria-live="polite"
          aria-label="Waking the FlowOps backend"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: ease.out }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0B1120]/95 backdrop-blur-md"
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.99 }}
            transition={{ duration: 0.45, ease: ease.out }}
            className="relative w-[min(440px,90vw)] rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 text-center shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]"
          >
            {/* Brand mark */}
            <div className="mb-6 flex justify-center">
              <Logo />
            </div>

            {/* Animated icon */}
            <div className="relative mx-auto mb-5 h-14 w-14">
              {/* Pulsing halo */}
              <motion.span
                className="absolute inset-0 rounded-full bg-primary/20"
                animate={{ scale: [1, 1.35, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.span
                className="absolute inset-0 rounded-full bg-primary/10"
                animate={{ scale: [1, 1.6, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
              />
              <div className="relative flex h-full w-full items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary">
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                  className="inline-flex"
                >
                  <ServerCog className="h-6 w-6" aria-hidden="true" />
                </motion.span>
              </div>
            </div>

            {/* Primary copy */}
            <h2 className="text-base font-semibold tracking-tight text-white">
              Waking the FlowOps backend…
            </h2>

            {/* Secondary copy — rotates as time passes so the user doesn't
                feel abandoned during a long cold-start. */}
            <p className="mt-2 min-h-[2.5rem] text-sm leading-relaxed text-slate-400">
              {secondaryCopy(seconds)}
            </p>

            {/* Elapsed counter — present but quiet. */}
            <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500">
              {seconds}s elapsed
            </p>

            {/* Indeterminate progress bar — purely cosmetic, but the motion
                signals "still working" without making a false promise about
                how long is left. */}
            <div className="mt-6 h-1 w-full overflow-hidden rounded-full bg-white/[0.05]">
              <motion.div
                className="h-full w-1/3 rounded-full bg-gradient-to-r from-primary/40 via-primary to-primary/40"
                initial={{ x: '-100%' }}
                animate={{ x: '300%' }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
