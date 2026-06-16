// ============================================================================
//  ProfileSection — shared personal-profile + password panel
// ----------------------------------------------------------------------------
//  Drop-in section reused by the Staff / Owner / Admin settings pages so all
//  three roles get a consistent "edit your own profile" experience without
//  three near-identical copies of the same form.
//
//  Backed by:
//    PATCH /api/auth/me            → update display name
//    POST  /api/auth/me/password   → change password (requires current pw)
//
//  Both calls live-update the AuthProvider session via `updateUser()` so the
//  navbar / avatar refresh immediately on success.
// ============================================================================

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Shield, Save, KeyRound, Loader2, Camera, Trash2 } from 'lucide-react';
import { useAuth, ROLE_META } from '@/app/providers/AuthProvider.jsx';
import { useToast } from '@/shared/components/ToastProvider.jsx';
import Avatar from '@/shared/components/Avatar.jsx';
import authApi from '@/services/authApi.js';

const inputCls =
  'w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-200 ' +
  'placeholder:text-slate-500 focus:border-cyan-400/40 focus:outline-none disabled:opacity-50';

export default function ProfileSection() {
  return (
    <div className="space-y-5">
      <AvatarCard />
      <ProfileCard />
      <PasswordCard />
    </div>
  );
}

// ── Avatar card ─────────────────────────────────────────────────────────────

/**
 * Maximum on-disk dimension we ship to the server. The image is downscaled
 * to fit inside this box (preserving aspect ratio) and re-encoded as webp.
 * 256px @ 0.85 quality is plenty for a 32-64px nav chip and stays well
 * under the backend's ~225KB hard cap (typical output: 30-60KB).
 */
const AVATAR_MAX_PX = 256;
const AVATAR_WEBP_QUALITY = 0.85;
const AVATAR_MAX_INPUT_BYTES = 5 * 1024 * 1024; // 5MB raw upload cap
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

/**
 * Read a File into an HTMLImageElement.
 */
function fileToImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Not a valid image file'));
      img.onload = () => resolve(img);
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Downscale + re-encode to webp data URL. Falls back to jpeg if the runtime
 * doesn't support webp (rare in 2026 but defensive).
 */
function compressAvatar(img) {
  const scale = Math.min(1, AVATAR_MAX_PX / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, w, h);
  let dataUrl = canvas.toDataURL('image/webp', AVATAR_WEBP_QUALITY);
  if (!dataUrl.startsWith('data:image/webp')) {
    // Browser ignored the webp request — try jpeg.
    dataUrl = canvas.toDataURL('image/jpeg', AVATAR_WEBP_QUALITY);
  }
  return dataUrl;
}

