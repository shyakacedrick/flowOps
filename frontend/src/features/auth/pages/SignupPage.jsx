import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Sparkles,
  User,
  Zap,
} from 'lucide-react';
import Logo from '@/shared/components/Logo.jsx';
import { ROUTES } from '@/shared/constants/routes.js';
import { useAuth } from '@/app/providers/AuthProvider.jsx';
import authApi from '@/services/authApi.js';

/**
 * SignupPage
 * ----------
 * Standalone /signup route. Captures account essentials for a new FlowOps
 * workspace, then funnels users into /login to choose a role and continue.
 */
export default function SignupPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    password: '',
    plan: 'starter',
    agree: false,
  });

  const update = (field) => (e) => {
    const value = field === 'agree' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [field]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.agree || busy) return;
    setErrorMsg('');
    setBusy(true);

    const res = await authApi.register({
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      company: form.company.trim(),
      plan: form.plan,
    });

    if (!res.ok) {
      setBusy(false);
      setErrorMsg(res.message || 'Sign-up failed. Please try again.');
      return;
    }

    // Token already persisted by authApi.register on success.
    // The backend assigns business_owner role + creates the org, so
    // hydrate the session and send the new owner straight into their workspace.
    signIn(res.data.user);
    navigate(ROUTES.owner.dashboard, { replace: true });
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-bg text-slate-200">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[600px] w-[1100px] -translate-x-1/2 rounded-full bg-primary/10 blur-[140px]" />
        <div className="absolute top-[40%] -left-40 h-[500px] w-[500px] rounded-full bg-secondary/10 blur-[140px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <header className="border-b border-white/[0.06] bg-bg/75 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 sm:px-8 lg:px-12">
          <Link to="/" aria-label="FlowOps home">
            <Logo />
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-slate-300 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to home
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 py-16 sm:px-8 lg:px-12 lg:py-24">
        <div className="grid items-start gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Left — pitch */}
          <motion.aside
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-5"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold uppercase tracking-widest text-secondary">
              <Sparkles className="h-3.5 w-3.5" />
              Start free
            </span>
            <h1 className="mt-6 text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl">
              Spin up your FlowOps{' '}
              <span className="bg-gradient-to-r from-primary via-blue-400 to-secondary bg-clip-text text-transparent">
                workspace
              </span>{' '}
              in minutes.
            </h1>
            <p className="mt-6 text-base leading-relaxed text-slate-400">
              No credit card. 14-day free trial. Bring your team into a single
              live view of every queue, customer, and KPI.
            </p>

            <ul className="mt-10 space-y-4">
              {[
                { icon: Zap, title: 'Live queue control', desc: 'Call next, skip, re-queue — in one click.' },
                { icon: CheckCircle2, title: 'Smart insights', desc: 'AI-surfaced bottlenecks and peak-hour signals.' },
                { icon: Building2, title: 'Multi-location ready', desc: 'Scale from one shop to an enterprise grid.' },
              ].map(({ icon: Icon, title, desc }) => (
                <li key={title} className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-secondary">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="text-xs leading-relaxed text-slate-400">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </motion.aside>

          {/* Right — form */}
          <motion.form
            onSubmit={onSubmit}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-7"
          >
            <div className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Full name" icon={User}>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={update('name')}
                    placeholder="Jane Doe"
                    className={inputCls}
                  />
                </Field>
                <Field label="Work email" icon={Mail}>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={update('email')}
                    placeholder="jane@company.com"
                    className={inputCls}
                  />
                </Field>
                <Field label="Company" icon={Building2} full>
                  <input
                    type="text"
                    required
                    value={form.company}
                    onChange={update('company')}
                    placeholder="Acme Co."
                    className={inputCls}
                  />
                </Field>
                <Field label="Password" full>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={form.password}
                      onChange={update('password')}
                      placeholder="At least 8 characters"
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

                <Field label="Choose a plan" full>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      { id: 'starter', name: 'Starter', desc: '1 queue · core analytics' },
                      { id: 'growth', name: 'Growth', desc: 'Multi-queue · AI insights' },
                      { id: 'scale', name: 'Scale', desc: 'Multi-location · SSO' },
                    ].map((p) => {
                      const active = form.plan === p.id;
                      return (
                        <button
                          type="button"
                          key={p.id}
                          onClick={() => setForm((f) => ({ ...f, plan: p.id }))}
                          className={`rounded-xl border px-3 py-3 text-left transition ${
                            active
                              ? 'border-primary/60 bg-primary/10 shadow-[0_0_24px_-6px_rgba(59,130,246,0.5)]'
                              : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]'
                          }`}
                        >
                          <p className={`text-sm font-semibold ${active ? 'text-white' : 'text-slate-200'}`}>
                            {p.name}
                          </p>
                          <p className="mt-0.5 text-[11px] leading-snug text-slate-400">{p.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </Field>
              </div>

              <label className="mt-6 flex items-start gap-2.5 text-xs text-slate-400">
                <input
                  type="checkbox"
                  checked={form.agree}
                  onChange={update('agree')}
                  className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/[0.04] text-primary focus:ring-primary/40"
                />
                <span>
                  I agree to the{' '}
                  <a href="#" className="text-primary hover:underline">Terms of Service</a>{' '}
                  and{' '}
                  <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
                </span>
              </label>

              {errorMsg && (
                <div
                  role="alert"
                  className="mt-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-200"
                >
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="mt-7 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-500">
                  Already have an account?{' '}
                  <Link to="/login" className="font-semibold text-primary hover:underline">
                    Sign in
                  </Link>
                </p>
                <motion.button
                  type="submit"
                  disabled={!form.agree || busy}
                  whileHover={form.agree && !busy ? { scale: 1.02 } : {}}
                  whileTap={form.agree && !busy ? { scale: 0.98 } : {}}
                  className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busy ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating workspace…
                    </>
                  ) : (
                    <>
                      Create workspace
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.form>
        </div>
      </main>
    </div>
  );
}

const inputCls =
  'w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-primary/60 focus:bg-white/[0.05] focus:ring-2 focus:ring-primary/30';

function Field({ label, icon: Icon, full = false, children }) {
  return (
    <label className={`block ${full ? 'sm:col-span-2' : ''}`}>
      <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </span>
      {children}
    </label>
  );
}
