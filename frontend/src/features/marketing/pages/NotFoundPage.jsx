import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-bg px-6 text-center text-slate-200">
      <div className="grid h-16 w-16 place-items-center rounded-2xl border border-white/10 bg-white/[0.03] text-slate-400">
        <span className="font-mono text-3xl font-bold text-slate-500">404</span>
      </div>
      <div className="max-w-sm">
        <h1 className="text-2xl font-bold text-white">Page not found</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          The page you are looking for does not exist or has been moved.
        </p>
      </div>
      <Link
        to="/"
        className="rounded-lg border border-primary/30 bg-primary/10 px-5 py-2.5 text-sm font-medium text-primary transition hover:bg-primary/20"
      >
        Back to home
      </Link>
    </div>
  );
}