function AvatarCard() {
  const { session, updateUser } = useAuth();
  const toast = useToast();
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const user = session?.user;
  const hasAvatar = Boolean(user?.avatarUrl);

  const handlePick = () => {
    if (busy) return;
    fileRef.current?.click();
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error('Please choose a PNG, JPEG, or WebP image.');
      return;
    }
    if (file.size > AVATAR_MAX_INPUT_BYTES) {
      toast.error('Image is too large — please pick one under 5MB.');
      return;
    }

    setBusy(true);
    try {
      const img = await fileToImage(file);
      const dataUrl = compressAvatar(img);
      const res = await authApi.updateMe({ avatarUrl: dataUrl });
      if (!res.ok) {
        toast.error(res.message || 'Could not save your photo.');
        return;
      }
      if (res.data?.user) updateUser(res.data.user);
      toast.success('Profile photo updated');
    } catch (err) {
      toast.error(err.message || 'Could not process that image.');
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    if (busy || !hasAvatar) return;
    setBusy(true);
    const res = await authApi.updateMe({ avatarUrl: null });
    setBusy(false);
    if (!res.ok) {
      toast.error(res.message || 'Could not remove your photo.');
      return;
    }
    if (res.data?.user) updateUser(res.data.user);
    toast.success('Profile photo removed');
  };

  return (
    <Card title="Profile photo" subtitle="Shown in the top bar and on your activity log.">
      <div className="flex flex-wrap items-center gap-5">
        <Avatar
          user={user}
          size={96}
          rounded="2xl"
          ring="ring-1 ring-white/10"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">
            {user?.name || session?.displayName || 'Your photo'}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Square JPG, PNG or WebP. We'll resize it to {AVATAR_MAX_PX}px automatically.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPTED_TYPES.join(',')}
              className="hidden"
              onChange={handleFile}
            />
            <button
              type="button"
              onClick={handlePick}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-3.5 py-2 text-xs font-semibold text-slate-900 shadow-[0_0_22px_-6px_rgba(34,211,238,0.7)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
              {busy ? 'Working…' : hasAvatar ? 'Change photo' : 'Upload photo'}
            </button>
            {hasAvatar && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

// ── Profile card ────────────────────────────────────────────────────────────

function ProfileCard() {
  const { session, updateUser } = useAuth();
  const toast = useToast();

  const initialName = session?.user?.name || session?.displayName || '';
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);

  // Keep the field in sync if the session is rehydrated under us
  // (e.g. /auth/me runs on mount after a hard refresh).
  useEffect(() => {
    setName(session?.user?.name || session?.displayName || '');
  }, [session?.user?.name, session?.displayName]);

  const roleLabel = session?.role ? ROLE_META[session.role]?.label || session.role : '—';
  const email = session?.email || session?.user?.email || '';
  const verified = Boolean(session?.user?.emailVerifiedAt);

  const isDirty = name.trim() !== initialName.trim();
  const tooShort = name.trim().length < 2;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!isDirty || tooShort || saving) return;
    setSaving(true);
    const res = await authApi.updateMe({ name: name.trim() });
    setSaving(false);
    if (!res.ok) {
      toast.error(res.message || 'Could not update your profile.');
      return;
    }
    if (res.data?.user) updateUser(res.data.user);
    toast.success('Profile updated');
  };

  return (
    <Card title="Personal profile" subtitle="How you appear across FlowOps.">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Display name" hint="Visible to teammates in invites and the activity log.">
          <input
            className={inputCls}
            value={name}
            onChange={(e) => setName(e.target.value)}
            minLength={2}
            maxLength={100}
            disabled={saving}
            required
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email" hint="Contact support to change your sign-in email.">
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-slate-300">
              <Mail className="h-3.5 w-3.5 text-slate-500" />
              <span className="truncate">{email || '—'}</span>
              {verified && (
                <span className="ml-auto rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 ring-1 ring-emerald-400/20">
                  Verified
                </span>
              )}
            </div>
          </Field>
          <Field label="Role" hint="Set by your workspace owner or platform admin.">
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-slate-300">
              <Shield className="h-3.5 w-3.5 text-slate-500" />
              <span>{roleLabel}</span>
            </div>
          </Field>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] text-slate-500">
            Changes save instantly across every device you're signed in on.
          </p>
          <button
            type="submit"
            disabled={!isDirty || tooShort || saving}
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

// ── Password card ───────────────────────────────────────────────────────────

const MIN_PASSWORD = 10;

function passwordIssue(pw) {
  if (!pw) return null;
  if (pw.length < MIN_PASSWORD) return `At least ${MIN_PASSWORD} characters.`;
  if (!/[a-zA-Z]/.test(pw) || !/\d/.test(pw)) return 'Must contain a letter and a number.';
  return null;
}

function PasswordCard() {
  const toast = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const issue = passwordIssue(next);
  const mismatch = next && confirm && next !== confirm;
  const sameAsCurrent = current && next && current === next;
  const canSubmit =
    current.length > 0 &&
    next.length >= MIN_PASSWORD &&
    !issue &&
    !mismatch &&
    !sameAsCurrent &&
    !submitting;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    const res = await authApi.changePassword(current, next);
    setSubmitting(false);
    if (!res.ok) {
      toast.error(res.message || 'Could not change your password.');
      return;
    }
    setCurrent('');
    setNext('');
    setConfirm('');
    toast.success('Password changed — other sessions have been signed out.');
  };

  return (
    <Card
      title="Password"
      subtitle="Change your password. All other signed-in devices will be logged out."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Current password">
          <input
            type="password"
            className={inputCls}
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            required
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="New password"
            hint={
              next && issue
                ? issue
                : `At least ${MIN_PASSWORD} characters with a letter and a number.`
            }
            invalid={Boolean(next && issue)}
          >
            <input
              type="password"
              className={inputCls}
              autoComplete="new-password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              minLength={MIN_PASSWORD}
              required
            />
          </Field>
          <Field
            label="Confirm new password"
            hint={mismatch ? 'Passwords do not match.' : 'Type the new password again.'}
            invalid={mismatch}
          >
            <input
              type="password"
              className={inputCls}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              minLength={MIN_PASSWORD}
              required
            />
          </Field>
        </div>

        {sameAsCurrent && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[11px] text-amber-300"
          >
            Pick a new password — it must differ from the current one.
          </motion.p>
        )}

        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] text-slate-500">
            For your safety, every other session will be ended on success.
          </p>
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />}
            {submitting ? 'Updating…' : 'Update password'}
          </button>
        </div>
      </form>
    </Card>
  );
}

// ── Primitives ──────────────────────────────────────────────────────────────

function Card({ title, subtitle, children }) {
  return (
    <section className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
      <div>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Field({ label, hint, invalid = false, children }) {
  return (
    <div>
      <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
        {label}
      </label>
      <div className="mt-1.5">{children}</div>
      {hint && (
        <p className={`mt-1 text-[11px] ${invalid ? 'text-amber-300' : 'text-slate-500'}`}>
          {hint}
        </p>
      )}
    </div>
  );
}
