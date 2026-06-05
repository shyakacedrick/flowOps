import { Link } from 'react-router-dom';
import DashboardMock from '@/features/marketing/components/DashboardMock.jsx';
import { motion } from 'framer-motion';
import { ease, staggerContainer, staggerItem } from '@/animations/motion';
import { LogoField, LogoOrbit } from '@/features/marketing/components/LogoMotif.jsx';
import { Stethoscope, Scissors, UtensilsCrossed, Landmark, ArrowUpRight } from 'lucide-react';

const WISHLIST = [
  { label: 'Clinics', icon: Stethoscope },
  { label: 'Salons', icon: Scissors },
  { label: 'Restaurants', icon: UtensilsCrossed },
  { label: 'Banks', icon: Landmark },
];

export default function Hero() {
  return (
    <section id="hero" className="relative overflow-hidden bg-radial pt-40 lg:pt-20">
      {/* Grid backdrop */}
      <div className="pointer-events-none absolute inset-0 bg-grid-faint [background-size:48px_48px] opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />

      {/* Ambient logo field (cosmetic only) */}
      <LogoField />

      <div className="section grid items-center gap-16 lg:grid-cols-12 lg:gap-10">
        {/* Left */}
        <motion.div
          className="lg:col-span-6"
          variants={staggerContainer(0.1, 0.15)}
          initial="hidden"
          animate="show"
        >
          <motion.h1 variants={staggerItem} className="h-display">
            Manage queues smarter.{' '}
            <span className="bg-gradient-to-r from-primary via-blue-400 to-secondary bg-clip-text text-transparent">
              Understand business flow
            </span>{' '}
            in real time.
          </motion.h1>

          <motion.p variants={staggerItem} className="mt-6 max-w-xl text-lg leading-relaxed text-slate-400">
            FlowOps helps service businesses reduce waiting time, manage queues
            digitally, and track operational performance through real-time
            analytics.
          </motion.p>

          <motion.div variants={staggerItem} className="mt-8 flex flex-wrap items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.15, ease: ease.out }}
            >
              <Link to="/signup" className="btn-primary">
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
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.15, ease: ease.out }}
            >
              <Link to="/book-demo" className="btn-secondary">
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4 text-secondary"
                  aria-hidden
                >
                  <path d="M6.3 2.84A1 1 0 004.8 3.7v12.6a1 1 0 001.5.86l10.5-6.3a1 1 0 000-1.72L6.3 2.84z" />
                </svg>
                Request Demo
              </Link>
            </motion.div>
          </motion.div>

          {/* "Who we hope to work with" — honest pre-launch wishlist */}
          <motion.div variants={staggerItem} className="mt-20">
            <div className="flex items-center gap-3">
              <LogoOrbit size={18} className="!h-9 !w-9" />
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-slate-500">
                <span>Who we hope to work with</span>
              </div>
              <div className="hidden h-px flex-1 bg-gradient-to-r from-white/10 via-white/5 to-transparent sm:block" />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {WISHLIST.map(({ label, icon: Icon }, i) => (
                <motion.span
                  key={label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: ease.out, delay: 0.4 + i * 0.07 }}
                  className="group relative inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-slate-300 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-white/[0.06] hover:text-white"
                >
                  <span className="grid h-4 w-4 place-items-center rounded-full bg-gradient-to-br from-primary/25 to-secondary/15 text-primary">
                    <Icon className="h-2.5 w-2.5" />
                  </span>
                  {label}
                </motion.span>
              ))}

              <Link
                to="/book-demo"
                className="group inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-1 text-[11px] font-semibold text-primary transition-colors duration-300 hover:text-white"
              >
                + you?
                <ArrowUpRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>
          </motion.div>
        </motion.div>

        {/* Right - Dashboard mockup */}
        <motion.div
          className="lg:col-span-6"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: ease.out, delay: 0.25 }}
        >
          <DashboardMock />
        </motion.div>
      </div>
    </section>
  );
}
