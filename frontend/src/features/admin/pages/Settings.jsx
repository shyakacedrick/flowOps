import { useEffect, useMemo, useState } from 'react';
import {
  Settings as SettingsIcon, Lock, Bell, Shield, Flag, KeyRound, ChevronRight, Plus,
  User as UserIcon, Loader2, AlertCircle, Check, Undo2, Save, Trash2, Mail, MessageSquare, Globe,
  AlertOctagon,
} from 'lucide-react';
import AdminLayout from '@/features/admin/components/AdminShell.jsx';
import PageHeader from '@/shared/components/PageHeader.jsx';
import ProfileSection from '@/features/settings/components/ProfileSection.jsx';
import usePlatformSettings from '@/features/admin/hooks/usePlatformSettings.js';
import useFeatureFlags from '@/features/admin/hooks/useFeatureFlags.js';
import useNotificationRules from '@/features/admin/hooks/useNotificationRules.js';

const SECTIONS = [
  { key: 'profile',       label: 'My profile',       icon: UserIcon },
  { key: 'platform',      label: 'Platform',         icon: SettingsIcon },
  { key: 'auth',          label: 'Authentication',   icon: Lock },
  { key: 'notifications', label: 'Notifications',    icon: Bell },
  { key: 'security',      label: 'Security policies',icon: Shield },
  { key: 'flags',         label: 'Feature flags',    icon: Flag },
  { key: 'permissions',   label: 'Role permissions', icon: KeyRound },
];

export default function Settings() {
  const [active, setActive] = useState('profile');

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Configuration"
          title="Settings"
          subtitle="Platform-wide configuration. Changes apply to every organization."
          crumbs={[{ label: 'Admin' }, { label: 'Settings' }]}
        />

        <div className="grid gap-5 lg:grid-cols-12">
          <aside className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-3 lg:col-span-3">
            <ul className="space-y-0.5">
              {SECTIONS.map((s) => {
                const Icon = s.icon;
                const isActive = active === s.key;
                return (
                  <li key={s.key}>
                    <button
                      onClick={() => setActive(s.key)}
                      className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                        isActive ? 'bg-white/[0.06] text-white' : 'text-slate-400 hover:bg-white/[0.03] hover:text-slate-200'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="flex-1 text-left">{s.label}</span>
                      <ChevronRight className={`h-3 w-3 ${isActive ? 'text-violet-300' : 'opacity-40'}`} />
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          <section className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6 lg:col-span-9">
            {active === 'profile' && <ProfileSection />}
            {active === 'platform' && <PlatformBlock />}
            {active === 'auth' && (
              <Block title="Authentication" desc="Sign-in methods and identity provider configuration." comingSoon>
                <Toggle label="Email + password"     desc="Built-in password authentication." enabled />
                <Toggle label="Magic links"          desc="Passwordless email sign-in." enabled />
                <Toggle label="Google SSO"           desc="OAuth via Google Workspace." enabled />
                <Toggle label="Microsoft / Azure AD" desc="OAuth + SAML." enabled />
                <Toggle label="Okta SAML"            desc="Enterprise tier only." />
                <Field label="Session timeout"       value="14 days" action="Change" />
              </Block>
            )}
            {active === 'notifications' && (
              <NotificationsBlock />
            )}
            {active === 'security' && (
              <Block title="Security policies" desc="Platform-wide security guardrails." comingSoon>
                <Toggle label="Require 2FA for admins"        desc="Enforce TOTP/WebAuthn for privileged roles." enabled />
                <Toggle label="IP allowlist for platform admin" desc="Restrict /admin access to corporate range." />
                <Toggle label="Auto-rotate API keys (90d)"     desc="Force key rotation quarterly." enabled />
                <Toggle label="Audit log export to S3"         desc="Stream events to compliance bucket." enabled />
                <Field label="Password policy"        value="Min 12 chars · 1 upper · 1 digit" action="Edit" />
                <Field label="Encryption at rest"     value="AES-256 · KMS-managed" />
              </Block>
            )}
            {active === 'flags' && (
              <FlagsBlock />
            )}
            {active === 'permissions' && (
              <Block title="Role permissions" desc="What each role can do across the platform." comingSoon>
                <PermissionRow role="Platform Admin" perms="Full access · everything" />
                <PermissionRow role="Owner"          perms="Manage own org · billing · users · queues" />
                <PermissionRow role="Admin"          perms="Manage org users · queues · settings (no billing)" />
                <PermissionRow role="Staff"          perms="Operate queues · serve customers · view own activity" />
                <button className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/[0.08]">
                  <Plus className="h-3.5 w-3.5" /> Create custom role
                </button>
              </Block>
            )}
          </section>
        </div>
      </div>
    </AdminLayout>
  );
}

function Block({ title, desc, children, comingSoon = false }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {comingSoon && (
          <span className="rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-200 ring-1 ring-amber-400/30">
            Coming soon
          </span>
        )}
      </div>
      <p className="text-xs text-slate-400">{desc}</p>
      {comingSoon && (
        <p className="mt-2 text-[11px] text-amber-300/80">
          These controls are UI scaffolding — changes won’t persist until the backend ships.
        </p>
      )}
      <div className={`mt-5 space-y-2 ${comingSoon ? 'opacity-60' : ''}`}>{children}</div>
    </div>
  );
}

function Field({ label, value, action }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/[0.05] bg-white/[0.02] px-4 py-3">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">{label}</p>
        <p className="mt-0.5 text-sm font-medium text-white">{value}</p>
      </div>
      {action && (
        <button className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/[0.08]">
          {action}
        </button>
      )}
    </div>
  );
}

function Toggle({ label, desc, enabled: initial }) {
  const [on, setOn] = useState(!!initial);
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-white/[0.05] bg-white/[0.02] px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white">{label}</p>
        <p className="mt-0.5 text-[11px] text-slate-400">{desc}</p>
      </div>
      <button
        onClick={() => setOn((v) => !v)}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
          on ? 'bg-gradient-to-r from-violet-400 to-cyan-400' : 'bg-white/10'
        }`}
        aria-pressed={on}
      >
        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${on ? 'translate-x-5' : 'translate-x-1'}`} />
      </button>
    </div>
  );
}

