// ============================================================================
//  InvitesPanel — owner-facing CRUD over /api/invites
// ----------------------------------------------------------------------------
//  Lets owners (and platform admins) invite new staff/owners by email.
//  Invites are copy-paste URLs in Phase 9 (email sending lands in Phase 11+).
// ============================================================================

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Mail, Plus, Copy, Check, Trash2, AlertCircle, ShieldCheck, Send } from 'lucide-react';
import inviteApi from '@/services/inviteApi.js';
import { useConfirm } from '@/shared/components/ConfirmProvider.jsx';
import { useToast }   from '@/shared/components/ToastProvider.jsx';

const ROLE_LABEL = {
  business_owner: 'Owner',
  staff: 'Staff',
};
const STATUS_TONE = {
  pending:  'bg-amber-500/10 text-amber-300 ring-amber-400/20',
  accepted: 'bg-emerald-500/10 text-emerald-300 ring-emerald-400/20',
  revoked:  'bg-slate-500/10 text-slate-300 ring-slate-400/20',
  expired:  'bg-rose-500/10 text-rose-300 ring-rose-400/20',
};

const inviteUrl = (token) => `${window.location.origin}/invite/${token}`;

export default function InvitesPanel() {
  const [invites, setInvites] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);

  const [email, setEmail] = useState('');
  const [role, setRole] = useState('staff');
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState(null);

  const [copiedId, setCopiedId] = useState(null);
  const [busyIds, setBusyIds] = useState(() => new Set());

  const confirm = useConfirm();
  const toast   = useToast();

  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);
    const res = await inviteApi.list();
    if (!res.ok) {
      setError(res.message || 'Failed to load invites');
      setStatus('error');
      return;
    }
    setInvites(Array.isArray(res.data) ? res.data : []);
    setStatus('ready');
  }, []);

  useEffect(() => { load(); }, [load]);

  const onCreate = async (e) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || creating) return;
    setFormError(null);
    setCreating(true);
    const res = await inviteApi.create({ email: trimmed, role });
    setCreating(false);
    if (!res.ok) {
      setFormError(res.message || 'Failed to create invite');
      return;
    }
    setEmail('');
    setInvites((prev) => [res.data, ...prev]);
    toast.success(`Invite sent to ${trimmed}`);
  };

  const onCopy = async (invite) => {
    try {
      await navigator.clipboard.writeText(inviteUrl(invite.token));
      setCopiedId(invite._id);
      setTimeout(() => setCopiedId((id) => (id === invite._id ? null : id)), 1800);
    } catch { /* clipboard blocked */ }
  };

  const onRevoke = async (invite) => {
    const ok = await confirm({
      title: `Revoke invite for ${invite.email}?`,
      message: 'The link will stop working immediately. You can send a new invite anytime.',
      confirmLabel: 'Revoke invite',
      danger: true,
    });
    if (!ok) return;
    setBusyIds((prev) => new Set(prev).add(invite._id));
    const res = await inviteApi.revoke(invite._id);
    setBusyIds((prev) => { const n = new Set(prev); n.delete(invite._id); return n; });
    if (!res.ok) {
      toast.error(res.message || 'Failed to revoke invite');
      return;
    }
    // Optimistically mark it revoked in the local list.
    setInvites((prev) =>
      prev.map((i) =>
        i._id === invite._id ? { ...i, status: 'revoked', revokedAt: new Date().toISOString() } : i
      )
    );
    toast.success(`Invite for ${invite.email} revoked`);
  };

  return (
    <section className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">Team invitations</h3>
          <p className="text-xs text-slate-400">
            Invite teammates by email — they'll set their own password on the accept page.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 ring-1 ring-emerald-400/20">
          <ShieldCheck className="h-3 w-3" />
          Token-based · 7-day expiry
        </span>
      </div>

      {/* Create form */}
      <form onSubmit={onCreate} className="mt-4 grid gap-2 sm:grid-cols-[1fr_140px_auto]">
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="teammate@company.com"
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/30"
        >
          <option value="staff">Staff</option>
          <option value="business_owner">Owner</option>
        </select>
        <button
          type="submit"
          disabled={!email.trim() || creating}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-3.5 py-2 text-xs font-semibold text-slate-900 transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          {creating ? 'Creating…' : 'Send invite'}
        </button>
      </form>

      {formError && (
        <div role="alert" className="mt-3 flex items-start gap-2 rounded-xl border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-xs text-rose-200">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* List */}
      <div className="mt-5">
        {status === 'loading' && (
          <p className="py-6 text-center text-xs text-slate-500">Loading invites…</p>
        )}
        {status === 'error' && (
          <p className="py-6 text-center text-xs text-rose-300">
            {error || 'Failed to load invites.'}
          </p>
        )}
        {status === 'ready' && invites.length === 0 && (
          <p className="py-6 text-center text-xs text-slate-500">
            No invites yet. Send one above to add your first teammate.
          </p>
        )}

        {invites.length > 0 && (
          <ul className="divide-y divide-white/[0.05]">
            {invites.map((inv) => {
              const isBusy = busyIds.has(inv._id);
              const isPending = inv.status === 'pending';
              return (
                <li key={inv._id} className="flex items-center gap-3 py-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/[0.06] text-xs font-bold text-cyan-200">
                    {inv.email[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{inv.email}</p>
                    <p className="truncate text-[11px] text-slate-400">
                      {ROLE_LABEL[inv.role] || inv.role} · invited {formatDate(inv.createdAt)}
                      {inv.acceptedAt && ` · accepted ${formatDate(inv.acceptedAt)}`}
                    </p>
                  </div>

                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${STATUS_TONE[inv.status] || STATUS_TONE.expired}`}>
                    {inv.status}
                  </span>

                  {isPending && (
                    <>
                      <button
                        type="button"
                        onClick={() => onCopy(inv)}
                        title="Copy invite link"
                        className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 transition hover:border-primary/40 hover:text-primary"
                      >
                        {copiedId === inv._id ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => onRevoke(inv)}
                        disabled={isBusy}
                        title="Revoke invite"
                        className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-rose-300 transition hover:border-rose-400/40 hover:bg-rose-500/10 disabled:opacity-40"
                      >
                        {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </button>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

function formatDate(iso) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString(); } catch { return '—'; }
}
