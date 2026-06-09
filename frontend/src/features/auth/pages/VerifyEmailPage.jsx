// ============================================================================
//  VerifyEmailPage
// ----------------------------------------------------------------------------
//  Auto-confirms the email-verification token from the URL on mount and
//  shows a success / failure state. Provides a re-send option on failure
//  only if the user happens to be signed in.
// ============================================================================

import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Loader2, MailCheck, RefreshCcw } from 'lucide-react';
import { ROUTES } from '@/shared/constants/routes.js';
import authApi from '@/services/authApi.js';
import { useAuth } from '@/app/providers/AuthProvider.jsx';
import { AuthShell, SuccessCard } from './ForgotPasswordPage.jsx';

const STATE = { PENDING: 'pending', OK: 'ok', FAIL: 'fail' };

export default function VerifyEmailPage() {
  const { token } = useParams();
  const { isAuthenticated } = useAuth();
  const [state, setState] = useState(STATE.PENDING);
  const [errorMsg, setErr] = useState('');
  const ran = useRef(false);

  useEffect(() => {
    // StrictMode-safe: only call confirm once per mount.
    if (ran.current) return;
    ran.current = true;

    if (!token) {
      setErr('No verification token in the URL.');
      setState(STATE.FAIL);
      return;
    }

    (async () => {
      const res = await authApi.confirmVerifyEmail(token);
      if (res.ok) {
        setState(STATE.OK);
      } else {
        setErr(res.message || 'Could not verify this email link.');
        setState(STATE.FAIL);
      }
    })();
  }, [token]);

  if (state === STATE.PENDING) {
    return (
      <AuthShell>
        <SuccessCard
          icon={Loader2}
          title="Verifying…"
          message="Hang on while we confirm this link."
        />
      </AuthShell>
    );
  }

  if (state === STATE.OK) {
    return (
      <AuthShell>
        <SuccessCard
          icon={CheckCircle2}
          title="Email verified"
          message="Your email is confirmed. You can keep using FlowOps as normal."
          footer={
            <Link
              to={isAuthenticated ? ROUTES.owner.dashboard : ROUTES.login}
              className="text-sm font-semibold text-primary hover:underline"
            >
              {isAuthenticated ? 'Go to dashboard →' : 'Go to sign in →'}
            </Link>
          }
        />
      </AuthShell>
    );
  }

  // FAIL
  return (
    <AuthShell>
      <SuccessCard
        icon={AlertCircle}
        tone="rose"
        title="Couldn't verify this link"
        message={errorMsg}
        footer={
          isAuthenticated ? (
            <ResendButton />
          ) : (
            <Link to={ROUTES.login} className="text-sm font-semibold text-primary hover:underline">
              Sign in to request a new link
            </Link>
          )
        }
      />
    </AuthShell>
  );
}

function ResendButton() {
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr]   = useState('');

  const onClick = async () => {
    if (busy) return;
    setBusy(true);
    setErr('');
    const res = await authApi.resendVerifyEmail();
    setBusy(false);
    if (!res.ok) {
      setErr(res.message || 'Could not send a new link.');
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <p className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-300">
        <MailCheck className="h-4 w-4" />
        New link sent — check your inbox.
      </p>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy
          ? <><Loader2 className="h-4 w-4 animate-spin" />Sending…</>
          : <><RefreshCcw className="h-4 w-4" />Send a new link</>}
      </button>
      {err && <p className="mt-2 text-xs text-rose-300">{err}</p>}
    </div>
  );
}
