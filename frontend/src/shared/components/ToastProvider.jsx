// ============================================================================
//  ToastProvider — global, lightweight notification stack
// ----------------------------------------------------------------------------
//  Pairs with ConfirmProvider as the second piece of cross-page UI feedback.
//  Use it from anywhere:
//
//      const toast = useToast();
//      toast.success('Queue created');
//      toast.error('Failed to load tickets');
//      toast.info('Refreshing…');
//
//  Behavior
//    • Up to 3 toasts visible at once (oldest is force-dismissed)
//    • Auto-dismiss after 3.5s (errors live a bit longer — 6s)
//    • Click anywhere on a toast (or its × button) to dismiss it
//    • Slides in from the top-right; stacks vertically on desktop, full-width
//      with bottom anchor on small screens
//    • No external deps — single file, ~150 LOC
//
//  Why not use react-hot-toast or sonner?
//    The product palette / spacing / typography is tightly themed; the third-
//    party libraries either ship their own styling or require a layer of CSS
//    overrides bigger than this whole file. Native is simpler.
// ============================================================================

import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const MAX_VISIBLE = 3;
const DEFAULT_TTL = { success: 3500, info: 3500, error: 6000 };

const TONE = {
  success: {
    ring: 'ring-emerald-400/30',
    bar:  'bg-emerald-400',
    text: 'text-emerald-200',
    icon: CheckCircle2,
  },
  error: {
    ring: 'ring-rose-400/30',
    bar:  'bg-rose-400',
    text: 'text-rose-200',
    icon: AlertCircle,
  },
  info: {
    ring: 'ring-cyan-400/30',
    bar:  'bg-cyan-400',
    text: 'text-cyan-200',
    icon: Info,
  },
};

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used inside <ToastProvider>');
  }
  return ctx;
}

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  // Tracks setTimeout handles so we can clear them on dismiss/unmount and
  // not fire dismiss() against an already-removed toast.
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    const t = timers.current.get(id);
    if (t) {
      clearTimeout(t);
      timers.current.delete(id);
    }
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const push = useCallback((tone, message, opts = {}) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const ttl = opts.ttl ?? DEFAULT_TTL[tone] ?? DEFAULT_TTL.info;

    setToasts((prev) => {
      // Cap visible count — drop oldest first.
      const trimmed = prev.length >= MAX_VISIBLE ? prev.slice(prev.length - MAX_VISIBLE + 1) : prev;
      return [...trimmed, { id, tone, message: String(message ?? '') }];
    });

    if (ttl > 0) {
      const handle = setTimeout(() => dismiss(id), ttl);
      timers.current.set(id, handle);
    }
    return id;
  }, [dismiss]);

  // Clear pending timers if the provider ever unmounts. (Defensive — in
  // practice ToastProvider lives at the root and never unmounts mid-session.)
  useEffect(() => {
    const map = timers.current;
    return () => {
      for (const handle of map.values()) clearTimeout(handle);
      map.clear();
    };
  }, []);

  const api = useMemo(() => ({
    success: (msg, opts) => push('success', msg, opts),
    error:   (msg, opts) => push('error',   msg, opts),
    info:    (msg, opts) => push('info',    msg, opts),
    dismiss,
  }), [push, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function ToastViewport({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;
  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[110] flex flex-col items-center gap-2 px-4 sm:bottom-auto sm:right-4 sm:top-4 sm:inset-x-auto sm:items-end sm:px-0"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }) {
  const tone = TONE[toast.tone] || TONE.info;
  const Icon = tone.icon;
  return (
    <div
      role="status"
      className={`pointer-events-auto flex w-full max-w-sm items-start gap-2.5 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/95 p-3 pr-2 shadow-2xl ring-1 ${tone.ring} backdrop-blur animate-toast-in`}
    >
      <span className={`mt-0.5 inline-flex h-1.5 w-1.5 shrink-0 rounded-full ${tone.bar}`} />
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${tone.text}`} />
      <p className="min-w-0 flex-1 text-xs leading-relaxed text-slate-100">{toast.message}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
