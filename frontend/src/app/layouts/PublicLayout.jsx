// ============================================================================
//  PublicLayout — marketing & auth pages
// ----------------------------------------------------------------------------
//  Pass-through wrapper. The current marketing/auth pages render their own
//  Navbar/Footer chrome, so this layout intentionally adds none — its purpose
//  is to (a) act as the canonical mount point for unauthenticated routes,
//  (b) provide a stable surface for future global chrome (banners, A/B flags,
//  cookie strips), and (c) keep route definitions self-documenting.
// ============================================================================

export default function PublicLayout({ children }) {
  return <>{children}</>;
}
