import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { Navbar } from '@/components/Navbar';
import { renderWithProviders } from '@/test/utils';

describe('Navbar', () => {
  it('renders the brand name', () => {
    renderWithProviders(<Navbar onSignIn={vi.fn()} onSignOut={vi.fn()} />);
    expect(screen.getByText('The JonZone Tracker')).toBeInTheDocument();
  });

  it('shows sign-in button when no email provided', () => {
    renderWithProviders(<Navbar onSignIn={vi.fn()} onSignOut={vi.fn()} />);
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /sign out/i })).not.toBeInTheDocument();
  });

  it('shows user email and sign-out button when email provided', () => {
    renderWithProviders(
      <Navbar userEmail="user@example.com" onSignIn={vi.fn()} onSignOut={vi.fn()} />,
    );
    expect(screen.getByText('user@example.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /sign in/i })).not.toBeInTheDocument();
  });

  it('calls onSignIn when sign-in button is clicked', async () => {
    const onSignIn = vi.fn();
    const { user } = renderWithProviders(<Navbar onSignIn={onSignIn} onSignOut={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: /sign in with google/i }));
    expect(onSignIn).toHaveBeenCalledTimes(1);
  });

  it('calls onSignOut when sign-out button is clicked', async () => {
    const onSignOut = vi.fn();
    const { user } = renderWithProviders(
      <Navbar userEmail="user@example.com" onSignIn={vi.fn()} onSignOut={onSignOut} />,
    );
    await user.click(screen.getByRole('button', { name: /sign out/i }));
    expect(onSignOut).toHaveBeenCalledTimes(1);
  });
});
