import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { ShieldAlert, LogOut } from 'lucide-react';
import { ROLES, useAuth } from '@/app/providers/AuthProvider.jsx';
import BusinessOwnerDashboard from '@/features/dashboard/components/BusinessOwnerDashboard.jsx';

/**
 * Renders the role-specific dashboard. Auth guard is handled by
 * <PrivateRoute> in App.jsx — unauthenticated visitors never reach here.
 *
 * Staff operators have a dedicated /staff/* workspace and are redirected
 * to its dashboard entry point.
 */
export default function DashboardPage() {
  const { role } = useAuth();

  switch (role) {
    case ROLES.BUSINESS_OWNER:
      return <BusinessOwnerDashboard />;
    case ROLES.STAFF:
      return <Navigate to="/staff/dashboard" replace />;
    case ROLES.ADMIN:
      return <Navigate to="/admin/overview" replace />;
    default:
      return <UnsupportedRoleScreen role={role} />;
  }
}

/**
 * Renders when the JWT carries a role string the SPA doesn't know how to
 * render. Almost always indicates a backend/frontend version skew or a
 * data-integrity issue — we surface it instead of silently rendering blank,
 * and offer the only safe action (sign out → re-login with a fresh token).
 */
function UnsupportedRoleScreen({ role }) {
  const { signOut } = useAuth();

  useEffect(() => {
    // Log once on mount so ops can correlate with the user's session.
    // eslint-disable-next-line no-console
    console.error('[dashboard] Unsupported role on session:', role);
  }, [role]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6 py-12">
      <div className="w-full max-w-md rounded-3xl border border-white/[0.06] bg-slate-950/40 p-8 text-center shadow-xl">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-300">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h1 className="text-lg font-semibold text-slate-100">
          Your account role isn&apos;t recognized
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          We received an account type
          {role ? <> (<span className="font-mono text-slate-300">{String(role)}</span>)</> : null}
          {' '}that this version of FlowOps can&apos;t render. This usually means your
          workspace was updated to a newer release. Sign out and back in to refresh
          your session.
        </p>
        <button
          type="button"
          onClick={() => { void signOut(); }}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-500/90 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-emerald-400"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}
