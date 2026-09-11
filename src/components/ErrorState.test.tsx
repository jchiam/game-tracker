import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorState } from '@/components/ErrorState';

describe('ErrorState', () => {
  it('renders the message inside an alert region', () => {
    render(<ErrorState message="Couldn't load your roster." onRetry={vi.fn()} />);
    expect(screen.getByRole('alert')).toHaveTextContent("Couldn't load your roster.");
  });

  it('renders a Retry button that invokes the handler', () => {
    const onRetry = vi.fn();
    render(<ErrorState message="Couldn't load your roster." onRetry={onRetry} />);
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders no button without a retry handler', () => {
    render(<ErrorState message="Something went wrong." />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong.');
  });

  it('accepts a custom action label', () => {
    render(<ErrorState message="Something went wrong." onRetry={vi.fn()} retryLabel="Reload" />);
    expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument();
  });

  it('hides the glyph from assistive tech', () => {
    const { container } = render(<ErrorState message="x" />);
    expect(container.querySelector('.error-state-glyph')).toHaveAttribute('aria-hidden', 'true');
  });

  it('uses the error-state class, never empty-state or loading-state', () => {
    const { container } = render(<ErrorState message="x" />);
    expect(container.querySelector('.error-state')).not.toBeNull();
    expect(container.querySelector('.empty-state')).toBeNull();
    expect(container.querySelector('.loading-state')).toBeNull();
  });
});
