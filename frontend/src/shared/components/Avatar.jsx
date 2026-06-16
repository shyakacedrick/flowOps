// ============================================================================
//  Avatar — shared circular/rounded user image with initials fallback
// ----------------------------------------------------------------------------
//  Renders a user's profile photo (`user.avatarUrl`) when present, otherwise
//  falls back to a gradient tile with the user's initials. Used by every
//  shell's top-right profile chip and by the settings page.
//
//  The `user` object can be the raw API user (`{ name, avatarUrl }`) or any
//  session-shaped object; if neither `user.name` nor an explicit `name` prop
//  is supplied we fall back to `??`.
// ============================================================================

const DEFAULT_GRADIENT = 'from-cyan-400 to-blue-500';

/**
 * Derive 1-2 letter initials from a display name or email.
 *  - "Jordan Lee"      → "JL"
 *  - "Jordan"          → "J"
 *  - "jordan@flo.app"  → "J"
 *  - falsy             → "?"
 */
export function initialsFromName(name) {
  if (!name || typeof name !== 'string') return '?';
  const trimmed = name.trim();
  if (!trimmed) return '?';
  // For an email, only consider the local part.
  const base = trimmed.includes('@') ? trimmed.split('@')[0] : trimmed;
  const parts = base.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return base[0].toUpperCase();
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * <Avatar user={user} size={32} gradient="from-cyan-400 to-blue-500" />
 *
 * Props:
 *  - user       — { name, email, avatarUrl } (or session.user); optional.
 *  - name       — explicit override used for initials when `user` is absent.
 *  - src        — explicit image URL override; otherwise we read user.avatarUrl.
 *  - size       — pixel size (square). Default 32.
 *  - rounded    — 'full' (circle) | 'lg' | 'xl' | '2xl'. Default 'lg' to match the chip style.
 *  - gradient   — Tailwind gradient stops (no `bg-gradient-to-br` prefix).
 *  - className  — appended to the outer element.
 *  - ring       — Tailwind ring class (e.g. 'ring-2 ring-[#0B1120]'). Optional.
 */
export default function Avatar({
  user,
  name,
  src,
  size = 32,
  rounded = 'lg',
  gradient = DEFAULT_GRADIENT,
  className = '',
  ring = '',
}) {
  const url = src ?? user?.avatarUrl ?? null;
  const label = initialsFromName(name ?? user?.name ?? user?.email);
  const roundedCls =
    rounded === 'full' ? 'rounded-full'
    : rounded === 'xl'   ? 'rounded-xl'
    : rounded === '2xl'  ? 'rounded-2xl'
    : 'rounded-lg';

  const base = `relative grid shrink-0 place-items-center overflow-hidden ${roundedCls} ${ring} ${className}`;
  const style = { width: size, height: size };

  if (url) {
    return (
      <span className={`${base} bg-slate-900`} style={style}>
        <img
          src={url}
          alt={user?.name || name || ''}
          className="h-full w-full object-cover"
          draggable={false}
        />
      </span>
    );
  }

  // Initials fallback — keep the gradient + text-size proportional to the box.
  const fontSize = Math.max(10, Math.round(size * 0.4));
  return (
    <span
      className={`${base} bg-gradient-to-br ${gradient} font-bold text-slate-900`}
      style={{ ...style, fontSize }}
    >
      {label}
    </span>
  );
}
