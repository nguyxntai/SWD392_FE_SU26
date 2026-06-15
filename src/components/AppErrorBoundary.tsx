import { Component, ErrorInfo, ReactNode } from "react";

type AppErrorBoundaryProps = {
  children: ReactNode;
};

type AppErrorBoundaryState = {
  error: Error | null;
};

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    error: null,
  };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("App render error:", error, errorInfo);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-muted/30 p-6 text-foreground">
          <div className="mx-auto max-w-2xl rounded-2xl border border-destructive/20 bg-background p-6 shadow-sm">
            <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Application Error</p>
            <h1 className="mt-2 text-2xl font-bold text-destructive">This page could not be rendered.</h1>
            <p className="mt-3 text-sm text-muted-foreground">{this.state.error.message}</p>
            <button
              onClick={() => window.location.assign("/pos")}
              className="mt-6 rounded-xl bg-primary px-4 py-3 font-bold text-primary-foreground"
            >
              Back to POS
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
