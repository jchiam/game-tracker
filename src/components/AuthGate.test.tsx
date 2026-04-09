import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthGate } from '@/components/AuthGate';

describe('AuthGate', () => {
  it('renders a welcome heading', () => {
    render(<AuthGate onSignIn={vi.fn()} />);
    expect(screen.getByRole('heading')).toBeInTheDocument();
  });

  it('renders a sign-in button', () => {
    render(<AuthGate onSignIn={vi.fn()} />);
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument();
  });

  it('calls onSignIn when the button is clicked', async () => {
    const onSignIn = vi.fn();
    const user = userEvent.setup();
    render(<AuthGate onSignIn={onSignIn} />);
    await user.click(screen.getByRole('button', { name: /sign in with google/i }));
    expect(onSignIn).toHaveBeenCalledTimes(1);
  });
});
