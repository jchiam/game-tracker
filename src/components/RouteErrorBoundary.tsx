import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ErrorState } from '@/components/ErrorState';

interface RouteErrorBoundaryProps {
  children: ReactNode;
}

interface RouteErrorBoundaryState {
  hasError: boolean;
}

/**
 * Route-level error boundary wrapping the lazy route Suspense. React only
 * supports error boundaries as class components, so this is the one class in
 * `src/` — everything else stays functional.
 *
 * The dominant cause is a stale chunk hash after a deploy, so recovery is a
 * document reload (a re-render would refetch the same missing chunk). Rendered
 * inside the layout so the navbar and toasts stay mounted above it.
 */
export class RouteErrorBoundary extends Component<
  RouteErrorBoundaryProps,
  RouteErrorBoundaryState
> {
  state: RouteErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): RouteErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Route render failed:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorState
          message="Something went wrong loading this page."
          retryLabel="Reload"
          onRetry={() => window.location.reload()}
        />
      );
    }
    return this.props.children;
  }
}
