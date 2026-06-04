export default function Logo({ className = 'h-8 w-auto' }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-secondary shadow-glow">
        <div className="h-3 w-3 rounded-sm bg-white/90" />
        <div className="absolute inset-0 rounded-lg ring-1 ring-white/20" />
      </div>
      <span className="text-lg font-bold tracking-tight text-white">
        Flow<span className="text-primary">Ops</span>
      </span>
    </div>
  );
}