function FlagsBlock() {
  const { flags, status, error, patch } = useFeatureFlags();

  if (status === 'loading' || status === 'idle') {
    return (
      <Block title="Feature flags" desc="Roll features out safely to a subset of orgs.">
        <div className="flex items-center gap-2 rounded-2xl border border-white/[0.05] bg-white/[0.02] px-4 py-6 text-xs text-slate-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading feature flags…
        </div>
      </Block>
    );
  }
  if (status === 'error') {
    return (
      <Block title="Feature flags" desc="Roll features out safely to a subset of orgs.">
        <div className="flex items-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/[0.06] px-4 py-3 text-xs text-rose-200">
          <AlertCircle className="h-3.5 w-3.5" /> {error || 'Failed to load flags.'}
        </div>
      </Block>
    );
  }
  if (flags.length === 0) {
    return (
      <Block title="Feature flags" desc="Roll features out safely to a subset of orgs.">
        <p className="rounded-2xl border border-white/[0.05] bg-white/[0.02] px-4 py-6 text-xs text-slate-400">
          No feature flags have been declared yet. Seed them via the admin API
          (<code className="font-mono text-cyan-300">POST /api/admin/feature-flags</code>) — UI for
          creating flags ships in a later release.
        </p>
      </Block>
    );
  }
  return (
    <Block title="Feature flags" desc="Roll features out safely to a subset of orgs.">
      <ul className="space-y-2">
        {flags.map((f) => (
          <li key={f.key} className="flex items-center gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.02] px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-mono text-xs text-cyan-300">{f.key}</p>
                <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-300">
                  {f.stage}
                </span>
              </div>
              {f.description && (
                <p className="mt-0.5 text-[11px] text-slate-400">{f.description}</p>
              )}
            </div>
            <BoundToggle
              enabled={!!f.enabled}
              onChange={(next) => patch(f.key, { enabled: next })}
              ariaLabel={`Toggle ${f.key}`}
            />
          </li>
        ))}
      </ul>
    </Block>
  );
}

// ────────────────────────────────────────────────────────────────────────────
//  NotificationsBlock — bound to /api/admin/notification-rules
//  Lists every rule with inline enable/disable + channel/severity edit +
//  delete. New rules are added via a compact "Add rule" form rendered at
//  the bottom; useNotificationRules takes care of optimistic state.
// ────────────────────────────────────────────────────────────────────────────

const CHANNEL_OPTIONS  = ['email', 'slack', 'pagerduty', 'webhook'];
const SEVERITY_OPTIONS = ['info', 'warning', 'critical'];

const CHANNEL_META = {
  email:     { icon: Mail,           label: 'Email'      },
  slack:     { icon: MessageSquare,  label: 'Slack'      },
  pagerduty: { icon: AlertOctagon,   label: 'PagerDuty'  },
  webhook:   { icon: Globe,          label: 'Webhook'    },
};

