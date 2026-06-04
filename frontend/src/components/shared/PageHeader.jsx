import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * PageHeader — shared title block used by every owner workspace page.
 *
 * Props:
 *   crumbs   — [{label, to?}]   left → right breadcrumb trail
 *   eyebrow  — small uppercase kicker
 *   title    — page title
 *   subtitle — supporting copy
 *   actions  — optional right-aligned ReactNode (buttons, filters, …)
 */
export default function PageHeader({ crumbs = [], eyebrow, title, subtitle, actions }) {
  return (
    <header className="relative">
      {crumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
          <Link to="/dashboard" className="grid h-5 w-5 place-items-center rounded-md text-slate-500 hover:text-slate-300">
            <Home className="h-3 w-3" />
          </Link>
          {crumbs.map((c, i) => (
            <span key={`${c.label}-${i}`} className="flex items-center gap-1">
              <ChevronRight className="h-3 w-3 text-slate-600" />
              {c.to && i < crumbs.length - 1 ? (
                <Link to={c.to} className="hover:text-slate-200">{c.label}</Link>
              ) : (
                <span className={i === crumbs.length - 1 ? 'text-slate-200' : ''}>{c.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300/80">
              {eyebrow}
            </p>
          )}
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1.5 max-w-2xl text-sm text-slate-400">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}

/** Small reusable stat card used across workspace pages. */
export function StatCard({ label, value, delta, tone = 'cyan', icon: Icon }) {
  const tones = {
    cyan:    'from-cyan-500/15 to-blue-500/5 ring-cyan-400/15 text-cyan-300',
    violet:  'from-violet-500/15 to-fuchsia-500/5 ring-violet-400/15 text-violet-300',
    emerald: 'from-emerald-500/15 to-teal-500/5 ring-emerald-400/15 text-emerald-300',
    amber:   'from-amber-500/15 to-orange-500/5 ring-amber-400/15 text-amber-300',
    rose:    'from-rose-500/15 to-pink-500/5 ring-rose-400/15 text-rose-300',
  }[tone];
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br ${tones} bg-white/[0.02] p-4 ring-1 backdrop-blur`}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{label}</p>
        {Icon && <Icon className="h-4 w-4 opacity-70" />}
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight text-white tabular-nums">{value}</p>
      {delta && <p className="mt-0.5 text-[11px] font-medium text-slate-400">{delta}</p>}
    </div>
  );
}
