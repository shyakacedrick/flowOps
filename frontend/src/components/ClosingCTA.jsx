import { Link } from 'react-router-dom';
import { LogoField, LogoWatermark, LogoOrbit } from './LogoMotif.jsx';

export default function ClosingCTA() {
  return (
    <section id="cta" className="section">
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 px-6 py-20 text-center sm:px-12 sm:py-24">
        {/* Glow layers */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 left-1/2 h-[400px] w-[800px] -translate-x-1/2 rounded-full bg-primary/25 blur-[120px]" />
          <div className="absolute bottom-0 left-1/4 h-[260px] w-[260px] rounded-full bg-secondary/25 blur-[100px]" />
          <div className="absolute bottom-0 right-1/4 h-[260px] w-[260px] rounded-full bg-primary/20 blur-[100px]" />
        </div>

        {/* Dot grid */}
        <div className="pointer-events-none absolute inset-0 bg-dots opacity-30 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />

        {/* Brand motif layers */}
        <LogoField density={0.7} />
        <LogoWatermark corner="bottom-right" />
        <LogoWatermark corner="top-left" />

        <div className="relative">
          <LogoOrbit size={44} className="mx-auto !h-24 !w-24" />
          <span className="eyebrow mt-4">Ready when you are</span>
          <h2 className="mt-6 text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Transform Waiting{' '}
            <span className="bg-gradient-to-r from-primary via-blue-400 to-secondary bg-clip-text text-transparent">
              Into Insight.
            </span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg">
            Manage customer flow, improve service efficiency, and make smarter
            operational decisions with FlowOps.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link to="/signup" className="btn-primary !py-4 !px-7 text-base">
              Get Started
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
                aria-hidden
              >
                <path
                  fillRule="evenodd"
                  d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>
            <Link to="/book-demo" className="btn-secondary !py-4 !px-7 text-base">
              Book a Demo
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-emerald-400" />
              No credit card required
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-emerald-400" />
              14-day free trial
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-emerald-400" />
              Cancel anytime
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
