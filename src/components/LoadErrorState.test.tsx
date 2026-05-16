import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LoadErrorState } from '@/components/LoadErrorState';

describe('LoadErrorState', () => {
  it('renders error message', () => {
    render(<LoadErrorState onRetry={vi.fn()} />);
    expect(screen.getByText(/failed to load data/i)).toBeInTheDocument();
  });

  it('renders retry button', () => {
    render(<LoadErrorState onRetry={vi.fn()} />);
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('calls onRetry when retry button is clicked', () => {
    const onRetry = vi.fn();
    render(<LoadErrorState onRetry={onRetry} />);
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
