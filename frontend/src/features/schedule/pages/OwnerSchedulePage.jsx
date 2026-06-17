import { CalendarDays, UserPlus } from 'lucide-react';
import HybridDashboardShell from '@/features/dashboard/components/HybridDashboardShell.jsx';
import PageHeader from '@/shared/components/PageHeader.jsx';
import EmptyState from '@/shared/components/EmptyState.jsx';
import { ROUTES } from '@/shared/constants/routes.js';

/**
 * SchedulePage — "What is coming next?"
 *
 * Real shift planning depends on per-staff sessions and a calendar persistence
 * layer that aren't wired yet. Until then this page renders an honest
 * coming-soon empty state instead of fabricated schedules, and points owners
 * at the invite flow so they can start building a team.
 */
export default function SchedulePage() {
  return (
    <HybridDashboardShell>
      <div className="space-y-6 pt-2">
        <PageHeader
          eyebrow="Operational planning"
          title="Schedule"
          subtitle="Plan staff rotations, peak-hour coverage, and upcoming appointments."
          crumbs={[{ label: 'Planning' }, { label: 'Schedule' }]}
        />

        <section className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-10">
          <EmptyState
            icon={CalendarDays}
            tone="info"
            size="lg"
            title="Scheduling is coming soon"
            message="Weekly staff rotations, peak-hour coverage planning, and upcoming appointment timelines will populate once team management and the calendar backend land. Invite staff today so your roster is ready when it ships."
            cta={{
              label: 'Invite team members',
              variant: 'primary',
              onClick: () => { window.location.href = ROUTES.owner.settings; },
            }}
          />
        </section>

        <section className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
          <div className="flex items-start gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/[0.06] text-cyan-300">
              <UserPlus className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-white">What you&apos;ll be able to do</h3>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-xs text-slate-400">
                <li>Build weekly shift grids per staff member.</li>
                <li>Mark peak-hour reinforcement windows.</li>
                <li>Track open shift requests and approvals.</li>
                <li>See today&apos;s upcoming appointments alongside live queue load.</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </HybridDashboardShell>
  );
}
