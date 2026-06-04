import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronDown,
  Menu as MenuIcon,
  X as XIcon,
  // Product
  ListOrdered,
  Radio,
  Timer,
  BarChart3,
  Flame,
  Sparkles,
  PlayCircle,
  // Solutions — industries
  Stethoscope,
  Scissors,
  Landmark,
  Utensils,
  Briefcase,
  // Solutions — use cases
  Hourglass,
  Gauge,
  Activity,
  Users,
  // Resources
  BookOpen,
  HelpCircle,
  Newspaper,
  Map as MapIcon,
  Mail,
  Info,
  ArrowRight,
} from 'lucide-react';
import Logo from './Logo.jsx';
import { Link } from 'react-router-dom';
import { ease } from '../animations/motion';
import { useActiveSection } from '../hooks/useActiveSection';

/* ──────────────────────────── Mega menu data ──────────────────────────── */
/* Every item maps to an in-page section anchor — single-page SaaS IA.    */

const PRODUCT_GROUPS = [
  {
    title: 'Core System',
    items: [
      { icon: ListOrdered, title: 'Smart Queue System',  desc: 'Digital tickets, smart routing, zero paper.', href: '#product' },
      { icon: Radio,       title: 'Live Queue Tracking', desc: 'Real-time status across every screen.',       href: '#demo' },
      { icon: Timer,       title: 'Wait Time Estimation',desc: 'Accurate ETAs powered by live data.',          href: '#product' },
    ],
  },
  {
    title: 'Intelligence Layer',
    items: [
      { icon: BarChart3, title: 'Analytics Dashboard',  desc: 'KPIs, trends and SLAs at a glance.',           href: '#features' },
      { icon: Flame,     title: 'Peak Hour Detection',  desc: 'Spot demand spikes before they hit.',          href: '#features' },
      { icon: Sparkles,  title: 'Smart Insights',       desc: 'Actionable recommendations, automatically.',   href: '#insights' },
    ],
  },
];

const SOLUTIONS = {
  industries: [
    { icon: Stethoscope, title: 'Clinics & Hospitals',    desc: 'Triage, exam rooms & multi-dept flow.', href: '#solutions' },
    { icon: Scissors,    title: 'Salons & Barbershops',   desc: 'Appointments and walk-in balance.',     href: '#solutions' },
    { icon: Landmark,    title: 'Banks',                  desc: 'Counter routing and KYC workflows.',    href: '#solutions' },
    { icon: Utensils,    title: 'Restaurants',            desc: 'Waitlists and table-turnover insights.', href: '#solutions' },
    { icon: Briefcase,   title: 'Government Offices',     desc: 'Visitor check-in and SLA tracking.',    href: '#solutions' },
  ],
  useCases: [
    { icon: Hourglass, title: 'Reduce Waiting Times',     desc: 'Cut average waits by up to 60%.',       href: '#solutions' },
    { icon: Gauge,     title: 'Improve Efficiency',       desc: 'Smarter routing per counter.',          href: '#solutions' },
    { icon: Activity,  title: 'Track Customer Flow',      desc: 'Live visibility into every minute.',    href: '#demo' },
    { icon: Users,     title: 'Optimize Staffing',        desc: 'Forecast demand and schedule smarter.', href: '#insights' },
  ],
};

const RESOURCES = {
  learn: [
    { icon: BookOpen,    title: 'Documentation', desc: 'Guides, APIs and reference.',  href: '#features' },
    { icon: PlayCircle,  title: 'Product Demo',  desc: 'See FlowOps in 3 minutes.',    href: '#demo' },
    { icon: HelpCircle,  title: 'FAQ',           desc: 'Answers to common questions.', href: '#faq' },
    { icon: Newspaper,   title: 'Blog',          desc: 'Operations insights and stories.', href: '#footer' },
  ],
  company: [
    { icon: MapIcon, title: 'Roadmap',        desc: "What we're shipping next.", href: '#roadmap' },
    { icon: Mail,    title: 'Contact',        desc: 'Talk to our team.',         href: '#footer' },
    { icon: Info,    title: 'About FlowOps',  desc: 'Our mission and team.',     href: '#about' },
  ],
};

/* ──────────────────────────── Reusable bits ──────────────────────────── */

