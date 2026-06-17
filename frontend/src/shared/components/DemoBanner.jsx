// ============================================================================
//  DemoBanner — top-of-page strip indicating this is the showcase deploy
// ----------------------------------------------------------------------------
//  Only renders when the build sets VITE_DEMO_MODE=true (Netlify / Render
//  preview deploys). Local development stays clean.
//
//  Dismissible per-tab via sessionStorage so a returning visitor doesn't
//  have to re-dismiss on every page navigation, but a brand-new tab still
//  sees it.
//
//  Sits above everything else (z-50) but only takes ~28px so it doesn't
//  fight the existing layouts.
// ============================================================================

import { useEffect, useState } from 'react';
import { X, Sparkles } from 'lucide-react';

const STORAGE_KEY = 'flowops:demo-banner:dismissed';
const DEMO_MODE =
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_DEMO_MODE === 'true';

export default function DemoBanner() {
  // Track mount on the client so the banner doesn't flash during SSR-ish
  // hydration (not strictly applicable to Vite SPA, but defensive).
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!DEMO_MODE) return;
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === '1') return;
    } catch { /* ignore */ }
    setShow(true);
  }, []);

  if (!show) return null;

  const handleDismiss = () => {
    setShow(false);
    try { sessionStorage.setItem(STORAGE_KEY, '1'); } catch { /* ignore */ }
  };

  return (
    <div className="relative z-50 flex items-center justify-center gap-2 border-b border-cyan-400/15 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-violet-500/10 px-4 py-1.5 text-[11px] font-semibold text-cyan-100 backdrop-blur">
      <Sparkles className="h-3 w-3 shrink-0 text-cyan-300" />
      <span className="truncate">
        Demo mode — data resets nightly. Sign in with
        <span className="mx-1 rounded-md bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-white">demo.owner@flowops.app</span>
        /
        <span className="mx-1 rounded-md bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-white">Demo123!</span>
      </span>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss demo banner"
        className="ml-2 grid h-5 w-5 shrink-0 place-items-center rounded-md text-cyan-200/70 transition-colors hover:bg-white/10 hover:text-white"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
