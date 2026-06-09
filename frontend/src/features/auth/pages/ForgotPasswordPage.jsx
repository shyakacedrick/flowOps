// ============================================================================
//  ForgotPasswordPage
// ----------------------------------------------------------------------------
//  Step 1 of the password-reset flow. Always shows the same success message
//  whether or not the email exists (mirrors backend behaviour).
// ============================================================================

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Loader2, Mail, MailCheck, AlertCircle } from 'lucide-react';
import Logo from '@/shared/components/Logo.jsx';
import { ROUTES } from '@/shared/constants/routes.js';
import authApi from '@/services/authApi.js';
import { ease } from '@/animations/motion.js';

export default function ForgotPasswordPage() {
  const [email, setEmail]   = useState('');
  const [busy, setBusy]     = useState(false);
  const [sent, setSent]     = useState(false);
  const [errorMsg, setErr]  = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setErr('');
    setBusy(true);
    const res = await authApi.forgotPassword(email.trim().toLowerCase());
    setBusy(false);
    if (!res.ok) {
      // Rate-limit hits show as 429; surface those so the user knows to wait.
      setErr(res.message || 'Could not process your request. Please try again.');
      return;
    }
    setSent(true);
  };

  return (
    <AuthShell>
      {sent ? (
        <SuccessCard
          icon={MailCheck}
          title="Check your email"
          message={
            <>
              If an account exists for <strong className="text-white">{email}</strong>, we&apos;ve
              sent a password-reset link. The link expires in 60 minutes.
            </>
          }
          footer={
            <Link to={ROUTES.login} className="text-sm font-semibold text-primary hover:underline">
              Back to sign in
            </Link>
          }
        />
      ) : (
        <motion.form
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: ease.out }}
          onSubmit={onSubmit}
          className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8"
        >
          <p className="text-sm font-semibold text-white">Reset your password</p>
          <p className="mt-1 text-xs text-slate-500">
            Enter the email tied to your workspace and we&apos;ll send you a secure link.
          </p>

          <label className="mt-6 block">
            <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <Mail className="h-3.5 w-3.5" />
              Work email
            </span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@company.com"
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-primary/60 focus:bg-white/[0.05] focus:ring-2 focus:ring-primary/30"
            />
          </label>

          {errorMsg && (
            <div role="alert" className="mt-5 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-200">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="mt-7 flex items-center justify-between gap-3">
            <Link to={ROUTES.login} className="text-xs text-slate-500 transition hover:text-slate-300">
              ← Back to sign in
            </Link>
            <motion.button
              type="submit"
              disabled={busy}
              whileHover={busy ? {} : { scale: 1.02 }}
              whileTap={busy ? {} : { scale: 0.98 }}
              className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? (<><Loader2 className="h-4 w-4 animate-spin" />Sending…</>)
                    : (<>Send reset link<ArrowRight className="h-4 w-4" /></>)}
            </motion.button>
          </div>
        </motion.form>
      )}
    </AuthShell>
  );
}

// ─── Shared minimal shell + success card ───────────────────────────────────
// These are local to the auth-flow pages and kept lightweight. If we add a
// fourth page, promote to shared/components/AuthShell.jsx.

export function AuthShell({ children }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-bg text-slate-200">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[600px] w-[1100px] -translate-x-1/2 rounded-full bg-primary/10 blur-[140px]" />
        <div className="absolute -bottom-20 right-0 h-[420px] w-[420px] rounded-full bg-secondary/10 blur-[120px]" />
      </div>

      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 sm:px-8 lg:px-12">
        <Link to="/" className="inline-block"><Logo /></Link>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-white/20 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to site
        </Link>
      </div>

      <div className="mx-auto flex w-full max-w-md flex-col px-6 pb-24 pt-6 sm:px-8">
        {children}
      </div>
    </div>
  );
}

export function SuccessCard({ icon: Icon, title, message, footer, tone = 'emerald' }) {
  const ring   = tone === 'rose' ? 'bg-rose-500/10 text-rose-300'
                : tone === 'amber' ? 'bg-amber-500/10 text-amber-300'
                : 'bg-emerald-500/10 text-emerald-300';
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: ease.out }}
      className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6 text-center shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8"
    >
      <div className={`mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl ${ring}`}>
        <Icon className="h-6 w-6" />
      </div>
      <p className="text-base font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">{message}</p>
      {footer && <div className="mt-6">{footer}</div>}
    </motion.div>
  );
}
