import { useState } from 'react';
import {
  Settings as SettingsIcon, Lock, Bell, Shield, Flag, KeyRound, ChevronRight, Plus,
  User as UserIcon,
} from 'lucide-react';
import AdminLayout from '@/features/admin/components/AdminShell.jsx';
import PageHeader from '@/shared/components/PageHeader.jsx';
import ProfileSection from '@/features/settings/components/ProfileSection.jsx';

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
            {active === 'platform' && (
              <Block title="Platform settings" desc="Global defaults applied to every workspace.">
                <Field label="Platform name"        value="FlowOps" />
                <Field label="Default region"       value="US-East · Virginia" action="Change" />
                <Field label="Support email"        value="support@flowops.app" action="Edit" />
                <Field label="System time zone"     value="UTC" />
                <Toggle label="Allow new sign-ups"  desc="Permit any business to self-register." enabled />
                <Toggle label="Maintenance banner"  desc="Show a global notice across all dashboards." />
              </Block>
            )}
            {active === 'auth' && (
              <Block title="Authentication" desc="Sign-in methods and identity provider configuration.">
                <Toggle label="Email + password"     desc="Built-in password authentication." enabled />
                <Toggle label="Magic links"          desc="Passwordless email sign-in." enabled />
                <Toggle label="Google SSO"           desc="OAuth via Google Workspace." enabled />
                <Toggle label="Microsoft / Azure AD" desc="OAuth + SAML." enabled />
                <Toggle label="Okta SAML"            desc="Enterprise tier only." />
                <Field label="Session timeout"       value="14 days" action="Change" />
              </Block>
            )}
            {active === 'notifications' && (
              <Block title="Notification rules" desc="When and how the platform alerts admins.">
                <Toggle label="New organization joins"  desc="Slack #growth + email digest." enabled />
                <Toggle label="Failed payments"         desc="Page on-call + email." enabled />
                <Toggle label="High-severity audit events" desc="PagerDuty incident." enabled />
                <Toggle label="System degradation"      desc="Auto-create status page incident." enabled />
                <Toggle label="Weekly platform digest"  desc="Email every Monday 09:00 UTC." enabled />
              </Block>
            )}
            {active === 'security' && (
              <Block title="Security policies" desc="Platform-wide security guardrails.">
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
              <Block title="Role permissions" desc="What each role can do across the platform.">
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

function Block({ title, desc, children }) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="text-xs text-slate-400">{desc}</p>
      <div className="mt-5 space-y-2">{children}</div>
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
  const FLAGS = [
    { name: 'smart_insights_v2',   on: true,  desc: 'Next-gen AI insights engine',                      stage: 'GA' },
    { name: 'sms_routing',         on: true,  desc: 'SMS notifications via Twilio',                      stage: 'GA' },
    { name: 'ai_chat_assistant',   on: false, desc: 'In-product chat assistant for end customers',      stage: 'Beta' },
    { name: 'multi_region_failover', on: false, desc: 'Auto-failover to standby region',                stage: 'Internal' },
    { name: 'webhook_v2',          on: true,  desc: 'Signed webhook payloads with HMAC-SHA256',         stage: 'GA' },
  ];
  return (
    <Block title="Feature flags" desc="Roll features out safely to a subset of orgs.">
      <ul className="space-y-2">
        {FLAGS.map((f) => {
          const [on, setOn] = [f.on, () => {}];
          return (
            <li key={f.name} className="flex items-center gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.02] px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-mono text-xs text-cyan-300">{f.name}</p>
                  <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-300">
                    {f.stage}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-slate-400">{f.desc}</p>
              </div>
              <Toggle label="" desc="" enabled={f.on} />
            </li>
          );
        })}
      </ul>
    </Block>
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
