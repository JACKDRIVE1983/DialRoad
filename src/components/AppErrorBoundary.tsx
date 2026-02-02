import React from "react";

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  message?: string;
};

export class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: unknown): State {
    const message = error instanceof Error ? error.message : String(error);
    return { hasError: true, message };
  }

  componentDidCatch(error: unknown, errorInfo: React.ErrorInfo) {
    // This will show up in the browser console and helps pinpoint the failing component tree.
    console.error("[AppErrorBoundary] Caught error:", error);
    console.error("[AppErrorBoundary] Component stack:\n", errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-xl border border-border bg-card p-5">
            <h1 className="text-xl font-display font-bold">Errore di caricamento</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Si è verificato un errore runtime. Apri la console per vedere lo stack dei componenti.
            </p>
            {this.state.message && (
              <pre className="mt-3 text-xs whitespace-pre-wrap break-words rounded-md bg-muted p-3">
                {this.state.message}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