function MenuCard({ icon: Icon, title, desc, href = '#', soon, onClick }) {
  return (
    <a
      href={href}
      onClick={onClick}
      className="group relative flex items-start gap-3 rounded-xl border border-transparent p-3 transition-colors duration-200 hover:border-white/[0.08] hover:bg-white/[0.04]"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-gradient-to-br from-primary/15 to-secondary/10 text-primary transition-all duration-200 group-hover:border-primary/30 group-hover:from-primary/25 group-hover:to-secondary/20 group-hover:text-white group-hover:shadow-glow">
        <Icon className="h-4 w-4" strokeWidth={2} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">{title}</span>
          {soon && (
            <span className="rounded-full border border-secondary/30 bg-secondary/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-secondary">
              Soon
            </span>
          )}
        </span>
        <span className="mt-0.5 block text-xs leading-snug text-slate-400">
          {desc}
        </span>
      </span>
      <ArrowRight className="mt-2 h-3.5 w-3.5 -translate-x-1 text-slate-600 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:text-primary group-hover:opacity-100" />
    </a>
  );
}

function GroupHeading({ children }) {
  return (
    <h4 className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
      {children}
    </h4>
  );
}

function PanelShell({ children, className = '' }) {
  return (
    <div
      className={`pointer-events-auto relative overflow-hidden rounded-3xl border border-white/[0.08] bg-slate-950/90 shadow-2xl shadow-black/40 backdrop-blur-2xl ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent" />
      <div className="relative">{children}</div>
    </div>
  );
}

/* ──────────────────────────── Panels ──────────────────────────── */

function ProductPanel({ onItem }) {
  return (
    <PanelShell className="w-[min(64rem,92vw)]">
      <div className="grid grid-cols-12 gap-0">
        <div className="col-span-12 grid grid-cols-1 gap-6 p-7 sm:grid-cols-2 lg:col-span-8 lg:p-8">
          {PRODUCT_GROUPS.map((g) => (
            <div key={g.title}>
              <GroupHeading>{g.title}</GroupHeading>
              <div className="space-y-1">
                {g.items.map((it) => (
                  <MenuCard key={it.title} {...it} onClick={onItem} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="relative col-span-12 overflow-hidden border-t border-white/[0.06] bg-gradient-to-br from-primary/[0.08] via-slate-900/40 to-secondary/[0.06] p-7 lg:col-span-4 lg:border-l lg:border-t-0 lg:p-8">
          <div className="pointer-events-none absolute -top-24 -right-16 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-primary">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              FlowOps Live
            </span>
            <h3 className="mt-4 text-lg font-bold leading-tight text-white">
              See how queues move in real time.
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              An always-on simulation of the operations console, driven by a
              live event engine.
            </p>
            <a
              href="#demo"
              onClick={onItem}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-white shadow-glow transition-all hover:bg-blue-500 hover:shadow-glow-lg"
            >
              <PlayCircle className="h-4 w-4" />
              Scroll to demo
            </a>
          </div>
        </div>
      </div>
    </PanelShell>
  );
}

function SolutionsPanel({ onItem }) {
  return (
    <PanelShell className="w-[min(60rem,92vw)]">
      <div className="grid gap-0 p-7 sm:grid-cols-2 lg:p-8">
        <div className="sm:pr-6">
          <GroupHeading>Industries</GroupHeading>
          <div className="space-y-1">
            {SOLUTIONS.industries.map((i) => (
              <MenuCard key={i.title} {...i} onClick={onItem} />
            ))}
          </div>
        </div>
        <div className="mt-6 border-t border-white/[0.06] pt-6 sm:mt-0 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
          <GroupHeading>Use Cases</GroupHeading>
          <div className="space-y-1">
            {SOLUTIONS.useCases.map((i) => (
              <MenuCard key={i.title} {...i} onClick={onItem} />
            ))}
          </div>
        </div>
      </div>
    </PanelShell>
  );
}

function ResourcesPanel({ onItem }) {
  return (
    <PanelShell className="w-[min(62rem,92vw)]">
      <div className="grid grid-cols-12 gap-0">
        <div className="col-span-12 grid grid-cols-1 gap-6 p-7 sm:grid-cols-2 lg:col-span-8 lg:p-8">
          <div>
            <GroupHeading>Learn</GroupHeading>
            <div className="space-y-1">
              {RESOURCES.learn.map((i) => (
                <MenuCard key={i.title} {...i} onClick={onItem} />
              ))}
            </div>
          </div>
          <div>
            <GroupHeading>Company</GroupHeading>
            <div className="space-y-1">
              {RESOURCES.company.map((i) => (
                <MenuCard key={i.title} {...i} onClick={onItem} />
              ))}
            </div>
          </div>
        </div>

        <div className="relative col-span-12 overflow-hidden border-t border-white/[0.06] bg-gradient-to-br from-secondary/[0.08] via-slate-900/40 to-primary/[0.06] p-7 lg:col-span-4 lg:border-l lg:border-t-0 lg:p-8">
          <div className="pointer-events-none absolute -top-24 -right-16 h-56 w-56 rounded-full bg-secondary/20 blur-3xl" />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-secondary">
              Why FlowOps?
            </span>
            <p className="mt-4 text-sm leading-relaxed text-slate-300">
              FlowOps turns customer waiting into{' '}
              <span className="font-semibold text-white">
                actionable operational intelligence
              </span>
              .
            </p>
            <a
              href="#about"
              onClick={onItem}
              className="mt-5 inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-semibold text-white transition-all hover:border-secondary/30 hover:bg-secondary/10 hover:shadow-glow-cyan"
            >
              Learn More
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    </PanelShell>
  );
}

/* ──────────────────────────── Nav config ──────────────────────────── */

const MENUS = {
  product:   { label: 'Product',   Panel: ProductPanel,   sectionIds: ['product', 'features', 'insights', 'demo'] },
  solutions: { label: 'Solutions', Panel: SolutionsPanel, sectionIds: ['solutions'] },
  resources: { label: 'Resources', Panel: ResourcesPanel, sectionIds: ['roadmap', 'faq', 'footer'] },
};

const SIMPLE_LINKS = [
  { key: 'pricing', label: 'Pricing', href: '#pricing', sectionIds: ['pricing'] },
  { key: 'about',   label: 'About',   href: '#about',   sectionIds: ['about'] },
];

const SPY_IDS = [
  'hero', 'about', 'features', 'product', 'insights', 'demo',
  'solutions', 'roadmap', 'pricing', 'faq', 'cta', 'footer',
];

/* ──────────────────────────── Mobile bits ──────────────────────────── */

function MobileAccordion({ label, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-white/[0.05] last:border-b-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-1 py-3.5 text-left"
      >
        <span className="text-sm font-semibold text-white">{label}</span>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: ease.out }}
            className="overflow-hidden"
          >
            <div className="pb-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MobileGroup({ title, items, onItem }) {
  return (
    <div className="mt-2">
      <p className="px-1 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
        {title}
      </p>
      <div className="space-y-1">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <a
              key={it.title}
              href={it.href || '#'}
              onClick={onItem}
              className="flex items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-white/[0.04]"
            >
              <span className="grid h-8 w-8 place-items-center rounded-md border border-white/10 bg-white/[0.03] text-primary">
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 text-sm text-white">
                  {it.title}
                </span>
                <span className="block text-[11px] text-slate-500">{it.desc}</span>
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}

/* ──────────────────────────── Navbar ──────────────────────────── */

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeTimer = useRef(null);

  const activeSection = useActiveSection(SPY_IDS);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setActive(null);
        setMobileOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const openMenu = (key) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setActive(key);
  };
  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setActive(null), 120);
  };
  const closeAll = () => {
    setActive(null);
    setMobileOpen(false);
  };

  const ActivePanel = active ? MENUS[active].Panel : null;
  const isMenuActive = (sectionIds = []) => sectionIds.includes(activeSection);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled || active
            ? 'border-b border-white/[0.06] bg-bg/75 backdrop-blur-xl'
            : 'border-b border-transparent'
        }`}
        onMouseLeave={scheduleClose}
      >
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-3.5 sm:px-8 lg:px-12">
          <a href="#hero" aria-label="FlowOps home" className="shrink-0" onClick={closeAll}>
            <Logo />
          </a>

          <nav className="hidden items-center gap-1 lg:flex">
            {Object.entries(MENUS).map(([key, { label, sectionIds }]) => {
              const isOpen = active === key;
              const spy = isMenuActive(sectionIds);
              return (
                <button
                  key={key}
                  onMouseEnter={() => openMenu(key)}
                  onFocus={() => openMenu(key)}
                  onClick={() => setActive(isOpen ? null : key)}
                  aria-expanded={isOpen}
                  aria-haspopup="true"
                  className={`group relative inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isOpen || spy ? 'text-white' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {label}
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-slate-500 transition-transform duration-200 group-hover:text-slate-300 ${
                      isOpen ? 'rotate-180 text-white' : ''
                    }`}
                  />
                  {spy && !isOpen && (
                    <motion.span
                      layoutId="nav-active-underline"
                      className="absolute inset-x-3 bottom-1 h-0.5 rounded-full bg-gradient-to-r from-primary to-secondary"
                      transition={{ duration: 0.35, ease: ease.out }}
                    />
                  )}
                </button>
              );
            })}
            {SIMPLE_LINKS.map((l) => {
              const spy = isMenuActive(l.sectionIds);
              return (
                <a
                  key={l.key}
                  href={l.href}
                  onMouseEnter={scheduleClose}
                  className={`relative rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    spy ? 'text-white' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {l.label}
                  {spy && (
                    <motion.span
                      layoutId="nav-active-underline"
                      className="absolute inset-x-3 bottom-1 h-0.5 rounded-full bg-gradient-to-r from-primary to-secondary"
                      transition={{ duration: 0.35, ease: ease.out }}
                    />
                  )}
                </a>
              );
            })}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <Link
              to="/login"
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:text-white"
            >
              Login
            </Link>
            <motion.div
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.15, ease: ease.out }}
              className="inline-block"
            >
              <Link
                to="/signup"
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-glow hover:bg-blue-500 hover:shadow-glow-lg"
              >
                Get Started
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </motion.div>
          </div>

          <button
            aria-label="Toggle menu"
            onClick={() => setMobileOpen((o) => !o)}
            className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 text-slate-200 lg:hidden"
          >
            {mobileOpen ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>

        {/* Desktop mega menu */}
        <div
          className="pointer-events-none absolute left-0 right-0 top-full hidden justify-center px-6 lg:flex"
          onMouseEnter={() => active && openMenu(active)}
          onMouseLeave={scheduleClose}
        >
          <AnimatePresence mode="wait">
            {active && ActivePanel && (
              <motion.div
                key={active}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: ease.out }}
                className="mt-2"
              >
                <ActivePanel onItem={closeAll} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.25, ease: ease.out }}
              className="absolute inset-x-3 top-20 max-h-[80vh] overflow-y-auto rounded-2xl border border-white/[0.08] bg-slate-950/95 p-5 backdrop-blur-2xl"
            >
              <MobileAccordion label="Product" defaultOpen>
                {PRODUCT_GROUPS.map((g) => (
                  <MobileGroup key={g.title} title={g.title} items={g.items} onItem={closeAll} />
                ))}
              </MobileAccordion>
              <MobileAccordion label="Solutions">
                <MobileGroup title="Industries" items={SOLUTIONS.industries} onItem={closeAll} />
                <MobileGroup title="Use Cases" items={SOLUTIONS.useCases} onItem={closeAll} />
              </MobileAccordion>
              <MobileAccordion label="Resources">
                <MobileGroup title="Learn" items={RESOURCES.learn} onItem={closeAll} />
                <MobileGroup title="Company" items={RESOURCES.company} onItem={closeAll} />
              </MobileAccordion>

              <div className="mt-2 border-t border-white/[0.05] pt-2">
                {SIMPLE_LINKS.map((l) => (
                  <a
                    key={l.key}
                    href={l.href}
                    onClick={closeAll}
                    className="flex items-center justify-between px-1 py-3.5"
                  >
                    <span className="text-sm font-semibold text-white">{l.label}</span>
                    <ArrowRight className="h-4 w-4 text-slate-500" />
                  </a>
                ))}
              </div>

              <div className="mt-4 flex gap-2">
                <Link
                  to="/login"
                  onClick={closeAll}
                  className="flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-center text-sm font-semibold text-white"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  onClick={closeAll}
                  className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-center text-sm font-semibold text-white shadow-glow"
                >
                  Get Started
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
