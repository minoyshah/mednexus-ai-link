import { Component, type ReactNode } from "react";

/**
 * Last-resort error boundary at the app root. A production (App Store) build
 * must never white-screen: any uncaught render error lands here with a
 * friendly recovery path instead. Kept dependency-free so it can never be
 * taken down by the thing it guards.
 */
export class AppErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    // Hook for crash reporting (Sentry etc.) — logged for now.
    console.error("Uncaught app error:", error);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background px-8 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-2xl" aria-hidden>
          🔧
        </span>
        <h1 className="text-xl font-extrabold tracking-tight text-foreground">
          Something went wrong
        </h1>
        <p className="max-w-[32ch] text-sm font-medium text-muted-foreground">
          An unexpected error occurred. Your jobs and payments are safe — reload to
          pick up where you left off.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 h-11 rounded-2xl bg-primary px-6 text-sm font-bold text-primary-foreground active:scale-[0.98]"
        >
          Reload Aquilla
        </button>
      </div>
    );
  }
}
