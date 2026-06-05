import Logo from '@/shared/components/Logo.jsx';

const COLUMNS = [
  {
    title: 'Product',
    links: ['Features', 'Dashboard', 'Pricing', 'Changelog'],
  },
  {
    title: 'Company',
    links: ['About', 'Customers', 'Careers', 'Blog'],
  },
  {
    title: 'Resources',
    links: ['Docs', 'Support', 'API', 'Status'],
  },
];

function SocialIcon({ children, label }) {
  return (
    <a
      href="#"
      aria-label={label}
      className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/[0.02] text-slate-400 transition hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
    >
      {children}
    </a>
  );
}

export default function Footer() {
  return (
    <footer
      id="footer"
      className="relative border-t border-white/[0.06] bg-bg/60"
    >
      <div className="mx-auto w-full max-w-7xl px-6 py-16 sm:px-8 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-12">
          {/* Brand */}
          <div className="lg:col-span-5">
            <Logo />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
              Smart queue management and business intelligence for modern
              service businesses.
            </p>
            <div className="mt-6 flex items-center gap-2">
              <SocialIcon label="GitHub">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.55 0-.27-.01-1-.01-1.96-3.2.7-3.87-1.54-3.87-1.54-.52-1.33-1.27-1.69-1.27-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.34.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.04 0 0 .97-.31 3.18 1.18a11 11 0 015.79 0c2.21-1.49 3.18-1.18 3.18-1.18.62 1.58.23 2.75.11 3.04.73.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.41-5.26 5.69.41.36.78 1.06.78 2.14 0 1.55-.01 2.8-.01 3.18 0 .31.21.66.8.55C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z" />
                </svg>
              </SocialIcon>
              <SocialIcon label="X">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <path d="M18.244 2H21.5l-7.5 8.57L23 22h-6.844l-5.36-7.013L4.6 22H1.34l8.02-9.17L1 2h6.99l4.84 6.4L18.245 2zm-2.4 18h1.86L7.27 4H5.3l10.544 16z" />
                </svg>
              </SocialIcon>
              <SocialIcon label="LinkedIn">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.13 1 2.5 1s2.48 1.12 2.48 2.5zM.22 8h4.56v14H.22V8zm7.5 0h4.37v1.93h.06c.61-1.16 2.1-2.39 4.32-2.39 4.62 0 5.47 3.04 5.47 6.99V22h-4.56v-6.18c0-1.47-.03-3.37-2.05-3.37-2.06 0-2.37 1.61-2.37 3.27V22H7.72V8z" />
                </svg>
              </SocialIcon>
              <SocialIcon label="Contact">
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                  <path
                    d="M4 6h16v12H4z M4 6l8 7 8-7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                </svg>
              </SocialIcon>
            </div>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-7">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  {col.title}
                </p>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l}>
                      <a
                        href="#"
                        className="text-sm text-slate-400 transition hover:text-white"
                      >
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-3 border-t border-white/[0.06] pt-6 text-xs text-slate-500 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} FlowOps Inc. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <a href="#" className="hover:text-slate-300">
              Privacy
            </a>
            <a href="#" className="hover:text-slate-300">
              Terms
            </a>
            <a href="#" className="hover:text-slate-300">
              Security
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
