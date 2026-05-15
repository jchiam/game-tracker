import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { SelectionPage } from '@/pages/SelectionPage';
import { renderWithProviders, createMockSession } from '@/test/utils';

describe('SelectionPage', () => {
  it('shows loading state when isAuthLoading is true', () => {
    renderWithProviders(
      <SelectionPage session={null} isAuthLoading={true} signInWithGoogle={vi.fn()} />,
    );
    expect(screen.getByText(/checking authentication/i)).toBeInTheDocument();
  });

  it('does not render game cards while loading', () => {
    renderWithProviders(
      <SelectionPage session={null} isAuthLoading={true} signInWithGoogle={vi.fn()} />,
    );
    expect(screen.queryByText('Honkai Star Rail')).not.toBeInTheDocument();
  });

  it('renders game selection cards when not loading', () => {
    renderWithProviders(
      <SelectionPage session={null} isAuthLoading={false} signInWithGoogle={vi.fn()} />,
    );
    expect(screen.getByText('Honkai Star Rail')).toBeInTheDocument();
    expect(screen.getByText('Reverse: 1999')).toBeInTheDocument();
  });

  it('shows "Requires Login" badge when there is no session', () => {
    renderWithProviders(
      <SelectionPage session={null} isAuthLoading={false} signInWithGoogle={vi.fn()} />,
    );
    const badges = screen.getAllByText('Requires Login');
    expect(badges.length).toBe(3);
  });

  it('does not show "Requires Login" badge when session exists', () => {
    const session = createMockSession();
    renderWithProviders(
      <SelectionPage session={session} isAuthLoading={false} signInWithGoogle={vi.fn()} />,
    );
    expect(screen.queryByText('Requires Login')).not.toBeInTheDocument();
  });

  it('calls signInWithGoogle with the game path when card clicked without session', async () => {
    const signInWithGoogle = vi.fn();
    const { user } = renderWithProviders(
      <SelectionPage session={null} isAuthLoading={false} signInWithGoogle={signInWithGoogle} />,
    );
    const cards = screen.getAllByRole('button');
    await user.click(cards[0]);
    expect(signInWithGoogle).toHaveBeenCalledWith('/honkai-star-rail');
  });

  it('does not call signInWithGoogle when session exists', async () => {
    const session = createMockSession();
    const signInWithGoogle = vi.fn();
    const { user } = renderWithProviders(
      <SelectionPage session={session} isAuthLoading={false} signInWithGoogle={signInWithGoogle} />,
    );
    await user.click(screen.getAllByRole('button')[0]);
    expect(signInWithGoogle).not.toHaveBeenCalled();
  });

  it('renders game descriptions', () => {
    renderWithProviders(
      <SelectionPage session={null} isAuthLoading={false} signInWithGoogle={vi.fn()} />,
    );
    expect(screen.getByText(/track trailblazers/i)).toBeInTheDocument();
    expect(screen.getByText(/track arcanists/i)).toBeInTheDocument();
  });

  it('falls back to ui-avatars when a game card image fails to load', () => {
    renderWithProviders(
      <SelectionPage session={null} isAuthLoading={false} signInWithGoogle={vi.fn()} />,
    );
    const img = screen.getByAltText('Honkai Star Rail');
    fireEvent.error(img);
    expect(img).toHaveAttribute('src', expect.stringContaining('ui-avatars.com'));
  });
});
