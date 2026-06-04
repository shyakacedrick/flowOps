import { Link } from 'react-router-dom';
import DashboardMock from './DashboardMock.jsx';
import { motion } from 'framer-motion';
import { ease, staggerContainer, staggerItem } from '../animations/motion';

export default function Hero() {
  return (
    <section id="hero" className="relative overflow-hidden bg-radial pt-40 lg:pt-20">
      {/* Grid backdrop */}
      <div className="pointer-events-none absolute inset-0 bg-grid-faint [background-size:48px_48px] opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />

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

          {/* trust strip */}
          <motion.div variants={staggerItem} className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 text-xs text-slate-500">
            <span className="uppercase tracking-widest">Trusted by</span>
            {['Clarity Clinics', 'NorthBank', 'Lumen Salons', 'Forge Diner'].map(
              (n) => (
                <span
                  key={n}
                  className="font-semibold text-slate-400/80 transition hover:text-slate-200"
                >
                  {n}
                </span>
              )
            )}
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
