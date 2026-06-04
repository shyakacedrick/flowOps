import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, CheckCircle2, Clock, Mail, Sparkles, User, Building2, Users } from 'lucide-react';
import Logo from '../components/Logo.jsx';

/**
 * BookDemoPage
 * ------------
 * Standalone /book-demo route. Captures lead details and a preferred time,
 * then shows a confirmation screen. No backend yet — payload is logged.
 */
export default function BookDemoPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    role: '',
    teamSize: '1-10',
    preferredDate: '',
    preferredTime: 'morning',
    notes: '',
  });

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const onSubmit = (e) => {
    e.preventDefault();
    // eslint-disable-next-line no-console
    console.log('[BookDemo] request:', form);
    setSubmitted(true);
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-bg text-slate-200">
      {/* Ambient glows */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[600px] w-[1100px] -translate-x-1/2 rounded-full bg-primary/10 blur-[140px]" />
        <div className="absolute top-[40%] -left-40 h-[500px] w-[500px] rounded-full bg-secondary/10 blur-[140px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      {/* Top bar */}
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
        {submitted ? (
          <SuccessCard form={form} />
        ) : (
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
                Book a Demo
              </span>
              <h1 className="mt-6 text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl">
                See FlowOps in action with{' '}
                <span className="bg-gradient-to-r from-primary via-blue-400 to-secondary bg-clip-text text-transparent">
                  a guided tour
                </span>
                .
              </h1>
              <p className="mt-6 text-base leading-relaxed text-slate-400">
                Tell us a bit about your business and we&apos;ll walk you through how
                FlowOps eliminates wait times, lifts throughput, and gives your team
                live operational visibility — tailored to your workflow.
              </p>

              <ul className="mt-10 space-y-4">
                {[
                  { icon: Clock, title: '30-minute walkthrough', desc: 'Focused on the metrics that matter to you.' },
                  { icon: Users, title: 'Tailored to your team', desc: 'Owner, staff, and admin workflows mapped to your ops.' },
                  { icon: CheckCircle2, title: 'No commitment', desc: 'Just a conversation — bring your toughest questions.' },
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
                  <Field label="Company" icon={Building2}>
                    <input
                      type="text"
                      required
                      value={form.company}
                      onChange={update('company')}
                      placeholder="Acme Co."
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Your role">
                    <input
                      type="text"
                      value={form.role}
                      onChange={update('role')}
                      placeholder="Operations Manager"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Team size">
                    <select value={form.teamSize} onChange={update('teamSize')} className={inputCls}>
                      <option className="bg-slate-900">1-10</option>
                      <option className="bg-slate-900">11-50</option>
                      <option className="bg-slate-900">51-200</option>
                      <option className="bg-slate-900">201-1,000</option>
                      <option className="bg-slate-900">1,000+</option>
                    </select>
                  </Field>
                  <Field label="Preferred date" icon={Calendar}>
                    <input
                      type="date"
                      value={form.preferredDate}
                      onChange={update('preferredDate')}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Preferred time" icon={Clock}>
                    <select value={form.preferredTime} onChange={update('preferredTime')} className={inputCls}>
                      <option value="morning" className="bg-slate-900">Morning (9am–12pm)</option>
                      <option value="afternoon" className="bg-slate-900">Afternoon (12pm–5pm)</option>
                      <option value="evening" className="bg-slate-900">Evening (5pm–7pm)</option>
                    </select>
                  </Field>
                  <Field label="What would you like to see?" full>
                    <textarea
                      rows={4}
                      value={form.notes}
                      onChange={update('notes')}
                      placeholder="Tell us about your current queue setup, pain points, or what success looks like…"
                      className={`${inputCls} resize-none`}
                    />
                  </Field>
                </div>

                <div className="mt-7 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-slate-500">
                    We&apos;ll reply within one business day. No spam, ever.
                  </p>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn-primary"
                  >
                    Request my demo
                    <Sparkles className="h-4 w-4" />
                  </motion.button>
                </div>
              </div>
            </motion.form>
          </div>
        )}
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

function SuccessCard({ form }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="mx-auto max-w-2xl rounded-3xl border border-white/[0.08] bg-white/[0.02] p-10 text-center shadow-2xl shadow-black/30 backdrop-blur-xl"
    >
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-emerald-400 to-secondary text-slate-900 shadow-[0_0_30px_-4px_rgba(34,211,238,0.6)]">
        <CheckCircle2 className="h-6 w-6" strokeWidth={2.5} />
      </span>
      <h2 className="mt-6 text-3xl font-bold tracking-tight text-white">
        You&apos;re on the list, {form.name.split(' ')[0] || 'friend'}.
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-slate-400">
        We&apos;ve received your demo request and a FlowOps specialist will reach out
        to <span className="text-slate-200">{form.email}</span> within one business day to
        confirm your slot.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link to="/" className="btn-secondary">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
        <Link to="/login" className="btn-primary">
          Explore the platform
        </Link>
      </div>
    </motion.div>
  );
}
