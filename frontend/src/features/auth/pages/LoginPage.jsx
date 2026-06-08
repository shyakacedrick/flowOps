import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  Loader2,
  Check,
  Sparkles,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';
import Logo from '@/shared/components/Logo.jsx';
import { useAuth } from '@/app/providers/AuthProvider.jsx';
import { ROUTES } from '@/shared/constants/routes.js';
import authApi from '@/services/authApi.js';
import { ease, staggerContainer, staggerItem } from '@/animations/motion.js';

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [form, setForm] = useState({ email: '', password: '' });

  const update = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setErrorMsg('');
    setBusy(true);

    const res = await authApi.login({
      email: form.email.trim().toLowerCase(),
      password: form.password,
    });

    if (!res.ok) {
      setBusy(false);
      setErrorMsg(res.message || 'Sign-in failed. Please try again.');
      return;
    }

    // Token is already persisted by authApi.login on success.
    signIn(res.data.user);
    navigate(ROUTES.owner.dashboard, { replace: true });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-bg text-slate-200">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[600px] w-[1100px] -translate-x-1/2 rounded-full bg-primary/10 blur-[140px]" />
        <div className="absolute top-[35%] -left-40 h-[500px] w-[500px] rounded-full bg-secondary/10 blur-[140px]" />
        <div className="absolute -bottom-20 right-0 h-[420px] w-[420px] rounded-full bg-primary/10 blur-[120px]" />
      </div>

      {/* Top bar */}
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

      <div className="mx-auto grid w-full max-w-7xl gap-12 px-6 pb-16 sm:px-8 lg:grid-cols-12 lg:gap-16 lg:px-12 lg:pb-24 lg:pt-8">
        {/* Left — brand & value */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: ease.out }}
          className="lg:col-span-5 lg:pt-12"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-300">
            <Sparkles className="h-3.5 w-3.5 text-secondary" />
            Welcome back
          </span>
          <h1 className="mt-6 text-4xl font-bold leading-tight text-white sm:text-5xl">
            Sign in to your{' '}
            <span className="bg-gradient-to-r from-primary via-blue-400 to-secondary bg-clip-text text-transparent">
              FlowOps
            </span>{' '}
            workspace.
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-slate-400">
            Smart queue management and business intelligence for modern service
            businesses.
          </p>

          <div className="mt-10 space-y-3 border-t border-white/[0.06] pt-8">
            {[
              'Single sign-on across every location',
              'Role-based dashboards out of the box',
              'Secure JWT-based session',
            ].map((t) => (
              <div key={t} className="flex items-center gap-2.5 text-sm text-slate-300">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-primary/15 text-primary">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                {t}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right — credentials form */}
        <motion.div
          variants={staggerContainer(0.08, 0.15)}
          initial="hidden"
          animate="show"
          className="lg:col-span-7"
        >
          <motion.form
            variants={staggerItem}
            onSubmit={onSubmit}
            className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8"
          >
            <div className="mb-6">
              <p className="text-sm font-semibold text-white">Sign in</p>
              <p className="text-xs text-slate-500">
                Enter the email and password you used to create your workspace.
              </p>
            </div>

            <div className="space-y-5">
              <Field label="Work email" icon={Mail}>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={form.email}
                  onChange={update('email')}
                  placeholder="jane@company.com"
                  className={inputCls}
                />
              </Field>

              <Field label="Password" icon={Lock}>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={form.password}
                    onChange={update('password')}
                    placeholder="••••••••"
                    className={`${inputCls} pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                    className="absolute inset-y-0 right-0 grid w-11 place-items-center text-slate-400 transition hover:text-white"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>
            </div>

            {errorMsg && (
              <div
                role="alert"
                className="mt-5 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-200"
              >
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="mt-7 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">
                New to FlowOps?{' '}
                <Link to={ROUTES.signup} className="font-semibold text-primary hover:underline">
                  Create a workspace
                </Link>
              </p>
              <motion.button
                type="submit"
                disabled={busy}
                whileHover={busy ? {} : { scale: 1.02 }}
                whileTap={busy ? {} : { scale: 0.98 }}
                className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </motion.button>
            </div>
          </motion.form>

          <AnimatePresence>
            {busy && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25, ease: ease.out }}
                className="mt-5 flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-xs text-slate-300 backdrop-blur"
              >
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                Configuring your workspace…
              </motion.div>
            )}
          </AnimatePresence>

          <p className="mt-6 text-center text-xs text-slate-500">
            By continuing you agree to our terms & privacy policy.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

const inputCls =
  'w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-primary/60 focus:bg-white/[0.05] focus:ring-2 focus:ring-primary/30';

function Field({ label, icon: Icon, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </span>
      {children}
    </label>
  );
}
