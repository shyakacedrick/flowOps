// ============================================================================
//  Admin · Users — real cross-tenant user management
// ----------------------------------------------------------------------------
//  Backed by /api/users (platform_admin only). Supports:
//    - Search by name/email (client side, on top of server result)
//    - Filter by role (platform_admin | business_owner | staff)
//    - Filter by suspension state
//    - Per-row action menu: change role, suspend / unsuspend
//
//  Guard rails (admin cannot self-demote/self-suspend, last-admin rule) are
//  enforced on the server; this UI just disables the buttons that would
//  obviously fail and surfaces server errors otherwise.
// ============================================================================

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Filter, Users as UsersIcon, ShieldCheck, UserCog,
  RefreshCw, MoreHorizontal, X, AlertCircle, Save, ShieldOff,
  CheckCircle2, MailCheck, Mail, ScrollText,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '@/features/admin/components/AdminShell.jsx';
import PageHeader, { StatCard } from '@/shared/components/PageHeader.jsx';
import { SkeletonTableRows } from '@/shared/components/Skeleton.jsx';
import useUsers from '@/features/admin/hooks/useUsers.js';
import { useToast } from '@/shared/components/ToastProvider.jsx';
import { useAuth } from '@/app/providers/AuthProvider.jsx';
import { ROUTES } from '@/shared/constants/routes.js';

const ROLE_OPTIONS = ['platform_admin', 'business_owner', 'staff'];
const ROLE_LABEL = {
  platform_admin: 'Platform admin',
  business_owner: 'Owner',
  staff:          'Staff',
};
const ROLE_STYLE = {
  platform_admin: 'text-amber-300',
  business_owner: 'text-violet-300',
  staff:          'text-emerald-300',
};
const ROLE_FILTERS = ['all', ...ROLE_OPTIONS];
const STATUS_FILTERS = ['all', 'active', 'suspended'];

