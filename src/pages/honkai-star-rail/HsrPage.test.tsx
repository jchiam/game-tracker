import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { HsrPage } from '@/pages/honkai-star-rail/HsrPage';
import { renderWithProviders, createMockSession } from '@/test/utils';
import type { HsrTrackedCharacter, HsrParty } from '@/types';

vi.mock('@/hooks/honkai-star-rail/useCharacters', () => ({
  useCharacters: vi.fn(),
  emptyRelic: { setId: null, mainStat: null, subStats: [] },
}));

vi.mock('@/hooks/honkai-star-rail/useParties', () => ({
  useParties: vi.fn(),
}));

import { useCharacters } from '@/hooks/honkai-star-rail/useCharacters';
import { useParties } from '@/hooks/honkai-star-rail/useParties';

const emptyPrefs: HsrTrackedCharacter['buildPreferences'] = {
  mainStats: { body: [], feet: [], sphere: [], rope: [] },
  subStats: [],
};

function makeChar(id: string, name: string): HsrTrackedCharacter {
  return {
    id,
    name,
    element: 'Thunder',
    path: 'Nihility',
    imageUrl: `/assets/${id}.webp`,
    isFavorited: false,
    level: 60,
    tracesAttained: false,
    relics: { head: null, hands: null, body: null, feet: null, sphere: null, rope: null },
    buildPreferences: emptyPrefs,
  };
}

function makeParty(id: string, name: string): HsrParty {
  return {
    id,
    profileId: 'user-1',
    name,
    notes: null,
    members: [],
    createdAt: new Date().toISOString(),
  };
}

const defaultCharactersHook = {
  availableCharacters: [],
  availableRelicSets: [],
  trackedCharacters: [],
  isInitialLoad: false,
  pendingSaveCount: 0,
  addCharacter: vi.fn(),
  removeCharacter: vi.fn(),
  updateCharacterLevel: vi.fn(),
  toggleCharacterTraces: vi.fn(),
  toggleFavoriteCharacter: vi.fn(),
  saveRelicData: vi.fn(),
  removeRelicData: vi.fn(),
  saveBuildPreferences: vi.fn(),
  getFilteredRoster: vi.fn().mockReturnValue([]),
};

const defaultPartiesHook = {
  parties: [],
  isLoading: false,
  saveParty: vi.fn().mockResolvedValue(null),
  deleteParty: vi.fn().mockResolvedValue(true),
  refreshParties: vi.fn(),
};

describe('HsrPage', () => {
  beforeEach(() => {
    vi.mocked(useCharacters).mockReturnValue(defaultCharactersHook);
    vi.mocked(useParties).mockReturnValue(defaultPartiesHook);
  });

  it('shows "Authenticating..." while auth is loading', () => {
    renderWithProviders(<HsrPage session={null} isAuthLoading={true} onSignIn={vi.fn()} />);
    expect(screen.getByText(/authenticating/i)).toBeInTheDocument();
  });

  it('shows AuthGate when there is no session', () => {
    renderWithProviders(<HsrPage session={null} isAuthLoading={false} onSignIn={vi.fn()} />);
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument();
  });

  it('shows "Loading database sync..." during initial load with session', () => {
    vi.mocked(useCharacters).mockReturnValue({
      ...defaultCharactersHook,
      isInitialLoad: true,
    });
    const session = createMockSession();
    renderWithProviders(<HsrPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    expect(screen.getByText(/loading database sync/i)).toBeInTheDocument();
  });

  it('shows empty state when no characters are tracked', () => {
    const session = createMockSession();
    renderWithProviders(<HsrPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    expect(screen.getByText(/no characters tracked yet/i)).toBeInTheDocument();
  });

  it('renders character cards when characters are tracked', () => {
    const session = createMockSession();
    const chars = [makeChar('acheron', 'Acheron'), makeChar('blade', 'Blade')];
    vi.mocked(useCharacters).mockReturnValue({
      ...defaultCharactersHook,
      trackedCharacters: chars,
      getFilteredRoster: vi.fn().mockReturnValue(chars),
    });
    renderWithProviders(<HsrPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    expect(screen.getByText('Acheron')).toBeInTheDocument();
    expect(screen.getByText('Blade')).toBeInTheDocument();
  });

  it('shows "no characters match your search" when search filters all out', () => {
    const session = createMockSession();
    vi.mocked(useCharacters).mockReturnValue({
      ...defaultCharactersHook,
      trackedCharacters: [makeChar('acheron', 'Acheron')],
      getFilteredRoster: vi.fn().mockReturnValue([]), // search filters all out
    });
    renderWithProviders(<HsrPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    expect(screen.getByText(/no characters match your search/i)).toBeInTheDocument();
  });

  it('shows the add character button when session exists', () => {
    const session = createMockSession();
    renderWithProviders(<HsrPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    expect(screen.getByTitle('Add Character')).toBeInTheDocument();
  });

  it('opens AddCharacterModal when add button is clicked', () => {
    const session = createMockSession();
    renderWithProviders(<HsrPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    fireEvent.click(screen.getByTitle('Add Character'));
    expect(screen.getByRole('heading', { name: /add character/i })).toBeInTheDocument();
  });

  it('switches to Parties tab when Parties button is clicked', () => {
    const session = createMockSession();
    renderWithProviders(<HsrPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /parties/i }));
    // PartiesTab is now visible (shows empty parties state)
    expect(screen.getByText(/no parties configured/i)).toBeInTheDocument();
  });

  it('shows parties in the Parties tab when they exist', () => {
    const session = createMockSession();
    vi.mocked(useParties).mockReturnValue({
      ...defaultPartiesHook,
      parties: [makeParty('p1', 'Alpha Team'), makeParty('p2', 'Beta Team')],
    });
    renderWithProviders(<HsrPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /parties/i }));
    expect(screen.getByText('Alpha Team')).toBeInTheDocument();
    expect(screen.getByText('Beta Team')).toBeInTheDocument();
  });

  it('shows SavingToast when pendingSaveCount > 0', () => {
    const session = createMockSession();
    vi.mocked(useCharacters).mockReturnValue({
      ...defaultCharactersHook,
      pendingSaveCount: 2,
    });
    renderWithProviders(<HsrPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders the page title', () => {
    renderWithProviders(<HsrPage session={null} isAuthLoading={false} onSignIn={vi.fn()} />);
    expect(screen.getByRole('heading', { name: /honkai star rail tracker/i })).toBeInTheDocument();
  });
});
