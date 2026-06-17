// ============================================================================
//  Skeleton — shimmer placeholders for loading lists/tables
// ----------------------------------------------------------------------------
//  Replaces plain "Loading…" text strings with proper shimmer rows. Two
//  flavors:
//
//    <SkeletonTableRows colSpan={6} rows={5} />
//      For inside <tbody> — renders <tr><td colSpan>...shimmer cells...</td></tr>
//
//    <SkeletonListRows rows={5} />
//      For inside <ol>/<ul> — renders <li> shimmer blocks
//
//  Animation uses Tailwind's built-in `animate-pulse`; no extra CSS or
//  framer-motion overhead.
// ============================================================================

export function SkeletonTableRows({ colSpan = 1, rows = 5 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-t border-white/[0.04]">
          <td colSpan={colSpan} className="px-3 py-3">
            <div className="flex items-center gap-3">
              <span className="h-8 w-8 shrink-0 rounded-xl bg-white/[0.04] animate-pulse" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="h-2.5 w-1/3 rounded-full bg-white/[0.06] animate-pulse" />
                <div className="h-2 w-1/2 rounded-full bg-white/[0.04] animate-pulse" />
              </div>
              <div className="h-2 w-16 rounded-full bg-white/[0.04] animate-pulse" />
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}

export function SkeletonListRows({ rows = 5 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="flex items-start gap-3 px-3 py-3">
          <span className="h-8 w-8 shrink-0 rounded-xl bg-white/[0.04] animate-pulse" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="h-2.5 w-2/3 rounded-full bg-white/[0.06] animate-pulse" />
            <div className="h-2 w-1/3 rounded-full bg-white/[0.04] animate-pulse" />
          </div>
        </li>
      ))}
    </>
  );
}

export default SkeletonTableRows;