export default function Users() {
  const { session } = useAuth();
  const meId = session?.id || session?._id || null;

  const [roleFilter, setRoleFilter]     = useState('all');
  const [statusFilter, setStatusFilter] = useState('active');
  const [query, setQuery]               = useState('');
  const [openUser, setOpenUser]         = useState(null);

  // Server-side filters. `suspended` is computed from local pill.
  const serverFilters = {};
  if (roleFilter !== 'all') serverFilters.role = roleFilter;
  if (statusFilter === 'suspended') serverFilters.suspended = 'true';
  if (statusFilter === 'active')    serverFilters.suspended = 'false';

  const { users, status, error, refresh, update } = useUsers(serverFilters);

  const rows = useMemo(() => {
    if (!query) return users;
    const q = query.toLowerCase();
    return users.filter((u) => {
      const orgName = typeof u.organizationId === 'object' ? u.organizationId?.name : '';
      return `${u.name || ''} ${u.email || ''} ${orgName || ''}`.toLowerCase().includes(q);
    });
  }, [users, query]);

  const totalAdmins  = users.filter((u) => u.role === 'platform_admin').length;
  const totalOwners  = users.filter((u) => u.role === 'business_owner').length;
  const totalSuspended = users.filter((u) => u.suspendedAt).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Identity"
          title="Users"
          subtitle="Every person with access to FlowOps across all organizations."
          crumbs={[{ label: 'Admin' }, { label: 'Users' }]}
          actions={(
            <button
              onClick={refresh}
              disabled={status === 'loading'}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/[0.08] disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${status === 'loading' ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          )}
        />

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Users in view"    value={users.length}    delta={statusFilter === 'all' ? 'All users' : statusFilter === 'active' ? 'Active only' : 'Suspended only'} tone="violet"  icon={UsersIcon} />
          <StatCard label="Platform admins"  value={totalAdmins}     delta="Super-users"        tone="amber"   icon={ShieldCheck} />
          <StatCard label="Business owners"  value={totalOwners}     delta="Org administrators" tone="cyan" />
          <StatCard label="Suspended"        value={totalSuspended}  delta={statusFilter === 'active' ? 'Hidden in this view' : 'Frozen'} tone="rose" icon={ShieldOff} />
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
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-slate-500" />
              <Pills options={ROLE_FILTERS}   value={roleFilter}   onChange={setRoleFilter}   labelMap={ROLE_LABEL} />
              <Pills options={STATUS_FILTERS} value={statusFilter} onChange={setStatusFilter} />
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                <tr className="border-b border-white/[0.05]">
                  <th className="px-3 py-2.5 text-left">User</th>
                  <th className="px-3 py-2.5 text-left">Organization</th>
                  <th className="px-3 py-2.5 text-left">Role</th>
                  <th className="px-3 py-2.5 text-left">Email</th>
                  <th className="px-3 py-2.5 text-left">Status</th>
                  <th className="px-3 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => {
                  const orgName = typeof u.organizationId === 'object' ? u.organizationId?.name : null;
                  const isSelf = String(u._id) === String(meId);
                  return (
                    <tr key={u._id} className="border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02]">
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <span className="grid h-9 w-9 place-items-center rounded-full bg-white/[0.06] text-xs font-bold text-slate-200">
                            {initials(u.name)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white">
                              {u.name}
                              {isSelf && <span className="ml-1.5 rounded bg-violet-500/20 px-1 py-px text-[9px] font-bold text-violet-300">you</span>}
                            </p>
                            <p className="truncate font-mono text-[10px] text-slate-500">{u._id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-slate-300">{orgName || <span className="text-slate-500">—</span>}</td>
                      <td className={`px-3 py-3 text-xs font-semibold ${ROLE_STYLE[u.role] || 'text-slate-300'}`}>
                        {ROLE_LABEL[u.role] || u.role}
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-400">
                        <span className="inline-flex items-center gap-1.5">
                          {u.emailVerifiedAt
                            ? <MailCheck className="h-3 w-3 text-emerald-400" />
                            : <Mail      className="h-3 w-3 text-slate-500" />}
                          <span className="truncate">{u.email}</span>
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        {u.suspendedAt ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold text-rose-300 ring-1 ring-rose-400/30">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-400" /> Suspended
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 ring-1 ring-emerald-400/30">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Active
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <button
                          onClick={() => setOpenUser(u)}
                          className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-white/[0.06] hover:text-white"
                          aria-label="Manage user"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 && status === 'ready' && (
                  <tr><td colSpan={6} className="py-10 text-center text-sm text-slate-500">No matching users.</td></tr>
                )}
                {status === 'loading' && rows.length === 0 && (
                  <SkeletonTableRows colSpan={6} rows={5} />
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <UserDrawer
        user={openUser}
        meId={meId}
        onClose={() => setOpenUser(null)}
        onSave={async (id, body) => {
          const res = await update(id, body);
          if (res.ok) setOpenUser(res.data);
          return res;
        }}
      />
    </AdminLayout>
  );
}

// ─── atoms ───────────────────────────────────────────────────────────────────

function Pills({ options, value, onChange, labelMap }) {
  return (
    <div className="flex flex-wrap gap-1 rounded-xl border border-white/10 bg-white/[0.04] p-0.5 text-[11px] font-semibold">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`rounded-lg px-2.5 py-1 capitalize transition-colors ${
            value === opt ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >{labelMap?.[opt] || opt}</button>
      ))}
    </div>
  );
}

function initials(name) {
  return (name || '?').split(/\s+/).map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

// ─── drawer ──────────────────────────────────────────────────────────────────

function UserDrawer({ user, meId, onClose, onSave }) {
  return (
    <AnimatePresence>
      {user && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm" />
          <motion.aside
            initial={{ x: 480 }} animate={{ x: 0 }} exit={{ x: 480 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-y-auto border-l border-white/[0.06] bg-[#0B1120] p-6"
          >
            <UserDrawerBody user={user} meId={meId} onClose={onClose} onSave={onSave} />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function UserDrawerBody({ user, meId, onClose, onSave }) {
  const [role,  setRole]  = useState(user.role);
  const [busy,  setBusy]  = useState(null);
  const toast = useToast();

  const isSelf     = String(user._id) === String(meId);
  const suspended  = !!user.suspendedAt;
  const orgName    = typeof user.organizationId === 'object' ? user.organizationId?.name : null;

  const save = async (kind, body, successMsg) => {
    setBusy(kind);
    const res = await onSave(user._id, body);
    setBusy(null);
    if (!res.ok) {
      toast.error(res.message || 'Update failed');
      return;
    }
    if (successMsg) toast.success(successMsg);
  };

  // We disable buttons the server would reject so the user sees the constraint
  // before clicking. The server still enforces the same rules authoritatively.
  const cannotDemote   = isSelf && user.role === 'platform_admin' && role !== 'platform_admin';
  const cannotSuspend  = isSelf || user.role === 'platform_admin';

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.06] text-base font-bold text-slate-200">
            {initials(user.name)}
          </span>
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-white">{user.name}</h3>
            <p className="truncate text-xs text-slate-400">{user.email}</p>
            <p className="font-mono text-[10px] text-slate-500">{user._id}</p>
          </div>
        </div>
        <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 text-slate-400">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2.5">
        <DrawerStat label="Role"         value={ROLE_LABEL[user.role] || user.role} icon={UserCog} />
        <DrawerStat label="Organization" value={orgName || '—'} icon={UsersIcon} />
        <DrawerStat
          label="Email"
          value={user.emailVerifiedAt ? 'Verified' : 'Unverified'}
          icon={user.emailVerifiedAt ? MailCheck : Mail}
        />
        <DrawerStat
          label="Status"
          value={suspended ? 'Suspended' : 'Active'}
          icon={suspended ? ShieldOff : CheckCircle2}
        />
      </div>

      {/* Audit trail — links to a dedicated per-user activity page. */}
      <Link
        to={ROUTES.admin.userActivity.replace(':userId', user._id)}
        state={{ user }}
        className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-violet-400/30 bg-violet-500/10 px-3 py-2 text-xs font-semibold text-violet-200 hover:bg-violet-500/20"
      >
        <ScrollText className="h-3.5 w-3.5" />
        View activity log
      </Link>

      {/* Role */}
      <div className="mt-6">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Change role</p>
        <div className="mt-2 flex items-center gap-2">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-200 focus:border-violet-400/40 focus:outline-none"
          >
            {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
          </select>
          <button
            onClick={() => save('role', { role }, `Role changed to ${ROLE_LABEL[role] || role}`)}
            disabled={busy === 'role' || role === user.role || cannotDemote}
            title={cannotDemote ? "You can't demote yourself" : undefined}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            {busy === 'role' ? 'Saving…' : 'Save'}
          </button>
        </div>
        {cannotDemote && (
          <p className="mt-1.5 text-[10px] text-rose-300">You can't demote yourself.</p>
        )}
      </div>

      {/* Suspension */}
      <div className="mt-6">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          {suspended ? 'Lift suspension' : 'Suspend user'}
        </p>
        {suspended ? (
          <>
            <p className="mt-2 text-xs text-slate-400">Suspended since {fmtDate(user.suspendedAt)}.</p>
            <button
              onClick={() => save('unsuspend', { suspended: false }, `${user.name} unsuspended`)}
              disabled={busy === 'unsuspend'}
              className="mt-3 w-full rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-50"
            >
              {busy === 'unsuspend' ? 'Lifting…' : 'Lift suspension'}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => save('suspend', { suspended: true }, `${user.name} suspended`)}
              disabled={busy === 'suspend' || cannotSuspend}
              title={cannotSuspend
                ? (isSelf ? "You can't suspend yourself" : 'Platform admins cannot be suspended')
                : undefined}
              className="mt-2 w-full rounded-xl border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-200 hover:bg-rose-500/20 disabled:opacity-50"
            >
              {busy === 'suspend' ? 'Suspending…' : 'Suspend user'}
            </button>
            {cannotSuspend && (
              <p className="mt-1.5 text-[10px] text-rose-300">
                {isSelf ? "You can't suspend yourself." : 'Platform admins cannot be suspended.'}
              </p>
            )}
            <p className="mt-2 text-[10px] text-slate-500">
              Suspending revokes every active session and blocks future sign-ins
              until lifted.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function DrawerStat({ label, value, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
        {Icon && <Icon className="h-3 w-3" />} {label}
      </div>
      <p className="mt-1 text-sm font-bold text-white">{value}</p>
    </div>
  );
}

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
