import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { Reverse1999Page } from '@/pages/reverse1999/Reverse1999Page';
import { renderWithProviders, createMockSession } from '@/test/utils';
import type { R1999TrackedArcanist } from '@/types';

vi.mock('@/hooks/reverse1999/useArcanists', () => ({
  useArcanists: vi.fn(),
}));

import { useArcanists } from '@/hooks/reverse1999/useArcanists';

function makeArcanist(id: string, name: string): R1999TrackedArcanist {
  return {
    id,
    name,
    afflatus: 'Star',
    damageType: 'Mental',
    imageUrl: `/assets/${id}.webp`,
    isFavorited: false,
    level: 40,
    insightLevel: 2,
  };
}

const defaultArcanistsHook = {
  availableArcanists: [],
  trackedArcanists: [],
  isInitialLoad: false,
  pendingSaveCount: 0,
  addArcanist: vi.fn(),
  removeArcanist: vi.fn(),
  updateArcanistLevel: vi.fn(),
  updateInsightLevel: vi.fn(),
  toggleFavoriteArcanist: vi.fn(),
  getFilteredRoster: vi.fn().mockReturnValue([]),
};

describe('Reverse1999Page', () => {
  beforeEach(() => {
    vi.mocked(useArcanists).mockReturnValue(defaultArcanistsHook);
  });

  it('renders the page title', () => {
    renderWithProviders(
      <Reverse1999Page session={null} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    expect(screen.getByRole('heading', { name: /reverse: 1999 arcanists/i })).toBeInTheDocument();
  });

  it('shows "Authenticating..." while auth is loading', () => {
    renderWithProviders(<Reverse1999Page session={null} isAuthLoading={true} onSignIn={vi.fn()} />);
    expect(screen.getByText(/authenticating/i)).toBeInTheDocument();
  });

  it('shows AuthGate when there is no session', () => {
    renderWithProviders(
      <Reverse1999Page session={null} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument();
  });

  it('shows "Loading database sync..." during initial load with session', () => {
    vi.mocked(useArcanists).mockReturnValue({
      ...defaultArcanistsHook,
      isInitialLoad: true,
    });
    const session = createMockSession();
    renderWithProviders(
      <Reverse1999Page session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    expect(screen.getByText(/loading database sync/i)).toBeInTheDocument();
  });

  it('shows empty state when no arcanists are tracked', () => {
    const session = createMockSession();
    renderWithProviders(
      <Reverse1999Page session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    expect(screen.getByText(/no arcanists tracked yet/i)).toBeInTheDocument();
  });

  it('renders arcanist cards when arcanists are tracked', () => {
    const session = createMockSession();
    const arcanists = [makeArcanist('regulus', 'Regulus'), makeArcanist('vertin', 'Vertin')];
    vi.mocked(useArcanists).mockReturnValue({
      ...defaultArcanistsHook,
      trackedArcanists: arcanists,
      getFilteredRoster: vi.fn().mockReturnValue(arcanists),
    });
    renderWithProviders(
      <Reverse1999Page session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    expect(screen.getByText('Regulus')).toBeInTheDocument();
    expect(screen.getByText('Vertin')).toBeInTheDocument();
  });

  it('shows "no arcanists match your search" when search filters all out', () => {
    const session = createMockSession();
    vi.mocked(useArcanists).mockReturnValue({
      ...defaultArcanistsHook,
      trackedArcanists: [makeArcanist('regulus', 'Regulus')],
      getFilteredRoster: vi.fn().mockReturnValue([]),
    });
    renderWithProviders(
      <Reverse1999Page session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    expect(screen.getByText(/no arcanists match your search/i)).toBeInTheDocument();
  });

  it('shows the add arcanist button when session exists', () => {
    const session = createMockSession();
    renderWithProviders(
      <Reverse1999Page session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    expect(screen.getByTitle('Add Arcanist')).toBeInTheDocument();
  });

  it('opens AddArcanistModal when add button is clicked', () => {
    const session = createMockSession();
    renderWithProviders(
      <Reverse1999Page session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    fireEvent.click(screen.getByTitle('Add Arcanist'));
    expect(screen.getByRole('heading', { name: /add arcanist/i })).toBeInTheDocument();
  });

  it('shows SavingToast when pendingSaveCount > 0', () => {
    const session = createMockSession();
    vi.mocked(useArcanists).mockReturnValue({
      ...defaultArcanistsHook,
      pendingSaveCount: 1,
    });
    renderWithProviders(
      <Reverse1999Page session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('does not show the add button when there is no session', () => {
    renderWithProviders(
      <Reverse1999Page session={null} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    expect(screen.queryByTitle('Add Arcanist')).not.toBeInTheDocument();
  });

  // --- Search input wiring ---

  it('passes the typed search term to getFilteredRoster', () => {
    const session = createMockSession();
    const arcanists = [makeArcanist('regulus', 'Regulus')];
    const getFilteredRoster = vi.fn().mockReturnValue(arcanists);
    vi.mocked(useArcanists).mockReturnValue({
      ...defaultArcanistsHook,
      trackedArcanists: arcanists,
      getFilteredRoster,
    });
    renderWithProviders(
      <Reverse1999Page session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    fireEvent.change(screen.getByPlaceholderText(/search by name, afflatus/i), {
      target: { value: 'Vertin' },
    });
    expect(getFilteredRoster).toHaveBeenCalledWith('Vertin', expect.any(String));
  });
});
