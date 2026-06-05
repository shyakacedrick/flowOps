import { Component } from 'react';

/**
 * Top-level error boundary. Catches any runtime error in the tree below it
 * and renders a recovery screen instead of a blank white page.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // In production you would forward to an error-reporting service here.
    if (typeof console !== 'undefined') {
      console.error('[FlowOps] Uncaught error:', error, info.componentStack);
    }
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-bg px-6 text-center text-slate-200">
          <div className="grid h-16 w-16 place-items-center rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
          </div>
          <div className="max-w-sm">
            <h1 className="text-xl font-bold text-white">Something went wrong</h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              An unexpected error occurred. You can try refreshing the page, or
              click below to reload the application.
            </p>
            {this.state.error.message && (
              <pre className="mt-3 max-h-24 overflow-auto rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-left font-mono text-[11px] text-rose-300">
                {this.state.error.message}
              </pre>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={this.handleReset}
              className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:text-white"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/20"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
