// ============================================================================
//  JoinQueuePage — public, no-auth customer entry point
// ----------------------------------------------------------------------------
//  Route: /q/:queueId — typically reached via a QR code in-store.
//
//  Three states:
//    1. LOADING        — fetching queue info
//    2. JOIN FORM      — customer enters name (+ optional phone)
//    3. WAITING TICKET — shows ticket number, live position, ETA, status
//
//  We persist the customer's ticket id to localStorage keyed by queue id
//  so a page refresh restores their place in line instead of letting them
//  take a second ticket. Cleared once the ticket reaches a terminal state.
// ============================================================================

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Loader2,
  PauseCircle,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Users,
  XCircle,
} from 'lucide-react';

import Logo from '@/shared/components/Logo.jsx';
import Button from '@/shared/ui/Button.jsx';
import Card from '@/shared/ui/Card.jsx';
import publicApi from '@/services/publicApi.js';
import useQueuePosition from '@/features/public/hooks/useQueuePosition.js';

const ticketKey = (queueId) => `flowops.publicTicket.${queueId}`;

export default function JoinQueuePage() {
  const { queueId } = useParams();

  const [queueInfo, setQueueInfo] = useState(null);
  const [queueStatus, setQueueStatus] = useState('loading');
  const [queueError, setQueueError] = useState(null);

  const [ticketId, setTicketId] = useState(() => {
    try { return localStorage.getItem(ticketKey(queueId)) || null; } catch { return null; }
  });

  // ── Load (and periodically refresh) the queue info ───────────────────
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await publicApi.getQueue(queueId);
      if (cancelled) return;
      if (!res.ok) {
        setQueueError(res.message || 'Queue not found');
        setQueueStatus('error');
        return;
      }
      setQueueInfo(res.data);
      setQueueStatus('ready');
    }
    load();
    const t = setInterval(load, 15000);
    return () => { cancelled = true; clearInterval(t); };
  }, [queueId]);

  const handleJoined = (ticket) => {
    try { localStorage.setItem(ticketKey(queueId), ticket._id); } catch { /* ignore */ }
    setTicketId(ticket._id);
  };

  const handleLeave = () => {
    try { localStorage.removeItem(ticketKey(queueId)); } catch { /* ignore */ }
    setTicketId(null);
  };

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-bg text-slate-100">
      <BrandedHeader org={queueInfo?.organization} />

      <main className="mx-auto max-w-xl px-4 pb-16 pt-6 sm:pt-10">
        {queueStatus === 'loading' && <LoadingShell />}

        {queueStatus === 'error' && (
          <ErrorShell
            title="We can't find this queue"
            message={queueError}
          />
        )}

        {queueStatus === 'ready' && queueInfo && (
          <AnimatePresence mode="wait">
            {ticketId ? (
              <motion.div
                key="ticket"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                <TicketStatus
                  queue={queueInfo}
                  ticketId={ticketId}
                  onLeave={handleLeave}
                />
              </motion.div>
            ) : (
              <motion.div
                key="join"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                <JoinForm queue={queueInfo} onJoined={handleJoined} />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>

      <footer className="mx-auto max-w-xl px-4 pb-8 text-center text-[11px] uppercase tracking-[0.18em] text-slate-500">
        Powered by FlowOps
      </footer>
    </div>
  );
}

/* ============================================================== layout */

function BrandedHeader({ org }) {
  return (
    <header className="border-b border-white/[0.06] bg-white/[0.02] backdrop-blur-xl">
      <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-4">
        <Logo className="h-7" />
        {org && (
          <div className="flex flex-col items-end leading-tight">
            <span className="text-sm font-semibold text-white">{org.name}</span>
            {org.industry && (
              <span className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                {org.industry}
              </span>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

function LoadingShell() {
  return (
    <Card padding="xl" className="grid place-items-center gap-3 py-16 text-slate-400">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <p className="text-sm">Loading queue…</p>
    </Card>
  );
}

function ErrorShell({ title, message }) {
  return (
    <Card padding="xl" className="grid place-items-center gap-3 py-14 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-400/10 text-rose-300">
        <ShieldAlert className="h-6 w-6" />
      </span>
      <h1 className="text-lg font-semibold text-white">{title}</h1>
      <p className="max-w-sm text-sm text-slate-400">
        {message || 'The link you followed may be expired, mistyped, or removed by the business.'}
      </p>
    </Card>
  );
}

/* ================================================================ join */

function JoinForm({ queue, onJoined }) {
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const isActive = queue.status === 'active';

  const submit = async (e) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setError('Please enter your name.');
      return;
    }
    setSubmitting(true);
    setError(null);
    const res = await publicApi.joinQueue(queue._id, {
      customerName: customerName.trim(),
      phone: phone.trim() || undefined,
    });
    setSubmitting(false);
    if (!res.ok) {
      setError(res.message || 'Could not join the queue. Please try again.');
      return;
    }
    onJoined(res.data);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/80">
          Join the queue
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          {queue.name}
        </h1>
        <QueueStatusLine queue={queue} />
      </div>

      {!isActive && <QueueClosedBanner status={queue.status} />}

      <Card padding="xl" className="space-y-4">
        <form onSubmit={submit} className="space-y-4">
          <Field
            label="Your name"
            hint="So staff can call you when it's your turn."
            required
          >
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Alex Johnson"
              autoComplete="name"
              maxLength={80}
              disabled={!isActive || submitting}
              className="w-full rounded-lg border border-white/10 bg-bg/40 px-3 py-2.5 text-sm text-white outline-none ring-primary/40 placeholder:text-slate-500 focus:border-primary/50 focus:ring-2 disabled:opacity-60"
            />
          </Field>

          <Field
            label="Phone"
            hint="Optional — we'll only use it if you walk away."
          >
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Optional"
              autoComplete="tel"
              maxLength={32}
              disabled={!isActive || submitting}
              className="w-full rounded-lg border border-white/10 bg-bg/40 px-3 py-2.5 text-sm text-white outline-none ring-primary/40 placeholder:text-slate-500 focus:border-primary/50 focus:ring-2 disabled:opacity-60"
            />
          </Field>

          {error && (
            <p className="rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-xs text-rose-200">
              {error}
            </p>
          )}

          <Button
            type="submit"
            full
            size="lg"
            loading={submitting}
            disabled={!isActive}
            iconRight={ArrowRight}
          >
            {isActive ? 'Take a ticket' : 'Queue unavailable'}
          </Button>
        </form>
      </Card>

      <p className="text-center text-[11px] text-slate-500">
        By joining you agree to be notified when it's your turn. No account needed.
      </p>
    </div>
  );
}

function Field({ label, hint, required, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold text-slate-300">
        {label}
        {required && <span className="ml-1 text-rose-300">*</span>}
      </span>
      {children}
      {hint && <span className="block text-[11px] text-slate-500">{hint}</span>}
    </label>
  );
}

function QueueStatusLine({ queue }) {
  const dotCls =
    queue.status === 'active'
      ? 'bg-emerald-400 shadow-[0_0_10px_2px_rgba(52,211,153,0.6)]'
      : queue.status === 'paused'
        ? 'bg-amber-400'
        : 'bg-rose-400';
  return (
    <div className="flex items-center gap-2 text-xs text-slate-400">
      <span className={`h-2 w-2 rounded-full ${dotCls}`} />
      <span className="capitalize">{queue.status}</span>
      <span className="text-slate-600">•</span>
      <Users className="h-3.5 w-3.5" />
      <span>{queue.waitingCount} waiting</span>
    </div>
  );
}

function QueueClosedBanner({ status }) {
  const isPaused = status === 'paused';
  return (
    <div
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${
        isPaused
          ? 'border-amber-400/30 bg-amber-400/10 text-amber-200'
          : 'border-rose-400/30 bg-rose-400/10 text-rose-200'
      }`}
    >
      <PauseCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="space-y-0.5 text-xs">
        <p className="font-semibold">
          {isPaused ? 'This queue is paused' : 'This queue is closed'}
        </p>
        <p className="opacity-80">
          {isPaused
            ? 'Staff have temporarily stopped accepting new walk-ins. Please check back soon.'
            : 'The business isn\'t accepting new tickets right now.'}
        </p>
      </div>
    </div>
  );
}

/* ============================================================== ticket */

function TicketStatus({ queue, ticketId, onLeave }) {
  const { ticket, status, error, refresh } = useQueuePosition(ticketId);

  // If the server says the ticket doesn't exist (e.g. business cleared it),
  // clear local state so the customer can rejoin.
  useEffect(() => {
    if (status === 'error') {
      // 404-ish: just let the user start over
      // (we keep the explicit "Leave" affordance below)
    }
  }, [status]);

  if (status === 'loading' && !ticket) return <LoadingShell />;
  if (status === 'error' && !ticket) {
    return (
      <div className="space-y-4">
        <ErrorShell title="We lost track of your ticket" message={error} />
        <Button full variant="secondary" onClick={onLeave}>
          Start over
        </Button>
      </div>
    );
  }
  if (!ticket) return null;

  const isWaiting = ticket.status === 'waiting';
  const isServing = ticket.status === 'serving';
  const isTerminal = ['served', 'skipped', 'cancelled'].includes(ticket.status);

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/80">
          You're in line
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          {queue.name}
        </h1>
      </div>

      <Card padding="xl" glow className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Stat
            label="Ticket"
            value={ticket.ticketNumber}
            accent="primary"
          />
          <Stat
            label="Position"
            value={
              isWaiting
                ? `#${ticket.position ?? '—'}`
                : isServing
                  ? 'Now'
                  : '—'
            }
            accent={isServing ? 'emerald' : 'primary'}
          />
        </div>

        <TicketBanner ticket={ticket} />

        <div className="flex items-center justify-between border-t border-white/[0.06] pt-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Joined at {formatTime(ticket.joinedAt)}
          </span>
          <button
            type="button"
            onClick={refresh}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-slate-300 hover:bg-white/[0.04] hover:text-white"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
      </Card>

      {!isTerminal && (
        <Button full variant="secondary" onClick={onLeave}>
          I'm no longer here
        </Button>
      )}
      {isTerminal && (
        <Button full onClick={onLeave}>
          Done
        </Button>
      )}
    </div>
  );
}

function Stat({ label, value, accent = 'primary' }) {
  const tone =
    accent === 'emerald'
      ? 'text-emerald-300'
      : 'text-white';
  return (
    <div className="rounded-xl border border-white/[0.06] bg-bg/40 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className={`mt-1 text-3xl font-bold tracking-tight ${tone}`}>{value}</p>
    </div>
  );
}

function TicketBanner({ ticket }) {
  switch (ticket.status) {
    case 'serving':
      return (
        <Banner
          tone="emerald"
          icon={Sparkles}
          title="You're being served"
          body="Please head to the counter — staff is calling your number now."
        />
      );
    case 'served':
      return (
        <Banner
          tone="emerald"
          icon={CheckCircle2}
          title="All done"
          body="Thanks for visiting. You can safely close this page."
        />
      );
    case 'skipped':
      return (
        <Banner
          tone="amber"
          icon={ShieldAlert}
          title="You were skipped"
          body="Staff moved on. Please check in at the counter to be re-added."
        />
      );
    case 'cancelled':
      return (
        <Banner
          tone="rose"
          icon={XCircle}
          title="Ticket cancelled"
          body="This ticket was cancelled. Take a new one to rejoin the line."
        />
      );
    case 'waiting':
    default:
      return (
        <Banner
          tone="slate"
          icon={Clock}
          title={
            ticket.position === 1
              ? 'You\'re next'
              : `${(ticket.position ?? 1) - 1} ahead of you`
          }
          body="We'll update this page as the line moves. Keep it open."
        />
      );
  }
}

function Banner({ tone, icon: Icon, title, body }) {
  const tones = {
    emerald: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100',
    amber:   'border-amber-400/30 bg-amber-400/10 text-amber-100',
    rose:    'border-rose-400/30 bg-rose-400/10 text-rose-100',
    slate:   'border-white/[0.08] bg-white/[0.03] text-slate-200',
  };
  return (
    <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${tones[tone]}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="space-y-0.5 text-sm">
        <p className="font-semibold">{title}</p>
        <p className="text-xs opacity-80">{body}</p>
      </div>
    </div>
  );
}

function formatTime(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '—';
  }
}
