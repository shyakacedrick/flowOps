import { Zap } from 'lucide-react';

export default function Logo({ className = 'h-8 w-auto' }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 text-slate-900 shadow-[0_0_22px_-3px_rgba(34,211,238,0.7)]">
        <Zap className="h-4 w-4" strokeWidth={2.5} />
      </span>
      <span className="text-[15px] font-bold tracking-tight text-white">
        FlowOps
      </span>
    </div>
  );
}
