// ============================================================================
//  OwnerLayout — Business Owner workspace shell
// ----------------------------------------------------------------------------
//  Wraps every /owner/* page (dashboard, live-queue, operations, …) with the
//  hybrid shell: sidebar + top bar + sticky live activity dock. Pages keep
//  their concern (page content) and the layout owns chrome.
//
//  This is a thin re-export over the underlying HybridDashboardShell so the
//  shell can be swapped out in one place without touching pages.
// ============================================================================

import HybridDashboardShell from '@/features/dashboard/components/HybridDashboardShell.jsx';

export default function OwnerLayout({ children }) {
  return <HybridDashboardShell>{children}</HybridDashboardShell>;
}
