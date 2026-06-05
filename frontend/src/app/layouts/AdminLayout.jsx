// ============================================================================
//  AdminLayout — Platform Admin portal shell
// ----------------------------------------------------------------------------
//  Wraps every /admin/* page with the platform admin chrome (sidebar with
//  collapsible sections, global search, region selector, notifications).
// ============================================================================

import AdminShell from '@/features/admin/components/AdminShell.jsx';

export default function AdminLayout({ children }) {
  return <AdminShell>{children}</AdminShell>;
}
