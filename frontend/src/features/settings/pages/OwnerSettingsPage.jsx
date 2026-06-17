import { useEffect, useState } from 'react';
import { Building2, Users, Save, Loader2, CheckCircle2, AlertCircle, User as UserIcon } from 'lucide-react';
import HybridDashboardShell from '@/features/dashboard/components/HybridDashboardShell.jsx';
import PageHeader from '@/shared/components/PageHeader.jsx';
import { useAuth } from '@/app/providers/AuthProvider.jsx';
import { useToast } from '@/shared/components/ToastProvider.jsx';
import organizationApi from '@/services/organizationApi.js';
import InvitesPanel from '@/features/settings/components/InvitesPanel.jsx';
import ProfileSection from '@/features/settings/components/ProfileSection.jsx';

/**
 * SettingsPage — "How do I configure FlowOps?"
 *
 * Only sections that actually persist to the backend are listed here.
 * Notifications, Queue rules, Account, and Branches are intentionally
 * hidden until their respective backends land (Phase 11+). Better to ship
 * a handful of working sections than many where most silently drop edits.
 */
const SECTIONS = [
  { key: 'profile',      label: 'My profile',    icon: UserIcon },
  { key: 'business',     label: 'Business',      icon: Building2 },
  { key: 'roles',        label: 'Team & invites',icon: Users },
];

export default function SettingsPage() {
  const [section, setSection] = useState('profile');

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
            {section === 'profile'  && <ProfileSection />}
            {section === 'business' && <BusinessSection />}
            {section === 'roles'    && <RolesSection />}
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

function BusinessSection() {
  const { session } = useAuth();
  const orgId = session?.organizationId;
  const toast = useToast();

  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [form, setForm] = useState({ name: '', industry: 'other', description: '' });
  const [saving, setSaving] = useState(false);

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
    const res = await organizationApi.update(orgId, {
      name: form.name.trim(),
      industry: form.industry,
      description: form.description.trim(),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error(res.message || 'Failed to save changes.');
      return;
    }
    setOrg(res.data);
    toast.success('Business profile saved');
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

function RolesSection() {
  return (
    <div className="space-y-5">
      <InvitesPanel />
      <Card title="Active team members" subtitle="Members appear here once they accept an invite">
        <p className="text-xs text-slate-400">
          Real-time member listing lands with the team management release. Use{' '}
          <span className="text-cyan-300">Invites</span> above to bring teammates into your workspace today.
        </p>
      </Card>
    </div>
  );
}
