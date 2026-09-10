import { Component, type ErrorInfo, type ReactNode } from "react";
import { siteConfig } from "@/config";

type AppErrorBoundaryProps = {
  children: ReactNode;
};

type AppErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[SKB React] Application rendering failed", error, info);
  }

  private reloadApp = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="migration-shell" role="alert">
        <section className="migration-card">
          <p className="eyebrow">Something needs attention</p>
          <h1>
            We hit a temporary <em>roadblock.</em>
          </h1>
          <p>
            The booking platform could not finish loading this page. Please
            reload once, or call our travel desk directly.
          </p>
          <div className="actions">
            <button className="primary-action" type="button" onClick={this.reloadApp}>
              Reload page
            </button>
            <a
              className="secondary-action"
              href={`tel:${siteConfig.contact.phone}`}
            >
              Call {siteConfig.contact.phoneDisplay}
            </a>
          </div>
          {import.meta.env.DEV && this.state.error ? (
            <pre className="error-details">{this.state.error.message}</pre>
          ) : null}
        </section>
      </main>
    );
  }
}
