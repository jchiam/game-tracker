import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';

function Boom(): never {
  throw new Error('chunk failed');
}

describe('RouteErrorBoundary', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children when nothing throws', () => {
    render(
      <RouteErrorBoundary>
        <p>Page content</p>
      </RouteErrorBoundary>,
    );
    expect(screen.getByText('Page content')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('renders the error surface with a Reload action when a child throws', () => {
    render(
      <RouteErrorBoundary>
        <Boom />
      </RouteErrorBoundary>,
    );
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Something went wrong loading this page.');
    expect(alert).toHaveClass('error-state');
    expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument();
  });

  it('reloads the document when Reload is activated', () => {
    const reload = vi.fn();
    vi.stubGlobal('location', { ...window.location, reload });
    render(
      <RouteErrorBoundary>
        <Boom />
      </RouteErrorBoundary>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Reload' }));
    expect(reload).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });
});
