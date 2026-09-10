import { Component, type ErrorInfo, type ReactNode } from "react";
import { ErrorState } from "./Chrome";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("React application error", error, info.componentStack);
  }

  render() {
    return this.state.hasError ? <ErrorState message="Please refresh and try again." /> : this.props.children;
  }
}
