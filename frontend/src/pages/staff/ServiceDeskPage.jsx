import { useEffect, useState } from 'react';
import {
  MonitorCog, Play, Pause, AlertCircle, AlertTriangle, CheckCircle2, Coffee,
  Activity, Wifi, Printer, Wrench,
} from 'lucide-react';
import StaffShell from '../../dashboards/StaffShell.jsx';
import PageHeader, { StatCard } from '../../components/shared/PageHeader.jsx';
import { useSimulationSlice } from '../../engine/SimulationProvider.jsx';

/**
 * ServiceDeskPage — single desk view. The operator's "command center".
 */
export default function ServiceDeskPage() {
  const current   = useSimulationSlice((s) => s.business.currentServing);
  const served    = useSimulationSlice((s) => s.business.totalServed);
  const avgSvc    = useSimulationSlice((s) => s.business.averageServiceTime);

  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    setElapsed(0);
    if (!current) return undefined;
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [current?.id]);

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');

  return (
    <StaffShell>
      <div className="space-y-6 pt-2">
        <PageHeader
          eyebrow="Workstation"
          title="Service Desk"
          subtitle="Manage your station, hardware status, and signal capacity to the floor."
          crumbs={[{ label: 'Staff', to: '/staff/dashboard' }, { label: 'Service Desk' }]}
          actions={(
            <div className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold ring-1 ${
              paused ? 'bg-amber-500/10 text-amber-200 ring-amber-400/30'
                     : 'bg-emerald-500/10 text-emerald-200 ring-emerald-400/30'
            }`}>
              <span className={`h-2 w-2 rounded-full ${paused ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`} />
              Desk 2 · {paused ? 'Paused' : 'Active'}
            </div>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Served today"   value={served || 24} delta="Your output"    tone="emerald" icon={CheckCircle2} />
          <StatCard label="Avg service"    value={`${Math.round(avgSvc) || 4}m`} delta="Per customer" tone="cyan" icon={Activity} />
          <StatCard label="Current"        value={current?.id || '—'} delta={current?.service || 'Idle'} tone="violet" icon={MonitorCog} />
          <StatCard label="Uptime"         value="5h 12m"        delta="This shift"    tone="amber" />
        </div>

        <div className="grid gap-5 xl:grid-cols-12">
          {/* Current customer + controls */}
          <section className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5 xl:col-span-7">
            <h3 className="text-sm font-semibold text-white">Current customer</h3>
            <div className="mt-4 flex items-center justify-between rounded-2xl border border-cyan-400/15 bg-cyan-500/[0.05] p-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-cyan-300">Now serving</p>
                <p className="mt-1 text-2xl font-bold text-white">{current?.name || 'No active customer'}</p>
                <p className="mt-0.5 font-mono text-sm text-slate-400">
                  {current?.id || '—'} · {current?.service || 'Idle'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Duration</p>
                <p className="mt-1 font-mono text-3xl font-bold text-cyan-200">{mm}:{ss}</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <DeskBtn icon={paused ? Play : Pause} tone={paused ? 'emerald' : 'amber'}
                label={paused ? 'Resume desk' : 'Pause desk'}
                onClick={() => setPaused((p) => !p)} />
              <DeskBtn icon={Coffee} tone="cyan" label="Take a break"
                onClick={() => alert('Break logged (demo)')} />
              <DeskBtn icon={AlertCircle} tone="violet" label="Request help"
                onClick={() => alert('Floor manager paged (demo)')} />
              <DeskBtn icon={AlertTriangle} tone="rose" label="Report issue"
                onClick={() => alert('Issue reported (demo)')} />
            </div>
          </section>

          {/* Hardware status */}
          <section className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5 xl:col-span-5">
            <h3 className="text-sm font-semibold text-white">Station status</h3>
            <p className="text-xs text-slate-400">Connected hardware</p>

            <ul className="mt-4 space-y-2">
              <HardwareRow icon={Wifi}    name="Network"      detail="Connected · 92ms" ok />
              <HardwareRow icon={Printer} name="Ticket printer" detail="Tray full · ready" ok />
              <HardwareRow icon={MonitorCog} name="Display"   detail="Customer screen mirrored" ok />
              <HardwareRow icon={Wrench}  name="Card reader"  detail="Idle · 1 retry today" warn />
            </ul>

            <div className="mt-5 rounded-2xl border border-white/[0.05] bg-white/[0.02] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Floor manager</p>
              <p className="mt-1 text-sm font-semibold text-white">Sam Cohen</p>
              <p className="text-[11px] text-slate-400">On floor · responds in &lt; 2m</p>
            </div>
          </section>
        </div>
      </div>
    </StaffShell>
  );
}

const TONES = {
  emerald: 'bg-emerald-500/15 text-emerald-200 ring-emerald-400/30 hover:bg-emerald-500/25',
  cyan:    'bg-cyan-500/15 text-cyan-200 ring-cyan-400/30 hover:bg-cyan-500/25',
  amber:   'bg-amber-500/15 text-amber-200 ring-amber-400/30 hover:bg-amber-500/25',
  violet:  'bg-violet-500/15 text-violet-200 ring-violet-400/30 hover:bg-violet-500/25',
  rose:    'bg-rose-500/15 text-rose-200 ring-rose-400/30 hover:bg-rose-500/25',
};

function DeskBtn({ icon: Icon, tone, label, onClick }) {
  return (
    <button onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl py-4 text-xs font-semibold ring-1 transition-all hover:-translate-y-0.5 active:translate-y-0 ${TONES[tone]}`}>
      <Icon className="h-5 w-5" />
      {label}
    </button>
  );
}

function HardwareRow({ icon: Icon, name, detail, ok, warn }) {
  const tone = ok ? 'text-emerald-300' : warn ? 'text-amber-300' : 'text-rose-300';
  const dot  = ok ? 'bg-emerald-400'   : warn ? 'bg-amber-400'   : 'bg-rose-400';
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.02] p-3">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/[0.06]">
        <Icon className={`h-4 w-4 ${tone}`} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white">{name}</p>
        <p className="text-[11px] text-slate-400">{detail}</p>
      </div>
      <span className={`h-2 w-2 rounded-full ${dot}`} />
    </li>
  );
}
