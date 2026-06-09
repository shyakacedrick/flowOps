// ============================================================================
//  ResetPasswordPage — step 2 of the password-reset flow
// ----------------------------------------------------------------------------
//  Reads the token from the URL, posts {token, password} to the backend.
//  On success: show a confirmation + "Sign in" CTA. The backend invalidates
//  all existing refresh tokens so the user MUST log in again.
// ============================================================================

import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, Loader2, Lock, Eye, EyeOff,
  AlertCircle, ShieldCheck, KeyRound,
} from 'lucide-react';
import { ROUTES } from '@/shared/constants/routes.js';
import authApi from '@/services/authApi.js';
import { ease } from '@/animations/motion.js';
import { AuthShell, SuccessCard } from './ForgotPasswordPage.jsx';

const MIN_LEN = 10;

// Mirrors the backend rule so we fail fast in the browser and avoid a
// pointless round-trip. Backend remains authoritative.
function validate(pw) {
  if (pw.length < MIN_LEN) return `Password must be at least ${MIN_LEN} characters`;
  if (!/[a-zA-Z]/.test(pw)) return 'Password must include at least one letter';
  if (!/\d/.test(pw))       return 'Password must include at least one number';
  return null;
}

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate  = useNavigate();
  const [pw, setPw]         = useState('');
  const [confirm, setCnf]   = useState('');
  const [showPw, setShow]   = useState(false);
  const [busy, setBusy]     = useState(false);
  const [done, setDone]     = useState(false);
  const [errorMsg, setErr]  = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setErr('');

    if (pw !== confirm) {
      setErr('Passwords do not match');
      return;
    }
    const v = validate(pw);
    if (v) { setErr(v); return; }

    setBusy(true);
    const res = await authApi.resetPassword(token, pw);
    setBusy(false);

    if (!res.ok) {
      setErr(res.message || 'Could not reset your password. The link may have expired.');
      return;
    }
    setDone(true);
    // Push to login after a short pause so the success state is readable.
    setTimeout(() => navigate(ROUTES.login, { replace: true }), 2500);
  };

  if (!token) {
    return (
      <AuthShell>
        <SuccessCard
          icon={AlertCircle}
          tone="rose"
          title="Missing reset token"
          message="This page needs to be opened from the link in your reset email."
          footer={
            <Link to={ROUTES.forgotPassword} className="text-sm font-semibold text-primary hover:underline">
              Request a new link
            </Link>
          }
        />
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      {done ? (
        <SuccessCard
          icon={ShieldCheck}
          title="Password updated"
          message="You can now sign in with your new password. Taking you to sign-in…"
          footer={
            <Link to={ROUTES.login} className="text-sm font-semibold text-primary hover:underline">
              Go to sign in →
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
          <div className="mb-6 flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
              <KeyRound className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-white">Choose a new password</p>
              <p className="text-xs text-slate-500">Use at least 10 characters with a letter and a number.</p>
            </div>
          </div>

          <PasswordField
            label="New password"
            value={pw}
            onChange={setPw}
            showPw={showPw}
            onToggle={() => setShow((v) => !v)}
            autoComplete="new-password"
          />
          <div className="mt-5">
            <PasswordField
              label="Confirm password"
              value={confirm}
              onChange={setCnf}
              showPw={showPw}
              onToggle={() => setShow((v) => !v)}
              autoComplete="new-password"
            />
          </div>

          {errorMsg && (
            <div role="alert" className="mt-5 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-200">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="mt-7 flex items-center justify-end">
            <motion.button
              type="submit"
              disabled={busy}
              whileHover={busy ? {} : { scale: 1.02 }}
              whileTap={busy ? {} : { scale: 0.98 }}
              className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? (<><Loader2 className="h-4 w-4 animate-spin" />Updating…</>)
                    : (<>Update password<ArrowRight className="h-4 w-4" /></>)}
            </motion.button>
          </div>
        </motion.form>
      )}
    </AuthShell>
  );
}

function PasswordField({ label, value, onChange, showPw, onToggle, autoComplete }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
        <Lock className="h-3.5 w-3.5" />
        {label}
      </span>
      <div className="relative">
        <input
          type={showPw ? 'text' : 'password'}
          required
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••"
          className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 pr-11 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-primary/60 focus:bg-white/[0.05] focus:ring-2 focus:ring-primary/30"
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={showPw ? 'Hide password' : 'Show password'}
          className="absolute inset-y-0 right-0 grid w-11 place-items-center text-slate-400 transition hover:text-white"
        >
          {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </label>
  );
}
