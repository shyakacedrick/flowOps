// ============================================================================
//  StaffLayout — Staff Operator workspace shell
// ----------------------------------------------------------------------------
//  Wraps every /staff/* page with the operator console chrome (collapsible
//  sidebar, shift status pill, now-serving top bar).
// ============================================================================

import StaffShell from '@/features/staff/components/StaffShell.jsx';

export default function StaffLayout({ children }) {
  return <StaffShell>{children}</StaffShell>;
}
