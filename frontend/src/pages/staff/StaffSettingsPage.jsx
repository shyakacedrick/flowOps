import { useState } from 'react';
import { User, Palette, Bell, Accessibility, Languages, Shield, ChevronRight } from 'lucide-react';
import StaffShell from '../../dashboards/StaffShell.jsx';
import PageHeader from '../../components/shared/PageHeader.jsx';
import { useAuth } from '../../auth/AuthContext.jsx';

/**
 * StaffSettingsPage — personal preferences for the operator.
 */
const SECTIONS = [
  { key: 'profile',       label: 'Profile',       icon: User },
  { key: 'appearance',    label: 'Appearance',    icon: Palette },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'accessibility', label: 'Accessibility', icon: Accessibility },
  { key: 'language',      label: 'Language',      icon: Languages },
  { key: 'security',      label: 'Security',      icon: Shield },
];

export default function StaffSettingsPage() {
  const { session } = useAuth();
  const [active, setActive] = useState('profile');

  return (
    <StaffShell>
      <div className="space-y-6 pt-2">
        <PageHeader
          eyebrow="Preferences"
          title="Settings"
          subtitle="Personal preferences for your operator workspace."
          crumbs={[{ label: 'Staff', to: '/staff/dashboard' }, { label: 'Settings' }]}
        />

        <div className="grid gap-5 lg:grid-cols-12">
          {/* Section nav */}
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
                        isActive
                          ? 'bg-white/[0.06] text-white'
                          : 'text-slate-400 hover:bg-white/[0.03] hover:text-slate-200'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="flex-1 text-left">{s.label}</span>
                      <ChevronRight className={`h-3 w-3 transition-opacity ${isActive ? 'opacity-100 text-cyan-300' : 'opacity-40'}`} />
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          {/* Panel */}
          <section className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6 lg:col-span-9">
            {active === 'profile' && (
              <Block title="Profile" desc="How you appear to teammates and customers.">
                <Field label="Display name"   value={session?.displayName || 'Jordan Lee'} />
                <Field label="Role"           value="Staff operator" />
                <Field label="Assigned desk"  value="Desk 2" />
                <Field label="Employee ID"    value="FO-2148" />
                <Field label="Email"          value="jordan@flowops.app" />
              </Block>
            )}
            {active === 'appearance' && (
              <Block title="Appearance" desc="Theme and layout preferences.">
                <Toggle label="Dark mode"            desc="Reduces eye strain during long shifts." enabled />
                <Toggle label="Compact density"     desc="More information per screen." />
                <Toggle label="Animations"          desc="Subtle transitions across the UI." enabled />
              </Block>
            )}
            {active === 'notifications' && (
              <Block title="Notifications" desc="Choose how the system alerts you.">
                <Toggle label="Long-wait alerts"     desc="Notify me when a customer waits over 15m." enabled />
                <Toggle label="Manager messages"     desc="Pings from your floor manager." enabled />
                <Toggle label="Smart insight tips"   desc="AI suggestions tailored to your shift." enabled />
                <Toggle label="Sound on new ticket"  desc="Audible ping when a customer joins." />
              </Block>
            )}
            {active === 'accessibility' && (
              <Block title="Accessibility" desc="Make FlowOps work better for you.">
                <Toggle label="High contrast"        desc="Stronger borders and brighter text." />
                <Toggle label="Reduce motion"        desc="Disable non-essential animations." />
                <Toggle label="Large action buttons" desc="Bigger tap targets for fast service." enabled />
              </Block>
            )}
            {active === 'language' && (
              <Block title="Language" desc="Interface language and date formatting.">
                <Select label="Interface language" options={['English (US)', 'English (UK)', 'Español', 'Français']} />
                <Select label="Date format"        options={['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']} />
                <Select label="Time format"        options={['12-hour', '24-hour']} />
              </Block>
            )}
            {active === 'security' && (
              <Block title="Security" desc="Account safety and active sessions.">
                <Field label="Password"     value="••••••••" action="Change" />
                <Field label="Two-factor"   value="Enabled"   action="Manage" />
                <Field label="Active sessions" value="2 devices" action="Review" />
                <Field label="Last sign-in" value="Today · 08:54" />
              </Block>
            )}
          </section>
        </div>
      </div>
    </StaffShell>
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
          on ? 'bg-gradient-to-r from-cyan-400 to-blue-500' : 'bg-white/10'
        }`}
        aria-pressed={on}
      >
        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${on ? 'translate-x-5' : 'translate-x-1'}`} />
      </button>
    </div>
  );
}

function Select({ label, options }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/[0.05] bg-white/[0.02] px-4 py-3">
      <p className="text-sm font-semibold text-white">{label}</p>
      <select
        className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-400/40"
        defaultValue={options[0]}
      >
        {options.map((o) => <option key={o} className="bg-[#0B1120]">{o}</option>)}
      </select>
    </div>
  );
}
