// ============================================================================
//  mailer — transactional email abstraction
// ----------------------------------------------------------------------------
//  One file, one responsibility: deliver a rendered email. Templates live
//  in ./emailTemplates. Providers can be swapped without touching callers.
//
//  Provider selection (first match wins):
//    1. RESEND_API_KEY set            → Resend HTTPS API
//    2. SMTP_HOST set                  → nodemailer (Mailtrap, SendGrid SMTP,
//                                        Postmark SMTP, Gmail, self-hosted…)
//    3. neither                        → console fallback (dev safety net)
//
//  Failures are non-fatal: a mail outage never blocks the business action.
//  Caller still gets { ok: false, ... } and can log/retry.
// ============================================================================

import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import env from '../config/env.js';

// ── Provider instances (lazy + memoised) ───────────────────────────────────
let resendClient = null;
function getResend() {
  if (!env.resendApiKey) return null;
  if (!resendClient) resendClient = new Resend(env.resendApiKey);
  return resendClient;
}

let smtpTransport = null;
function getSmtp() {
  if (!env.smtpHost) return null;
  if (!smtpTransport) {
    smtpTransport = nodemailer.createTransport({
      host:   env.smtpHost,
      port:   env.smtpPort,
      secure: env.smtpSecure, // true => TLS on connect (port 465)
      auth: env.smtpUser
        ? { user: env.smtpUser, pass: env.smtpPass }
        : undefined,
    });
  }
  return smtpTransport;
}

/** Which provider will handle the next send? Useful for /health + tests. */
export function activeProvider() {
  if (env.resendApiKey) return 'resend';
  if (env.smtpHost)     return 'smtp';
  return 'console';
}

/**
 * sendMail({ to, subject, html, text })
 * Returns { ok, provider, id?, error? }. Never throws.
 */
export async function sendMail({ to, subject, html, text }) {
  if (!to || !subject || (!html && !text)) {
    return { ok: false, provider: 'none', error: 'Missing to/subject/body' };
  }

  // ── Resend ──────────────────────────────────────────────────────────────
  const resend = getResend();
  if (resend) {
    try {
      const { data, error } = await resend.emails.send({
        from: env.mailFrom,
        to,
        subject,
        html,
        text,
      });
      if (error) {
        // eslint-disable-next-line no-console
        console.error('[mailer:resend] send failed:', error);
        return { ok: false, provider: 'resend', error: error.message || String(error) };
      }
      return { ok: true, provider: 'resend', id: data?.id };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[mailer:resend] unexpected error:', err);
      return { ok: false, provider: 'resend', error: err.message || String(err) };
    }
  }

  // ── SMTP via nodemailer ─────────────────────────────────────────────────
  const smtp = getSmtp();
  if (smtp) {
    try {
      const info = await smtp.sendMail({
        from: env.mailFrom,
        to,
        subject,
        html,
        text,
      });
      return { ok: true, provider: 'smtp', id: info?.messageId };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[mailer:smtp] send failed:', err?.message || err);
      return { ok: false, provider: 'smtp', error: err.message || String(err) };
    }
  }

  // ── Console fallback (dev) ──────────────────────────────────────────────
  // Shown in a tidy box so it's easy to spot in pino's mixed stream.
  const banner = '─'.repeat(60);
  // eslint-disable-next-line no-console
  console.log(
    [
      `\n${banner}`,
      `[mailer:console] would send →`,
      `  to:      ${to}`,
      `  from:    ${env.mailFrom}`,
      `  subject: ${subject}`,
      text ? `  text:    ${text.split('\n')[0].slice(0, 120)}…` : '',
      banner,
    ]
      .filter(Boolean)
      .join('\n')
  );
  return { ok: true, provider: 'console', id: `dev-${Date.now()}` };
}

export default { sendMail, activeProvider };
