import { useMemo, useState } from 'react';
import {
  Building2, Search, Filter, MoreHorizontal, X, ExternalLink,
  Users, Activity, CreditCard, Mail, Globe, Calendar,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '../../layout/AdminLayout.jsx';
import PageHeader, { StatCard } from '../../components/shared/PageHeader.jsx';

const ORGS = [
  { id: 'org_001', name: 'Riverside Family Clinic',    industry: 'Clinic',     plan: 'Premium',    status: 'active',  users: 14, locations: 2,  last: '2m ago',   joined: '2024-08-12', mrr: 480 },
  { id: 'org_002', name: 'Banco Central',              industry: 'Bank',       plan: 'Enterprise', status: 'active',  users: 87, locations: 12, last: '11m ago',  joined: '2023-11-04', mrr: 2400 },
  { id: 'org_003', name: 'Lush Salon · Downtown',      industry: 'Salon',      plan: 'Free',       status: 'trial',   users: 3,  locations: 1,  last: '1h ago',   joined: '2026-05-30', mrr: 0 },
  { id: 'org_004', name: 'St. Mary Hospital',          industry: 'Hospital',   plan: 'Enterprise', status: 'active',  users: 142, locations: 4, last: '4m ago',   joined: '2023-04-18', mrr: 3800 },
  { id: 'org_005', name: 'City Hall · Permits Office', industry: 'Government', plan: 'Premium',    status: 'active',  users: 22, locations: 1,  last: '23m ago',  joined: '2024-02-09', mrr: 720 },
  { id: 'org_006', name: 'Sakura Ramen House',         industry: 'Restaurant', plan: 'Premium',    status: 'active',  users: 8,  locations: 3,  last: '8m ago',   joined: '2025-01-22', mrr: 360 },
  { id: 'org_007', name: 'NorthBank Queue',            industry: 'Bank',       plan: 'Enterprise', status: 'degraded',users: 64, locations: 9,  last: '14m ago',  joined: '2023-09-01', mrr: 2100 },
  { id: 'org_008', name: 'Pawsome Vets',               industry: 'Clinic',     plan: 'Free',       status: 'inactive',users: 2,  locations: 1,  last: '12d ago',  joined: '2025-10-14', mrr: 0 },
  { id: 'org_009', name: 'Velvet Hair Studio',         industry: 'Salon',      plan: 'Premium',    status: 'active',  users: 5,  locations: 1,  last: '1h ago',   joined: '2024-12-03', mrr: 240 },
  { id: 'org_010', name: 'Skyline Dental Group',       industry: 'Clinic',     plan: 'Premium',    status: 'active',  users: 18, locations: 4,  last: '45m ago',  joined: '2024-06-18', mrr: 620 },
];

const STATUS_STYLE = {
  active:   { text: 'text-emerald-300', bg: 'bg-emerald-500/10', ring: 'ring-emerald-400/30', dot: 'bg-emerald-400' },
  trial:    { text: 'text-cyan-300',    bg: 'bg-cyan-500/10',    ring: 'ring-cyan-400/30',    dot: 'bg-cyan-400' },
  degraded: { text: 'text-amber-300',   bg: 'bg-amber-500/10',   ring: 'ring-amber-400/30',   dot: 'bg-amber-400' },
  inactive: { text: 'text-slate-400',   bg: 'bg-white/[0.04]',   ring: 'ring-white/10',       dot: 'bg-slate-500' },
};

const PLAN_STYLE = {
  Free:       'bg-white/[0.05] text-slate-300 ring-white/10',
  Premium:    'bg-cyan-500/10 text-cyan-200 ring-cyan-400/30',
  Enterprise: 'bg-gradient-to-r from-violet-500/20 to-cyan-500/20 text-violet-200 ring-violet-400/30',
};

const FILTERS = ['all', 'active', 'trial', 'degraded', 'inactive'];

export default function Organizations() {
  const [query, setQuery]   = useState('');
  const [filter, setFilter] = useState('all');
  const [open, setOpen]     = useState(null);

  const rows = useMemo(() => ORGS.filter((o) => {
    if (filter !== 'all' && o.status !== filter) return false;
    if (query && !`${o.name} ${o.industry}`.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  }), [query, filter]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Customer accounts"
          title="Organizations"
          subtitle="Every business using FlowOps — searchable, filterable, fully drillable."
          crumbs={[{ label: 'Admin' }, { label: 'Organizations' }]}
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total"      value={ORGS.length}                                       delta="All accounts"  tone="violet" icon={Building2} />
          <StatCard label="Active"     value={ORGS.filter((o) => o.status === 'active').length}  delta="Healthy"        tone="emerald" />
          <StatCard label="On trial"   value={ORGS.filter((o) => o.status === 'trial').length}   delta="Convert soon"   tone="cyan" />
          <StatCard label="Need attention" value={ORGS.filter((o) => o.status === 'degraded' || o.status === 'inactive').length} delta="Degraded + inactive" tone="amber" />
        </div>

        <section className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="Search organizations or industry"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-violet-400/40 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-slate-500" />
              <div className="flex flex-wrap gap-1 rounded-xl border border-white/10 bg-white/[0.04] p-0.5 text-[11px] font-semibold">
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`rounded-lg px-2.5 py-1 capitalize transition-colors ${
                      filter === f ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >{f}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                <tr className="border-b border-white/[0.05]">
                  <th className="px-3 py-2.5 text-left">Organization</th>
                  <th className="px-3 py-2.5 text-left">Industry</th>
                  <th className="px-3 py-2.5 text-left">Plan</th>
                  <th className="px-3 py-2.5 text-left">Status</th>
                  <th className="px-3 py-2.5 text-left">Users</th>
                  <th className="px-3 py-2.5 text-left">Last activity</th>
                  <th className="px-3 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {rows.map((o) => {
                  const s = STATUS_STYLE[o.status];
                  return (
                    <tr key={o.id} className="border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02]">
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500/40 to-cyan-500/30 text-xs font-bold text-white">
                            {o.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white">{o.name}</p>
                            <p className="truncate font-mono text-[10px] text-slate-500">{o.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-slate-300">{o.industry}</td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${PLAN_STYLE[o.plan]}`}>
                          {o.plan}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ring-1 ${s.text} ${s.bg} ${s.ring}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                          {o.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-mono text-xs text-slate-300">{o.users}</td>
                      <td className="px-3 py-3 text-xs text-slate-400">{o.last}</td>
                      <td className="px-3 py-3 text-right">
                        <button
                          onClick={() => setOpen(o)}
                          className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-white/[0.06] hover:text-white"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <OrgDrawer org={open} onClose={() => setOpen(null)} />
    </AdminLayout>
  );
}

function OrgDrawer({ org, onClose }) {
  return (
    <AnimatePresence>
      {org && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm" />
          <motion.aside
            initial={{ x: 480 }} animate={{ x: 0 }} exit={{ x: 480 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-y-auto border-l border-white/[0.06] bg-[#0B1120] p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-violet-500/40 to-cyan-500/30 text-base font-bold text-white">
                  {org.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
                </span>
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-white">{org.name}</h3>
                  <p className="font-mono text-[10px] text-slate-500">{org.id}</p>
                </div>
              </div>
              <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 text-slate-400">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2.5">
              <DrawerStat label="Plan"      value={org.plan} icon={CreditCard} />
              <DrawerStat label="Status"    value={org.status} icon={Activity} />
              <DrawerStat label="Users"     value={org.users} icon={Users} />
              <DrawerStat label="Locations" value={org.locations} icon={Globe} />
              <DrawerStat label="MRR"       value={`$${org.mrr}`} icon={CreditCard} />
              <DrawerStat label="Joined"    value={org.joined} icon={Calendar} />
            </div>

            <div className="mt-6">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Primary contact</p>
              <div className="mt-2 flex items-center gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.02] p-3">
                <Mail className="h-4 w-4 text-violet-300" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">admin@{org.name.toLowerCase().replace(/[^a-z]/g, '').slice(0, 10)}.com</p>
                  <p className="text-[10px] text-slate-500">Owner · last login {org.last}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button className="flex-1 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white">
                Open workspace
              </button>
              <button className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 text-slate-300 hover:bg-white/[0.04]">
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function DrawerStat({ label, value, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <p className="mt-1 text-sm font-bold capitalize text-white">{value}</p>
    </div>
  );
}
