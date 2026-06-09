// ============================================================================
//  AcceptInvitePage — public route /invite/:token
// ----------------------------------------------------------------------------
//  Three states:
//    1. LOADING  — looking up the invite
//    2. INVALID  — invite is expired / revoked / accepted / not found
//    3. FORM     — show org name + role + email and collect name + password
//
//  On successful accept we receive { user, token } from the backend.
//  We persist the token via setAuthToken and push the user into the
//  AuthProvider session, then redirect to the role's home.
// ============================================================================

import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Building2, CheckCircle2, Loader2, Mail, ShieldAlert, UserPlus } from 'lucide-react';
import Logo from '@/shared/components/Logo.jsx';
import Button from '@/shared/ui/Button.jsx';
import Card from '@/shared/ui/Card.jsx';
import { useAuth, ROLES } from '@/app/providers/AuthProvider.jsx';
import { setAuthToken } from '@/services/api.js';
import inviteApi from '@/services/inviteApi.js';

const ROLE_LABEL = {
  business_owner: 'Business Owner',
  staff: 'Staff Operator',
};

const HOME_FOR_ROLE = {
  [ROLES.BUSINESS_OWNER]: '/dashboard',
  [ROLES.STAFF]:          '/staff/dashboard',
  [ROLES.ADMIN]:          '/admin/overview',
};

export default function AcceptInvitePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const [status, setStatus] = useState('loading'); // loading | ready | invalid
  const [invite, setInvite] = useState(null);
  const [lookupError, setLookupError] = useState(null);

  // ── Fetch invite info ─────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await inviteApi.getPublic(token);
      if (cancelled) return;
      if (!res.ok) {
        setLookupError(res.message || 'This invite is no longer valid.');
        setStatus('invalid');
        return;
      }
      setInvite(res.data);
      setStatus('ready');
    }
    if (token) load();
    return () => { cancelled = true; };
  }, [token]);

  return (
    <div className="min-h-screen bg-bg text-slate-100">
      <header className="border-b border-white/[0.06] bg-white/[0.02] backdrop-blur-xl">
        <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-4">
          <Logo className="h-7" />
          <span className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
            Team invitation
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 pb-16 pt-6 sm:pt-10">
        {status === 'loading' && (
          <Card padding="xl" className="grid place-items-center gap-3 py-16 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm">Looking up your invite…</p>
          </Card>
        )}

        {status === 'invalid' && <InvalidShell message={lookupError} />}

        {status === 'ready' && invite && (
          <AcceptForm
            token={token}
            invite={invite}
            onAccepted={({ user, token: jwt }) => {
              setAuthToken(jwt);
              signIn(user);
              const home = HOME_FOR_ROLE[user.role] || '/dashboard';
              navigate(home, { replace: true });
            }}
          />
        )}
      </main>

      <footer className="mx-auto max-w-xl px-4 pb-8 text-center text-[11px] uppercase tracking-[0.18em] text-slate-500">
        Powered by FlowOps
      </footer>
    </div>
  );
}

function InvalidShell({ message }) {
  return (
    <Card padding="xl" className="grid place-items-center gap-3 py-14 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-400/10 text-rose-300">
        <ShieldAlert className="h-6 w-6" />
      </span>
      <h1 className="text-lg font-semibold text-white">Invite unavailable</h1>
      <p className="max-w-sm text-sm text-slate-400">
        {message || 'This invitation has expired or been revoked. Ask the person who invited you to send a new link.'}
      </p>
    </Card>
  );
}

function AcceptForm({ token, invite, onAccepted }) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const expiresIn = useMemo(() => {
    if (!invite.expiresAt) return null;
    const ms = new Date(invite.expiresAt) - Date.now();
    const days = Math.round(ms / 86400000);
    return days <= 0 ? 'today' : `in ${days} day${days === 1 ? '' : 's'}`;
  }, [invite.expiresAt]);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setError('Please enter your name.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    setError(null);
    setSubmitting(true);
    const res = await inviteApi.acceptPublic(token, {
      name: name.trim(),
      password,
    });
    setSubmitting(false);
    if (!res.ok) {
      setError(res.message || 'Could not accept this invite. Please try again.');
      return;
    }
    onAccepted(res.data);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/80">
          You're invited
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Join {invite.organization?.name || 'a FlowOps workspace'}
        </h1>
        <p className="text-sm text-slate-400">
          Set up your account to start as <strong className="text-white">{ROLE_LABEL[invite.role] || invite.role}</strong>.
        </p>
      </div>

      <Card padding="lg" className="space-y-3">
        <MetaRow icon={Building2} label="Organization" value={invite.organization?.name} />
        <MetaRow icon={UserPlus}  label="Role"         value={ROLE_LABEL[invite.role] || invite.role} />
        <MetaRow icon={Mail}      label="Email"        value={invite.email} />
        {expiresIn && (
          <p className="pt-1 text-[11px] text-slate-500">
            This invite expires <span className="text-slate-300">{expiresIn}</span>.
          </p>
        )}
      </Card>

      <Card padding="xl">
        <form onSubmit={submit} className="space-y-4">
          <Field label="Your name" required>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Johnson"
              autoComplete="name"
              maxLength={100}
              disabled={submitting}
              className="w-full rounded-lg border border-white/10 bg-bg/40 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-primary/50 focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
            />
          </Field>

          <Field label="Password" hint="At least 8 characters." required>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              minLength={8}
              disabled={submitting}
              className="w-full rounded-lg border border-white/10 bg-bg/40 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-primary/50 focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
            />
          </Field>

          {error && (
            <p className="rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-xs text-rose-200">
              {error}
            </p>
          )}

          <Button type="submit" full size="lg" loading={submitting} iconRight={ArrowRight}>
            Accept invite & sign in
          </Button>
        </form>
      </Card>

      <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-500">
        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
        You'll be signed in automatically after creating your account.
      </p>
    </div>
  );
}

function Field({ label, hint, required, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold text-slate-300">
        {label}
        {required && <span className="ml-1 text-rose-300">*</span>}
      </span>
      {children}
      {hint && <span className="block text-[11px] text-slate-500">{hint}</span>}
    </label>
  );
}

function MetaRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/[0.06] bg-bg/40 text-slate-300">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
        <p className="truncate text-sm font-semibold text-white">{value || '—'}</p>
      </div>
    </div>
  );
}
