import { useEffect, useState } from 'react';
import { Building2, Bell, ShieldCheck, Users, MapPin, ListChecks, Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import HybridDashboardShell from '@/features/dashboard/components/HybridDashboardShell.jsx';
import PageHeader from '@/shared/components/PageHeader.jsx';
import { useAuth } from '@/app/providers/AuthProvider.jsx';
import organizationApi from '@/services/organizationApi.js';

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
  const { session } = useAuth();
  const orgId = session?.organizationId;

  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [form, setForm] = useState({ name: '', industry: 'other', description: '' });
  const [saving, setSaving] = useState(false);
  const [saveOk, setSaveOk] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Load org on mount.
  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!orgId) {
        setLoading(false);
        setLoadError('No organization linked to this account.');
        return;
      }
      setLoading(true);
      setLoadError('');
      const res = await organizationApi.get(orgId);
      if (cancelled) return;
      if (!res.ok) {
        setLoadError(res.message || 'Failed to load organization.');
        setLoading(false);
        return;
      }
      setOrg(res.data);
      setForm({
        name: res.data.name || '',
        industry: res.data.industry || 'other',
        description: res.data.description || '',
      });
      setLoading(false);
    }
    run();
    return () => { cancelled = true; };
  }, [orgId]);

  const update = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setSaveOk(false);
    setSaveError('');
  };

  const isDirty =
    org &&
    (form.name !== (org.name || '') ||
      form.industry !== (org.industry || 'other') ||
      form.description !== (org.description || ''));

  const onSave = async (e) => {
    e.preventDefault();
    if (!orgId || !isDirty || saving) return;
    setSaving(true);
    setSaveError('');
    setSaveOk(false);
    const res = await organizationApi.update(orgId, {
      name: form.name.trim(),
      industry: form.industry,
      description: form.description.trim(),
    });
    setSaving(false);
    if (!res.ok) {
      setSaveError(res.message || 'Failed to save changes.');
      return;
    }
    setOrg(res.data);
    setSaveOk(true);
  };

  if (loading) {
    return (
      <Card title="Business profile" subtitle="Loading from /api/organizations…">
        <div className="flex items-center gap-2 py-6 text-xs text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Fetching organization…
        </div>
      </Card>
    );
  }

  if (loadError) {
    return (
      <Card title="Business profile" subtitle="Public-facing information for your FlowOps account">
        <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {loadError}
        </div>
      </Card>
    );
  }

  return (
    <Card title="Business profile" subtitle="Public-facing information for your FlowOps account">
      <form onSubmit={onSave} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Business name">
            <input
              className={inputCls}
              value={form.name}
              onChange={update('name')}
              required
              minLength={2}
              maxLength={120}
            />
          </Field>
          <Field label="Industry">
            <select className={inputCls} value={form.industry} onChange={update('industry')}>
              <option value="clinic">Clinic / healthcare</option>
              <option value="hospital">Hospital</option>
              <option value="bank">Bank</option>
              <option value="salon">Salon</option>
              <option value="restaurant">Restaurant</option>
              <option value="retail">Retail</option>
              <option value="government">Government</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <Field label="Plan" hint="Read-only — upgrades happen via billing">
            <input className={inputCls} value={org.plan || 'starter'} disabled />
          </Field>
          <Field label="Organization ID" hint="Use this when inviting staff via the API">
            <input className={inputCls} value={org._id} readOnly />
          </Field>
        </div>

        <Field label="Description" hint="Shown on customer-facing pages">
          <textarea
            className={`${inputCls} min-h-[80px]`}
            value={form.description}
            onChange={update('description')}
            maxLength={1000}
          />
        </Field>

        {saveError && (
          <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {saveError}
          </div>
        )}
        {saveOk && (
          <div className="flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Saved.
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!isDirty || saving}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-3.5 py-2 text-xs font-semibold text-slate-900 shadow-[0_0_22px_-6px_rgba(34,211,238,0.7)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
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
