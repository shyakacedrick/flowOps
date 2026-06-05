import { useMemo, useState } from 'react';
import {
  ScrollText, Search, Filter, LogIn, UserCog, Building2, CreditCard, Settings as SettingsIcon,
  ShieldAlert, Trash2, KeyRound, ArrowDownToLine,
} from 'lucide-react';
import AdminLayout from '@/features/admin/components/AdminShell.jsx';
import PageHeader, { StatCard } from '@/shared/components/PageHeader.jsx';

const LOGS = [
  { id: 'evt_9101', ts: '14:08:24', actor: 'Omar Khalil',     role: 'Platform Admin', action: 'role.change',         resource: 'user u_006 → Admin',         severity: 'medium', icon: UserCog },
  { id: 'evt_9099', ts: '14:02:11', actor: 'system',          role: 'System',         action: 'subscription.renewed', resource: 'org_002 · Enterprise',       severity: 'info',   icon: CreditCard },
  { id: 'evt_9098', ts: '13:58:40', actor: 'Priya Patel',     role: 'Admin',          action: 'user.invite',         resource: 'aisha@northbank.com',         severity: 'info',   icon: UserCog },
  { id: 'evt_9096', ts: '13:46:02', actor: 'Marcus Cohen',    role: 'Owner',          action: 'settings.update',     resource: 'org_004 notification rules', severity: 'low',    icon: SettingsIcon },
  { id: 'evt_9094', ts: '13:21:54', actor: 'system',          role: 'System',         action: 'org.created',         resource: 'Lush Salon · Downtown',      severity: 'info',   icon: Building2 },
  { id: 'evt_9088', ts: '12:48:33', actor: 'Jordan Lee',      role: 'Owner',          action: 'auth.login',          resource: 'web · macOS · Safari',       severity: 'info',   icon: LogIn },
  { id: 'evt_9085', ts: '12:22:18', actor: 'Omar Khalil',     role: 'Platform Admin', action: 'feature_flag.toggle', resource: 'sms_routing → enabled',      severity: 'medium', icon: KeyRound },
  { id: 'evt_9081', ts: '11:54:09', actor: 'unknown',         role: 'Anonymous',      action: 'auth.failed',         resource: '3 failed attempts · u_010', severity: 'high',   icon: ShieldAlert },
  { id: 'evt_9078', ts: '11:41:55', actor: 'system',          role: 'System',         action: 'subscription.refund', resource: 'inv_3041 · $360',            severity: 'medium', icon: CreditCard },
  { id: 'evt_9072', ts: '10:18:22', actor: 'Hannah Wu',       role: 'Owner',          action: 'data.delete',         resource: 'customer record c_5512',     severity: 'high',   icon: Trash2 },
];

const SEVERITY_STYLE = {
  info:   'bg-cyan-500/10 text-cyan-300 ring-cyan-400/30',
  low:    'bg-emerald-500/10 text-emerald-300 ring-emerald-400/30',
  medium: 'bg-amber-500/10 text-amber-300 ring-amber-400/30',
  high:   'bg-rose-500/10 text-rose-300 ring-rose-400/30',
};

const FILTERS = ['all', 'info', 'low', 'medium', 'high'];

export default function AuditLogs() {
  const [query, setQuery] = useState('');
  const [sev, setSev]     = useState('all');

  const rows = useMemo(() => LOGS.filter((l) => {
    if (sev !== 'all' && l.severity !== sev) return false;
    if (query && !`${l.actor} ${l.action} ${l.resource}`.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  }), [query, sev]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Security & compliance"
          title="Audit Logs"
          subtitle="An immutable, searchable record of every meaningful action on the platform."
          crumbs={[{ label: 'Admin' }, { label: 'Audit Logs' }]}
          actions={(
            <button className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/[0.08]">
              <ArrowDownToLine className="h-3.5 w-3.5" /> Export
            </button>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Events (24h)" value="1,284" delta="↑ 6% vs avg"        tone="violet" icon={ScrollText} />
          <StatCard label="High severity" value={LOGS.filter((l) => l.severity === 'high').length} delta="Requires review" tone="rose" icon={ShieldAlert} />
          <StatCard label="Login failures" value="3" delta="Last 24h"             tone="amber" icon={KeyRound} />
          <StatCard label="Retention"   value="365d" delta="SOC2 compliant"        tone="emerald" />
        </div>

        <section className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="Search actor, action, or resource"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-violet-400/40 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-slate-500" />
              <div className="flex flex-wrap gap-1 rounded-xl border border-white/10 bg-white/[0.04] p-0.5 text-[11px] font-semibold">
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setSev(f)}
                    className={`rounded-lg px-2.5 py-1 capitalize transition-colors ${
                      sev === f ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >{f}</button>
                ))}
              </div>
            </div>
          </div>

          <ol className="relative mt-5 space-y-2 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-px before:bg-white/[0.05]">
            {rows.map((l) => {
              const Icon = l.icon;
              return (
                <li key={l.id} className="relative flex items-start gap-3">
                  <span className="relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/[0.04] ring-2 ring-[#0B1120]">
                    <Icon className="h-4 w-4 text-violet-200" />
                  </span>
                  <div className="min-w-0 flex-1 rounded-2xl border border-white/[0.05] bg-white/[0.02] p-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      <p className="text-sm font-semibold text-white">
                        <span className="font-mono text-cyan-300">{l.action}</span>
                        <span className="ml-2 text-slate-400">by</span>
                        <span className="ml-1.5">{l.actor}</span>
                        <span className="ml-1 text-[10px] text-slate-500">({l.role})</span>
                      </p>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ring-1 ${SEVERITY_STYLE[l.severity]}`}>
                          {l.severity}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500">{l.ts}</span>
                      </div>
                    </div>
                    <p className="mt-1 text-[12px] text-slate-300">→ {l.resource}</p>
                    <p className="mt-0.5 font-mono text-[10px] text-slate-500">{l.id}</p>
                  </div>
                </li>
              );
            })}
            {rows.length === 0 && <li className="py-10 text-center text-sm text-slate-500">No matching events.</li>}
          </ol>
        </section>
      </div>
    </AdminLayout>
  );
}
