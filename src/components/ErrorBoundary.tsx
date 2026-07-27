import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

// Root-level safety net. Without this, any uncaught render error anywhere in
// the tree (malformed AI response, malformed shared-plan data, anything)
// white-screens the whole app with no way back except manually retyping the
// URL. This catches it and offers a way home instead.
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled render error:", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4 text-center">
          <p className="font-serif text-2xl font-bold text-foreground">Something went wrong</p>
          <p className="text-sm text-muted-foreground max-w-sm">
            This page hit an unexpected error. Your other plans and data are safe. Try heading back home.
          </p>
          <button
            onClick={this.handleReset}
            className="px-5 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Back to home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
