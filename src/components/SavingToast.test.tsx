import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SavingToast } from '@/components/SavingToast';

describe('SavingToast', () => {
  it('renders nothing when visible is false', () => {
    const { container } = render(<SavingToast visible={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the saving indicator when visible is true', () => {
    render(<SavingToast visible={true} />);
    expect(screen.getByText(/saving/i)).toBeInTheDocument();
  });

  it('has a status role for screen readers', () => {
    render(<SavingToast visible={true} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
