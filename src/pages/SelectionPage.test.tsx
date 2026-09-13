import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { SelectionPage } from '@/pages/SelectionPage';
import { renderWithProviders, createMockSession } from '@/test/utils';
import { GAMES } from '@/lib/games';
import { MODALITIES, gamesByModality } from '@/lib/modalities';

describe('SelectionPage', () => {
  it('shows loading state when isAuthLoading is true', () => {
    renderWithProviders(
      <SelectionPage session={null} isAuthLoading={true} signInWithGoogle={vi.fn()} />,
    );
    expect(screen.getByText(/checking sign-in/i)).toBeInTheDocument();
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
    expect(badges.length).toBe(GAMES.length);
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

  it('renders the tracker-neutral hero', () => {
    renderWithProviders(
      <SelectionPage session={null} isAuthLoading={false} signInWithGoogle={vi.fn()} />,
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Your Trackers');
    expect(screen.getByText('Pick something to track.')).toBeInTheDocument();
  });

  it('renders one section per populated modality, in modality order', () => {
    const { container } = renderWithProviders(
      <SelectionPage
        session={createMockSession()}
        isAuthLoading={false}
        signInWithGoogle={vi.fn()}
      />,
    );
    const groups = gamesByModality();
    const sections = container.querySelectorAll('.selection-section');
    expect(sections.length).toBe(groups.length);
    groups.forEach((group, i) => {
      const section = sections[i];
      expect(section.querySelector('.selection-section-title')).toHaveTextContent(
        group.modality.title,
      );
      expect(section.querySelector('.selection-section-subtitle')).toHaveTextContent(
        group.modality.subtitle,
      );
      const names = Array.from(section.querySelectorAll('.game-name')).map((n) => n.textContent);
      expect(names).toEqual(group.games.map((g) => g.name));
    });
  });

  it('uses one h2 per section and none for the cards', () => {
    renderWithProviders(
      <SelectionPage session={null} isAuthLoading={false} signInWithGoogle={vi.fn()} />,
    );
    const h2s = screen.getAllByRole('heading', { level: 2 });
    expect(h2s.map((h) => h.textContent)).toEqual(gamesByModality().map((g) => g.modality.title));
    expect(h2s.length).toBeLessThanOrEqual(MODALITIES.length);
    expect(screen.getAllByRole('heading', { level: 3 }).length).toBe(GAMES.length);
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
