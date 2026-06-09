// ============================================================================
//  emailTemplates — minimal transactional email renderers
// ----------------------------------------------------------------------------
//  Plain-string HTML to keep the email tiny + spam-friendly. No external
//  CSS, no images. Inlined brand colors matching the canonical palette.
//
//  Every template returns { subject, html, text }.
//
//  ⚠ Inputs that land in the HTML body MUST be HTML-escaped via `esc()`.
//     URLs are NOT escaped (they go inside href + as visible text — we
//     trust the caller to pass a safe, server-built URL).
// ============================================================================

const BRAND   = 'FlowOps';
const PRIMARY = '#34D399'; // emerald — canonical "action" color

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/** Shared shell. Tight max-width, system fonts, dark text on light bg. */
const shell = ({ heading, bodyHtml, ctaLabel, ctaUrl, footer }) => `<!doctype html>
<html><body style="margin:0;padding:0;background:#f6f7f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#0f172a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7f9;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;padding:32px;">
        <tr><td style="padding-bottom:8px;font-size:14px;letter-spacing:.08em;text-transform:uppercase;color:#64748b;">${esc(BRAND)}</td></tr>
        <tr><td style="font-size:20px;font-weight:600;color:#0f172a;padding-bottom:16px;">${esc(heading)}</td></tr>
        <tr><td style="font-size:15px;line-height:1.55;color:#334155;">${bodyHtml}</td></tr>
        ${ctaUrl ? `<tr><td style="padding:24px 0 8px;">
          <a href="${ctaUrl}" style="display:inline-block;background:${PRIMARY};color:#04221b;font-weight:600;text-decoration:none;padding:12px 20px;border-radius:10px;font-size:14px;">${esc(ctaLabel)}</a>
        </td></tr>
        <tr><td style="font-size:12px;color:#94a3b8;padding-top:8px;word-break:break-all;">If the button doesn't work, paste this link into your browser:<br/>${ctaUrl}</td></tr>` : ''}
        <tr><td style="border-top:1px solid #e2e8f0;margin-top:16px;padding-top:16px;font-size:12px;color:#94a3b8;">${esc(footer || `${BRAND} · You're receiving this because of activity on your account.`)}</td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

// ── Email verification ──────────────────────────────────────────────────────
export function verifyEmailTemplate({ name, url, ttlHours }) {
  const heading = `Confirm your email`;
  const greet   = name ? `Hi ${esc(name)},` : 'Hi there,';
  const html = shell({
    heading,
    bodyHtml: `<p style="margin:0 0 12px;">${greet}</p>
      <p style="margin:0 0 12px;">Please confirm this email belongs to you so we can secure your ${esc(BRAND)} account.</p>
      <p style="margin:0;color:#64748b;font-size:13px;">This link expires in ${Number(ttlHours)} hours.</p>`,
    ctaLabel: 'Confirm email',
    ctaUrl: url,
    footer: `${BRAND} · If you didn't create this account, you can safely ignore this email.`,
  });
  const text = `${greet}\n\nConfirm your ${BRAND} email by opening this link (expires in ${ttlHours}h):\n${url}\n\nIf you didn't create this account, ignore this email.`;
  return { subject: `Confirm your ${BRAND} email`, html, text };
}

// ── Password reset ──────────────────────────────────────────────────────────
export function resetPasswordTemplate({ name, url, ttlMins }) {
  const heading = `Reset your password`;
  const greet   = name ? `Hi ${esc(name)},` : 'Hi there,';
  const html = shell({
    heading,
    bodyHtml: `<p style="margin:0 0 12px;">${greet}</p>
      <p style="margin:0 0 12px;">We received a request to reset your ${esc(BRAND)} password. Click the button below to choose a new one.</p>
      <p style="margin:0;color:#64748b;font-size:13px;">This link expires in ${Number(ttlMins)} minutes. If you didn't request this, you can safely ignore this email — your password won't change.</p>`,
    ctaLabel: 'Reset password',
    ctaUrl: url,
    footer: `${BRAND} · For your security, this link can only be used once.`,
  });
  const text = `${greet}\n\nReset your ${BRAND} password by opening this link (expires in ${ttlMins} min):\n${url}\n\nDidn't request this? Ignore this email.`;
  return { subject: `Reset your ${BRAND} password`, html, text };
}

// ── Invite ─────────────────────────────────────────────────────────────────
export function inviteTemplate({ inviterName, orgName, role, url, ttlDays }) {
  const heading = `You're invited to ${esc(orgName)}`;
  const inviter = inviterName ? esc(inviterName) : 'A teammate';
  const html = shell({
    heading,
    bodyHtml: `<p style="margin:0 0 12px;">${inviter} invited you to join <strong>${esc(orgName)}</strong> on ${esc(BRAND)} as <strong>${esc(role)}</strong>.</p>
      <p style="margin:0 0 12px;">Accept the invite below to create your account.</p>
      <p style="margin:0;color:#64748b;font-size:13px;">This invite expires in ${Number(ttlDays)} days.</p>`,
    ctaLabel: 'Accept invite',
    ctaUrl: url,
    footer: `${BRAND} · You received this because someone invited you to their workspace.`,
  });
  const text = `${inviter} invited you to join ${orgName} on ${BRAND} as ${role}.\n\nAccept (expires in ${ttlDays}d):\n${url}`;
  return { subject: `${inviter} invited you to ${orgName} on ${BRAND}`, html, text };
}

export default { verifyEmailTemplate, resetPasswordTemplate, inviteTemplate };
