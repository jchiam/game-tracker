import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingState } from '@/components/LoadingState';

describe('LoadingState', () => {
  it('renders the label inside a polite status region', () => {
    render(<LoadingState label="Loading your roster…" />);
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Loading your roster…');
    expect(status).toHaveAttribute('aria-live', 'polite');
  });

  it('renders three spinner dots hidden from assistive tech', () => {
    const { container } = render(<LoadingState label="Loading…" />);
    const dots = container.querySelector('.loading-state-dots');
    expect(dots).toHaveAttribute('aria-hidden', 'true');
    expect(dots?.querySelectorAll('.spinner-dot')).toHaveLength(3);
  });

  it('does not use the empty-state class', () => {
    const { container } = render(<LoadingState label="Loading…" />);
    expect(container.querySelector('.empty-state')).toBeNull();
    expect(container.querySelector('.loading-state')).not.toBeNull();
  });
});