const SEVERITY_BADGE = {
  info:     'bg-cyan-500/15 text-cyan-200 ring-cyan-400/30',
  warning:  'bg-amber-500/15 text-amber-200 ring-amber-400/30',
  critical: 'bg-rose-500/15 text-rose-200 ring-rose-400/30',
};

function NotificationsBlock() {
  const { rules, status, error, patch, create, remove } = useNotificationRules();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft]   = useState({ key: '', label: '', description: '', channel: 'email', severity: 'info', target: '' });
  const [createError, setCreateError] = useState(null);
  const [creating, setCreating]       = useState(false);

  const resetDraft = () => {
    setDraft({ key: '', label: '', description: '', channel: 'email', severity: 'info', target: '' });
    setCreateError(null);
  };

  const onCreate = async () => {
    setCreateError(null);
    const key = draft.key.trim().toLowerCase();
    if (!/^[a-z][a-z0-9_]{1,63}$/.test(key)) {
      setCreateError('Key must be lowercase snake_case, 2-64 chars (e.g. failed_payments).');
      return;
    }
    if (!draft.label.trim()) { setCreateError('Label is required.'); return; }
    setCreating(true);
    const res = await create({ ...draft, key, label: draft.label.trim() });
    setCreating(false);
    if (!res.ok) { setCreateError(res.message || 'Failed to create rule.'); return; }
    setAdding(false);
    resetDraft();
  };

  if (status === 'loading' || status === 'idle') {
    return (
      <Block title="Notification rules" desc="When and how the platform alerts admins.">
        <div className="flex items-center gap-2 rounded-2xl border border-white/[0.05] bg-white/[0.02] px-4 py-6 text-xs text-slate-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading rules…
        </div>
      </Block>
    );
  }
  if (status === 'error') {
    return (
      <Block title="Notification rules" desc="When and how the platform alerts admins.">
        <div className="flex items-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/[0.06] px-4 py-3 text-xs text-rose-200">
          <AlertCircle className="h-3.5 w-3.5" /> {error || 'Failed to load rules.'}
        </div>
      </Block>
    );
  }

  return (
    <Block title="Notification rules" desc="When and how the platform alerts admins.">
      {rules.length === 0 && !adding && (
        <p className="rounded-2xl border border-white/[0.05] bg-white/[0.02] px-4 py-6 text-xs text-slate-400">
          No rules yet. Add one to start routing platform events to email,
          Slack, PagerDuty, or a custom webhook.
        </p>
      )}

      <ul className="space-y-2">
        {rules.map((r) => {
          const ChannelIcon = CHANNEL_META[r.channel]?.icon || Mail;
          return (
            <li key={r.key} className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.02] px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-mono text-xs text-cyan-300">{r.key}</p>
                  <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ring-1 ${SEVERITY_BADGE[r.severity] || SEVERITY_BADGE.info}`}>
                    {r.severity}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-semibold text-slate-300">
                    <ChannelIcon className="h-3 w-3" />
                    {CHANNEL_META[r.channel]?.label || r.channel}
                  </span>
                </div>
                <p className="mt-0.5 text-sm font-semibold text-white">{r.label}</p>
                {r.description && (
                  <p className="mt-0.5 text-[11px] text-slate-400">{r.description}</p>
                )}
                {r.target && (
                  <p className="mt-0.5 truncate text-[11px] text-slate-500">
                    → <span className="font-mono">{r.target}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={r.channel}
                  onChange={(e) => patch(r.key, { channel: e.target.value })}
                  className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-[11px] text-slate-200 outline-none focus:border-cyan-400/40"
                  aria-label="Channel"
                >
                  {CHANNEL_OPTIONS.map((c) => <option key={c} value={c}>{CHANNEL_META[c].label}</option>)}
                </select>
                <select
                  value={r.severity}
                  onChange={(e) => patch(r.key, { severity: e.target.value })}
                  className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-[11px] text-slate-200 outline-none focus:border-cyan-400/40"
                  aria-label="Severity"
                >
                  {SEVERITY_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <BoundToggle
                  enabled={!!r.enabled}
                  onChange={(next) => patch(r.key, { enabled: next })}
                  ariaLabel={`Toggle ${r.key}`}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Delete rule "${r.key}"?`)) remove(r.key);
                  }}
                  className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-1.5 text-slate-400 transition-colors hover:bg-rose-500/10 hover:text-rose-300"
                  aria-label={`Delete ${r.key}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {adding ? (
        <div className="mt-3 space-y-2 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">New rule</p>
          {createError && (
            <p className="flex items-center gap-1.5 text-[11px] text-rose-300">
              <AlertCircle className="h-3 w-3" /> {createError}
            </p>
          )}
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-[11px] text-slate-400">
              Key (snake_case)
              <input
                type="text"
                value={draft.key}
                onChange={(e) => setDraft((d) => ({ ...d, key: e.target.value }))}
                placeholder="failed_payments"
                className="mt-1 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-1.5 font-mono text-xs text-cyan-200 outline-none focus:border-cyan-400/40"
              />
            </label>
            <label className="text-[11px] text-slate-400">
              Label
              <input
                type="text"
                value={draft.label}
                onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
                placeholder="Failed payments"
                className="mt-1 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-400/40"
              />
            </label>
            <label className="text-[11px] text-slate-400 sm:col-span-2">
              Description (optional)
              <input
                type="text"
                value={draft.description}
                onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                placeholder="Page on-call and send digest."
                className="mt-1 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-400/40"
              />
            </label>
            <label className="text-[11px] text-slate-400">
              Channel
              <select
                value={draft.channel}
                onChange={(e) => setDraft((d) => ({ ...d, channel: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-cyan-400/40"
              >
                {CHANNEL_OPTIONS.map((c) => <option key={c} value={c}>{CHANNEL_META[c].label}</option>)}
              </select>
            </label>
            <label className="text-[11px] text-slate-400">
              Severity
              <select
                value={draft.severity}
                onChange={(e) => setDraft((d) => ({ ...d, severity: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-cyan-400/40"
              >
                {SEVERITY_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label className="text-[11px] text-slate-400 sm:col-span-2">
              Target (email, URL, channel)
              <input
                type="text"
                value={draft.target}
                onChange={(e) => setDraft((d) => ({ ...d, target: e.target.value }))}
                placeholder={draft.channel === 'email' ? 'oncall@example.com' : draft.channel === 'webhook' ? 'https://hooks.example.com/...' : '#alerts'}
                className="mt-1 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-400/40"
              />
            </label>
          </div>
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => { setAdding(false); resetDraft(); }}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/[0.08]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onCreate}
              disabled={creating}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 px-3.5 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
            >
              {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Add rule
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/[0.08]"
        >
          <Plus className="h-3.5 w-3.5" /> Add rule
        </button>
      )}
    </Block>
  );
}

// ────────────────────────────────────────────────────────────────────────────
//  PlatformBlock — bound to /api/admin/settings (singleton)
//  Edits accumulate in a local `draft`; nothing is sent until the user
//  clicks Save. The optimistic patch in usePlatformSettings rolls back the
//  hook's `settings` on server rejection; we then resync the draft to it.
// ────────────────────────────────────────────────────────────────────────────

// Fields PlatformBlock owns. Used to build the delta on Save and to
// dirty-check the draft against the server snapshot. Listed explicitly so
// stray fields on `settings` (e.g. timestamps) never end up in the PATCH.
const PLATFORM_FIELDS = [
  'platformName',
  'supportEmail',
  'defaultRegion',
  'systemTimeZone',
  'sessionTimeoutDays',
  'allowNewSignups',
  'maintenanceBannerEnabled',
  'maintenanceBannerMessage',
];
const PASSWORD_POLICY_FIELDS = [
  'minLength',
  'requireUppercase',
  'requireDigit',
  'requireSymbol',
];

// Pull only the fields PlatformBlock manages off a server snapshot,
// normalising empty/null so the dirty-check doesn't false-positive
// (e.g. `null` vs `''` for an unset banner message).
function snapshotFor(settings) {
  if (!settings) return null;
  const snap = {};
  for (const k of PLATFORM_FIELDS) {
    snap[k] = settings[k] ?? (typeof settings[k] === 'boolean' ? false : '');
  }
  snap.passwordPolicy = {};
  for (const k of PASSWORD_POLICY_FIELDS) {
    const v = settings.passwordPolicy?.[k];
    snap.passwordPolicy[k] = v ?? (k === 'minLength' ? 12 : false);
  }
  return snap;
}

// Build a minimal PATCH body — only fields the user actually changed.
// Returns null when nothing is dirty.
function buildDelta(draft, server) {
  if (!draft || !server) return null;
  const delta = {};
  for (const k of PLATFORM_FIELDS) {
    if (String(draft[k] ?? '') !== String(server[k] ?? '')) delta[k] = draft[k];
  }
  const pp = {};
  for (const k of PASSWORD_POLICY_FIELDS) {
    if (draft.passwordPolicy?.[k] !== server.passwordPolicy?.[k]) {
      pp[k] = draft.passwordPolicy[k];
    }
  }
  if (Object.keys(pp).length > 0) delta.passwordPolicy = pp;
  return Object.keys(delta).length === 0 ? null : delta;
}

function PlatformBlock() {
  const { settings, status, error, saving, patch } = usePlatformSettings();
  const server = useMemo(() => snapshotFor(settings), [settings]);
  const [draft, setDraft] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [savedAt, setSavedAt]     = useState(null);

  // Re-seed the draft whenever the server snapshot changes (initial load,
  // successful save, external update). React's referential check on `server`
  // means we only re-seed when the snapshot is materially different.
  useEffect(() => { if (server) setDraft(server); }, [server]);

  // Auto-clear the "Saved" indicator after 2s.
  useEffect(() => {
    if (!savedAt) return undefined;
    const t = setTimeout(() => setSavedAt(null), 2000);
    return () => clearTimeout(t);
  }, [savedAt]);

  const delta = useMemo(() => buildDelta(draft, server), [draft, server]);
  const isDirty = !!delta;

  // Field setters — keep the JSX below dense.
  const setField = (key, value) => setDraft((d) => (d ? { ...d, [key]: value } : d));
  const setPolicy = (key, value) => setDraft((d) =>
    d ? { ...d, passwordPolicy: { ...d.passwordPolicy, [key]: value } } : d
  );

  const onSave = async () => {
    if (!delta) return;
    setSaveError(null);
    const res = await patch(delta);
    if (!res.ok) { setSaveError(res.message); return; }
    setSavedAt(Date.now());
  };
  const onDiscard = () => { setDraft(server); setSaveError(null); };

  if (status === 'loading' || status === 'idle') {
    return (
      <Block title="Platform settings" desc="Global defaults applied to every workspace.">
        <div className="flex items-center gap-2 rounded-2xl border border-white/[0.05] bg-white/[0.02] px-4 py-6 text-xs text-slate-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading settings…
        </div>
      </Block>
    );
  }
  if (status === 'error' || !settings || !draft) {
    return (
      <Block title="Platform settings" desc="Global defaults applied to every workspace.">
        <div className="flex items-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/[0.06] px-4 py-3 text-xs text-rose-200">
          <AlertCircle className="h-3.5 w-3.5" /> {error || 'Failed to load settings.'}
        </div>
      </Block>
    );
  }

  return (
    <Block title="Platform settings" desc="Global defaults applied to every workspace.">
      <ControlledField
        label="Platform name"
        value={draft.platformName}
        maxLength={80}
        onChange={(v) => setField('platformName', v)}
      />
      <ControlledField
        label="Support email"
        type="email"
        value={draft.supportEmail}
        maxLength={120}
        onChange={(v) => setField('supportEmail', v)}
      />
      <ControlledField
        label="Default region"
        value={draft.defaultRegion}
        maxLength={80}
        onChange={(v) => setField('defaultRegion', v)}
      />
      <ControlledField
        label="System time zone"
        value={draft.systemTimeZone}
        maxLength={80}
        onChange={(v) => setField('systemTimeZone', v)}
      />
      <ControlledField
        label="Session timeout (days)"
        type="number"
        value={String(draft.sessionTimeoutDays ?? '')}
        min={1}
        max={365}
        onChange={(v) => {
          const n = Number(v);
          setField('sessionTimeoutDays', Number.isFinite(n) ? n : v);
        }}
      />

      <ToggleRow
        label="Allow new sign-ups"
        desc="Permit any business to self-register."
        enabled={!!draft.allowNewSignups}
        onChange={(v) => setField('allowNewSignups', v)}
      />
      <ToggleRow
        label="Maintenance banner"
        desc="Show a global notice across all dashboards."
        enabled={!!draft.maintenanceBannerEnabled}
        onChange={(v) => setField('maintenanceBannerEnabled', v)}
      />

      {draft.maintenanceBannerEnabled && (
        <ControlledField
          label="Maintenance banner message"
          value={draft.maintenanceBannerMessage || ''}
          maxLength={280}
          placeholder="e.g. Scheduled maintenance 02:00–02:30 UTC"
          onChange={(v) => setField('maintenanceBannerMessage', v)}
        />
      )}

      <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Password policy</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-xs text-slate-300">
            <span className="w-28 shrink-0 text-slate-500">Min length</span>
            <input
              type="number"
              min={6}
              max={128}
              value={draft.passwordPolicy?.minLength ?? 12}
              onChange={(e) => {
                const n = Number(e.target.value);
                setPolicy('minLength', Number.isFinite(n) ? n : 12);
              }}
              className="w-20 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-xs text-white outline-none focus:border-cyan-400/40"
            />
          </label>
          <CheckboxRow
            label="Require uppercase"
            checked={!!draft.passwordPolicy?.requireUppercase}
            onChange={(v) => setPolicy('requireUppercase', v)}
          />
          <CheckboxRow
            label="Require digit"
            checked={!!draft.passwordPolicy?.requireDigit}
            onChange={(v) => setPolicy('requireDigit', v)}
          />
          <CheckboxRow
            label="Require symbol"
            checked={!!draft.passwordPolicy?.requireSymbol}
            onChange={(v) => setPolicy('requireSymbol', v)}
          />
        </div>
      </div>

      {/* Sticky save bar. Stays visible at the bottom of the section so the
          user always knows whether they have unsaved changes. */}
      <div className="sticky bottom-0 -mx-1 mt-4 flex items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-slate-950/80 px-4 py-3 backdrop-blur">
        <div className="min-w-0 text-[11px]">
          {saving ? (
            <span className="inline-flex items-center gap-1.5 text-slate-300">
              <Loader2 className="h-3 w-3 animate-spin" /> Saving changes…
            </span>
          ) : saveError ? (
            <span className="inline-flex items-center gap-1.5 text-rose-300">
              <AlertCircle className="h-3 w-3" /> {saveError}
            </span>
          ) : savedAt ? (
            <span className="inline-flex items-center gap-1.5 text-emerald-300">
              <Check className="h-3 w-3" /> Saved
            </span>
          ) : isDirty ? (
            <span className="inline-flex items-center gap-1.5 text-amber-300">
              <AlertCircle className="h-3 w-3" /> You have unsaved changes
            </span>
          ) : (
            <span className="text-slate-500">All changes saved</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDiscard}
            disabled={!isDirty || saving}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors enabled:hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Undo2 className="h-3.5 w-3.5" /> Discard
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={!isDirty || saving}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-opacity enabled:hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Save className="h-3.5 w-3.5" />}
            Save changes
          </button>
        </div>
      </div>
    </Block>
  );
}

// ────────────────────────────────────────────────────────────────────────────
//  Controlled input primitives — pure presentation, no save logic.
//  PlatformBlock owns the draft/save lifecycle; these just render values
//  and bubble onChange. (Naming intentionally distinct from the legacy
//  `Field` / `Toggle` further up that are still used by the comingSoon
//  scaffolding blocks.)
// ────────────────────────────────────────────────────────────────────────────

function ControlledField({ label, value, onChange, type = 'text', placeholder, maxLength, min, max }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/[0.05] bg-white/[0.02] px-4 py-3">
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">{label}</p>
        <input
          type={type}
          value={value ?? ''}
          placeholder={placeholder}
          maxLength={maxLength}
          min={min}
          max={max}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 w-full bg-transparent text-sm font-medium text-white outline-none placeholder:text-slate-600"
        />
      </div>
    </div>
  );
}

function ToggleRow({ label, desc, enabled, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-white/[0.05] bg-white/[0.02] px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white">{label}</p>
        <p className="mt-0.5 text-[11px] text-slate-400">{desc}</p>
      </div>
      <BoundToggle enabled={enabled} onChange={onChange} ariaLabel={label} />
    </div>
  );
}

function BoundToggle({ enabled, onChange, ariaLabel }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
        enabled ? 'bg-gradient-to-r from-violet-400 to-cyan-400' : 'bg-white/10'
      }`}
      aria-pressed={enabled}
      aria-label={ariaLabel}
    >
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-5' : 'translate-x-1'}`} />
    </button>
  );
}

function CheckboxRow({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 text-xs text-slate-300">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-3.5 w-3.5 cursor-pointer accent-cyan-400"
      />
      {label}
    </label>
  );
}

function PermissionRow({ role, perms }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.02] px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white">{role}</p>
        <p className="mt-0.5 text-[11px] text-slate-400">{perms}</p>
      </div>
      <button className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/[0.08]">
        Edit
      </button>
    </div>
  );
}
