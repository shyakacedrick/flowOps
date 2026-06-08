// ============================================================================
//  ConfirmProvider — promise-based confirmation modal
// ----------------------------------------------------------------------------
//  Replaces ugly `window.confirm()` with an in-app dialog. Usage:
//
//      const confirm = useConfirm();
//      const ok = await confirm({
//        title: 'Delete queue?',
//        message: 'This cannot be undone.',
//        confirmLabel: 'Delete',
//        danger: true,
//      });
//      if (!ok) return;
//
//  The provider is mounted once near the app root and renders nothing until
//  a confirm() call is made. Calls are queued (one dialog at a time).
// ============================================================================

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmContext = createContext(null);

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error('useConfirm must be used inside <ConfirmProvider>');
  }
  return ctx;
}

const DEFAULTS = {
  title: 'Are you sure?',
  message: '',
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  danger: false,
};

export default function ConfirmProvider({ children }) {
  const [state, setState] = useState(null); // { ...opts, resolve }
  const cancelBtnRef = useRef(null);
  const confirmBtnRef = useRef(null);

  const confirm = useCallback((opts = {}) => {
    return new Promise((resolve) => {
      setState({ ...DEFAULTS, ...opts, resolve });
    });
  }, []);

  const close = useCallback((value) => {
    setState((prev) => {
      if (prev) prev.resolve(value);
      return null;
    });
  }, []);

  // Keyboard: Esc cancels, Enter confirms. Trap focus on the danger button
  // if dangerous, otherwise on cancel (safer default).
  useEffect(() => {
    if (!state) return undefined;

    const target = state.danger ? cancelBtnRef.current : confirmBtnRef.current;
    target?.focus();

    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close(false);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        close(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state, close]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      {state && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close dialog"
            onClick={() => close(false)}
            className="absolute inset-0 cursor-default bg-slate-950/70 backdrop-blur-sm"
          />

          {/* Card */}
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/95 p-5 shadow-2xl ring-1 ring-white/5">
            <button
              type="button"
              onClick={() => close(false)}
              aria-label="Close"
              className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-lg text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-start gap-3 pr-6">
              {state.danger && (
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-rose-500/10 text-rose-300 ring-1 ring-rose-400/30">
                  <AlertTriangle className="h-4 w-4" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <h2 id="confirm-title" className="text-sm font-semibold text-white">
                  {state.title}
                </h2>
                {state.message && (
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                    {state.message}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                ref={cancelBtnRef}
                type="button"
                onClick={() => close(false)}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/[0.08]"
              >
                {state.cancelLabel}
              </button>
              <button
                ref={confirmBtnRef}
                type="button"
                onClick={() => close(true)}
                className={
                  state.danger
                    ? 'rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 px-3.5 py-2 text-xs font-semibold text-white shadow-lg shadow-rose-500/20 transition hover:from-rose-400 hover:to-pink-400'
                    : 'rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-3.5 py-2 text-xs font-semibold text-slate-900 transition hover:from-cyan-300 hover:to-blue-400'
                }
              >
                {state.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
