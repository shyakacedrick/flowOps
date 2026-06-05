import { useMemo, useState } from 'react';
import { Search, Filter, Users as UsersIcon, ShieldCheck, UserCog, UserPlus } from 'lucide-react';
import AdminLayout from '@/features/admin/components/AdminShell.jsx';
import PageHeader, { StatCard } from '@/shared/components/PageHeader.jsx';

const USERS = [
  { id: 'u_001', name: 'Jordan Lee',     email: 'jordan@flowops.app',        org: 'Riverside Family Clinic', role: 'Owner',  status: 'active',  last: '2m ago' },
  { id: 'u_002', name: 'Priya Patel',    email: 'priya@bancocentral.com',    org: 'Banco Central',           role: 'Admin',  status: 'active',  last: '15m ago' },
  { id: 'u_003', name: 'Marcus Cohen',   email: 'marcus@stmary.org',         org: 'St. Mary Hospital',       role: 'Owner',  status: 'active',  last: '1h ago' },
  { id: 'u_004', name: 'Yuki Tanaka',    email: 'yuki@sakuraramen.jp',       org: 'Sakura Ramen House',      role: 'Staff',  status: 'active',  last: '5m ago' },
  { id: 'u_005', name: 'Diego Romero',   email: 'diego@cityhall.gov',        org: 'City Hall · Permits',     role: 'Staff',  status: 'active',  last: '40m ago' },
  { id: 'u_006', name: 'Aisha Khan',     email: 'aisha@northbank.com',       org: 'NorthBank Queue',         role: 'Admin',  status: 'invited', last: 'Pending' },
  { id: 'u_007', name: 'Lena Hoffman',   email: 'lena@lushsalon.co',         org: 'Lush Salon · Downtown',   role: 'Owner',  status: 'active',  last: '3h ago' },
  { id: 'u_008', name: 'Tomás Silva',    email: 'tomas@velvethair.co',       org: 'Velvet Hair Studio',      role: 'Staff',  status: 'suspended', last: '6d ago' },
  { id: 'u_009', name: 'Hannah Wu',      email: 'hannah@skylinedental.com',  org: 'Skyline Dental Group',    role: 'Owner',  status: 'active',  last: '22m ago' },
  { id: 'u_010', name: 'Omar Khalil',    email: 'omar@flowops.app',          org: 'FlowOps · Platform',      role: 'Platform Admin', status: 'active', last: '1m ago' },
  { id: 'u_011', name: 'Sofia Romanov',  email: 'sofia@bancocentral.com',    org: 'Banco Central',           role: 'Staff',  status: 'active',  last: '12m ago' },
  { id: 'u_012', name: 'Chen Wei',       email: 'chen@pawsomevets.com',      org: 'Pawsome Vets',            role: 'Owner',  status: 'inactive', last: '12d ago' },
];

const ROLES = ['all', 'Owner', 'Admin', 'Staff', 'Platform Admin'];

const STATUS_STYLE = {
  active:    'bg-emerald-500/10 text-emerald-300 ring-emerald-400/30',
  invited:   'bg-cyan-500/10 text-cyan-300 ring-cyan-400/30',
  suspended: 'bg-rose-500/10 text-rose-300 ring-rose-400/30',
  inactive:  'bg-white/[0.04] text-slate-400 ring-white/10',
};
const ROLE_STYLE = {
  'Owner':          'text-violet-300',
  'Admin':          'text-cyan-300',
  'Staff':          'text-emerald-300',
  'Platform Admin': 'text-amber-300',
};

export default function Users() {
  const [query, setQuery] = useState('');
  const [role, setRole]   = useState('all');

  const rows = useMemo(() => USERS.filter((u) => {
    if (role !== 'all' && u.role !== role) return false;
    if (query && !`${u.name} ${u.email} ${u.org}`.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  }), [query, role]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Identity"
          title="Users"
          subtitle="Every person with access to FlowOps across all organizations."
          crumbs={[{ label: 'Admin' }, { label: 'Users' }]}
          actions={(
            <button className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 px-3 py-1.5 text-xs font-semibold text-white shadow-[0_8px_24px_-12px_rgba(139,92,246,0.7)]">
              <UserPlus className="h-3.5 w-3.5" /> Invite user
            </button>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total users"   value={USERS.length} delta="Across all orgs"  tone="violet" icon={UsersIcon} />
          <StatCard label="Active"        value={USERS.filter((u) => u.status === 'active').length} delta="Signed in 30d" tone="emerald" />
          <StatCard label="Admins"        value={USERS.filter((u) => u.role.includes('Admin') || u.role === 'Owner').length} delta="Privileged" tone="cyan" icon={ShieldCheck} />
          <StatCard label="Pending invites" value={USERS.filter((u) => u.status === 'invited').length} delta="Awaiting accept" tone="amber" icon={UserCog} />
        </div>

        <section className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="Search users, email, or organization"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-violet-400/40 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-slate-500" />
              <div className="flex flex-wrap gap-1 rounded-xl border border-white/10 bg-white/[0.04] p-0.5 text-[11px] font-semibold">
                {ROLES.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRole(r)}
                    className={`rounded-lg px-2.5 py-1 transition-colors ${
                      role === r ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >{r}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                <tr className="border-b border-white/[0.05]">
                  <th className="px-3 py-2.5 text-left">User</th>
                  <th className="px-3 py-2.5 text-left">Organization</th>
                  <th className="px-3 py-2.5 text-left">Role</th>
                  <th className="px-3 py-2.5 text-left">Status</th>
                  <th className="px-3 py-2.5 text-left">Last login</th>
                  <th className="px-3 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => (
                  <tr key={u.id} className="border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02]">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 place-items-center rounded-full bg-white/[0.06] text-xs font-bold text-slate-200">
                          {u.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">{u.name}</p>
                          <p className="truncate text-[11px] text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-slate-300">{u.org}</td>
                    <td className={`px-3 py-3 text-xs font-semibold ${ROLE_STYLE[u.role] || 'text-slate-300'}`}>{u.role}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ring-1 ${STATUS_STYLE[u.status]}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-400">{u.last}</td>
                    <td className="px-3 py-3 text-right">
                      <button className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:bg-white/[0.08]">
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
