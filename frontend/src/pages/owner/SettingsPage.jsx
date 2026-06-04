import { useState } from 'react';
import { Building2, Bell, ShieldCheck, Users, MapPin, ListChecks, Save } from 'lucide-react';
import HybridDashboardShell from '../../dashboards/HybridDashboardShell.jsx';
import PageHeader from '../../components/shared/PageHeader.jsx';

/**
 * SettingsPage — "How do I configure FlowOps?"
 *
 * Sectioned settings: business, queue rules, notifications, roles, account, branches.
 */
const SECTIONS = [
  { key: 'business',     label: 'Business',      icon: Building2 },
  { key: 'queue',        label: 'Queue rules',   icon: ListChecks },
  { key: 'notifications',label: 'Notifications', icon: Bell },
  { key: 'roles',        label: 'User roles',    icon: Users },
  { key: 'account',      label: 'Account',       icon: ShieldCheck },
  { key: 'branches',     label: 'Branches',      icon: MapPin },
];

export default function SettingsPage() {
  const [section, setSection] = useState('business');

  return (
    <HybridDashboardShell>
      <div className="space-y-6 pt-2">
        <PageHeader
          eyebrow="Platform configuration"
          title="Settings"
          subtitle="Configure your business, queue policies, notifications, and team access."
          crumbs={[{ label: 'Workspace' }, { label: 'Settings' }]}
          actions={
            <button className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-3.5 py-2 text-xs font-semibold text-slate-900 shadow-[0_0_22px_-6px_rgba(34,211,238,0.7)]">
              <Save className="h-3.5 w-3.5" /> Save changes
            </button>
          }
        />

        <div className="grid gap-5 lg:grid-cols-12">
          <aside className="lg:col-span-3">
            <nav className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-2">
              {SECTIONS.map((s) => {
                const Icon = s.icon;
                const active = s.key === section;
                return (
                  <button
                    key={s.key}
                    onClick={() => setSection(s.key)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? 'bg-white/[0.06] text-white'
                        : 'text-slate-400 hover:bg-white/[0.03] hover:text-slate-200'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {s.label}
                  </button>
                );
              })}
            </nav>
          </aside>

          <main className="space-y-5 lg:col-span-9">
            {section === 'business' && <BusinessSection />}
            {section === 'queue'    && <QueueRulesSection />}
            {section === 'notifications' && <NotificationsSection />}
            {section === 'roles'    && <RolesSection />}
            {section === 'account'  && <AccountSection />}
            {section === 'branches' && <BranchesSection />}
          </main>
        </div>
      </div>
    </HybridDashboardShell>
  );
}

function Card({ title, subtitle, children }) {
  return (
    <section className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
      <div>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
      </div>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">{label}</label>
      <div className="mt-1.5">{children}</div>
      {hint && <p className="mt-1 text-[11px] text-slate-500">{hint}</p>}
    </div>
  );
}

const inputCls = 'w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-400/40 focus:outline-none';

function Toggle({ label, hint, defaultOn = false }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-white/[0.05] bg-white/[0.02] px-3 py-3">
      <div>
        <p className="text-sm font-semibold text-white">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-slate-400">{hint}</p>}
      </div>
      <button
        onClick={() => setOn((v) => !v)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? 'bg-gradient-to-r from-cyan-400 to-blue-500' : 'bg-white/10'}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}

function BusinessSection() {
  return (
    <Card title="Business profile" subtitle="Public-facing information for your FlowOps account">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Business name"><input className={inputCls} defaultValue="Clarity Clinics" /></Field>
        <Field label="Industry">
          <select className={inputCls} defaultValue="clinic">
            <option value="clinic">Clinic / healthcare</option>
            <option value="bank">Bank</option>
            <option value="restaurant">Restaurant</option>
            <option value="salon">Salon</option>
            <option value="gov">Government office</option>
          </select>
        </Field>
        <Field label="Contact email"><input className={inputCls} defaultValue="ops@clarityclinics.io" /></Field>
        <Field label="Phone"><input className={inputCls} defaultValue="+1 (415) 555-0123" /></Field>
        <Field label="Business hours" hint="Used to compute coverage gaps">
          <input className={inputCls} defaultValue="Mon–Sat · 08:00 – 19:00" />
        </Field>
        <Field label="Timezone">
          <select className={inputCls} defaultValue="pst"><option value="pst">Pacific (PST)</option><option value="est">Eastern (EST)</option><option value="utc">UTC</option></select>
        </Field>
      </div>
    </Card>
  );
}

function QueueRulesSection() {
  return (
    <Card title="Queue rules" subtitle="How tickets, priorities, and SLAs behave">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Max tickets per queue"><input type="number" className={inputCls} defaultValue={50} /></Field>
        <Field label="Target wait time (min)"><input type="number" className={inputCls} defaultValue={15} /></Field>
        <Field label="Auto-mark no-show after (min)"><input type="number" className={inputCls} defaultValue={10} /></Field>
        <Field label="Priority lane"><select className={inputCls}><option>Disabled</option><option>VIP only</option><option>Auto-detect</option></select></Field>
      </div>
      <Toggle label="Allow walk-in tickets" hint="Customers can take a ticket on-site" defaultOn />
      <Toggle label="Enable QR self check-in" hint="Customers scan a code from their phone" defaultOn />
      <Toggle label="Pre-book appointments" hint="Customers can reserve a time slot" />
    </Card>
  );
}

function NotificationsSection() {
  return (
    <Card title="Notifications" subtitle="Channel & trigger settings">
      <Toggle label="SMS · Your turn is next"          hint="Sent when customer is ≤ 2 positions away" defaultOn />
      <Toggle label="SMS · Approximate wait update"    hint="Triggered when wait crosses 10m" defaultOn />
      <Toggle label="Email · Daily owner summary"      hint="Sent 19:30 with KPIs and insights" defaultOn />
      <Toggle label="Push · Staff break reminders"     hint="Mobile notifications to staff app" />
      <Toggle label="Slack · Critical SLA breaches"    hint="Posts to #flowops-alerts" />
    </Card>
  );
}

function RolesSection() {
  const rows = [
    { name: 'Mira Patel',   role: 'Owner',     email: 'mira@clarityclinics.io',  tone: 'cyan' },
    { name: 'Jordan Lee',   role: 'Staff',     email: 'jordan@clarityclinics.io',tone: 'violet' },
    { name: 'Priya Shah',   role: 'Staff',     email: 'priya@clarityclinics.io', tone: 'violet' },
    { name: 'Sam Cole',     role: 'Manager',   email: 'sam@clarityclinics.io',   tone: 'emerald' },
  ];
  const TONES = { cyan: 'bg-cyan-500/10 text-cyan-300 ring-cyan-400/20', violet: 'bg-violet-500/10 text-violet-300 ring-violet-400/20', emerald: 'bg-emerald-500/10 text-emerald-300 ring-emerald-400/20' };
  return (
    <Card title="User roles" subtitle="Who has access and what they can do">
      <ul className="divide-y divide-white/[0.05]">
        {rows.map((r) => (
          <li key={r.email} className="flex items-center gap-4 py-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/[0.06] text-xs font-bold text-slate-200">
              {r.name.split(' ').map((p) => p[0]).slice(0,2).join('')}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{r.name}</p>
              <p className="truncate text-[11px] text-slate-400">{r.email}</p>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ${TONES[r.tone]}`}>{r.role}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function AccountSection() {
  return (
    <Card title="Account preferences" subtitle="Security & personal settings">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Display name"><input className={inputCls} defaultValue="Mira Patel" /></Field>
        <Field label="Email"><input className={inputCls} defaultValue="mira@clarityclinics.io" /></Field>
        <Field label="Language"><select className={inputCls}><option>English (US)</option><option>Español</option><option>Français</option></select></Field>
        <Field label="Theme"><select className={inputCls}><option>Dark (recommended)</option><option>Light</option><option>System</option></select></Field>
      </div>
      <Toggle label="Two-factor authentication" hint="Use an authenticator app" defaultOn />
      <Toggle label="Allow session sharing across devices" />
    </Card>
  );
}

function BranchesSection() {
  const branches = [
    { name: 'Clarity Clinics · Downtown',  staff: 8, status: 'Live' },
    { name: 'Clarity Clinics · Marina',    staff: 5, status: 'Live' },
    { name: 'Clarity Clinics · East Bay',  staff: 4, status: 'Setup' },
  ];
  return (
    <Card title="Branches" subtitle="Manage every location running FlowOps">
      <ul className="divide-y divide-white/[0.05]">
        {branches.map((b) => (
          <li key={b.name} className="flex items-center gap-4 py-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/[0.06] text-cyan-300">
              <MapPin className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{b.name}</p>
              <p className="truncate text-[11px] text-slate-400">{b.staff} staff members</p>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ${b.status === 'Live' ? 'bg-emerald-500/10 text-emerald-300 ring-emerald-400/20' : 'bg-amber-500/10 text-amber-300 ring-amber-400/20'}`}>
              {b.status}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
