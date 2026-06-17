// ============================================================================
//  Admin · Support Center — placeholder until a real ticketing API exists
// ----------------------------------------------------------------------------
//  We don't yet have a backend support-ticket API, so rather than fabricate
//  fake customer conversations we surface that honestly. Once a ticketing
//  service ships, swap the EmptyState for a `useSupportTickets()` hook and
//  bind the StatCards / table to its result.
// ============================================================================

import { LifeBuoy, Clock, CheckCircle2, Mail, MessageSquare } from 'lucide-react';
import AdminLayout from '@/features/admin/components/AdminShell.jsx';
import PageHeader, { StatCard } from '@/shared/components/PageHeader.jsx';
import EmptyState from '@/shared/components/EmptyState.jsx';

export default function SupportCenter() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Customer success"
          title="Support Center"
          subtitle="Tickets, escalations, and customer conversations across the platform."
          crumbs={[{ label: 'Admin' }, { label: 'Support Center' }]}
          actions={(
            <a
              href="mailto:support@flowops.app"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/[0.08]"
            >
              <Mail className="h-3.5 w-3.5" /> support@flowops.app
            </a>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Open tickets"    value="—" delta="Ticketing API pending" tone="slate" icon={LifeBuoy} />
          <StatCard label="Avg first reply" value="—" delta="Tracked once live"     tone="slate" icon={Clock} />
          <StatCard label="Resolved (7d)"   value="—" delta="Tracked once live"     tone="slate" icon={CheckCircle2} />
          <StatCard label="CSAT"            value="—" delta="Tracked once live"     tone="slate" />
        </div>

        <section className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
          <EmptyState
            icon={MessageSquare}
            tone="info"
            size="md"
            title="Support ticketing isn't wired up yet"
            message="When the support backend ships, this panel will list every conversation across the platform with priority, owner, status, and last activity. For now, escalations come in via email."
            cta={{
              label: 'Email support inbox',
              variant: 'primary',
              onClick: () => { window.location.href = 'mailto:support@flowops.app'; },
            }}
          />
        </section>
      </div>
    </AdminLayout>
  );
}
