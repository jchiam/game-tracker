import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { N2ePage } from '@/pages/neverness-to-everness/N2ePage';
import { renderWithProviders, createMockSession } from '@/test/utils';
import type { N2ETrackedCharacter, N2EParty } from '@/types';

vi.mock('@/hooks/neverness-to-everness/useCharacters', () => ({
  useCharacters: vi.fn(),
}));

vi.mock('@/hooks/neverness-to-everness/useParties', () => ({
  useParties: vi.fn(),
}));

import { useCharacters } from '@/hooks/neverness-to-everness/useCharacters';
import { useParties } from '@/hooks/neverness-to-everness/useParties';

const emptyPrefs: N2ETrackedCharacter['cartridgePreferences'] = {
  mainStats: [],
  subStats: [],
  comments: '',
};

function makeChar(id: string, name: string): N2ETrackedCharacter {
  return {
    id,
    name,
    rarity: 'S',
    esperType: 'Incantation',
    arcType: 'Burst',
    roles: ['DPS'],
    imageUrl: `/assets/neverness-to-everness/characters/${id}.webp`,
    isFavorited: false,
    level: 60,
    awakening: [false, false, false, false, false, false],
    resonanceCount: 0,
    arcId: null,
    arcLevel: 1,
    arcTier: 1,
    cartridgeRarity: null,
    cartridgeLevel: 0,
    cartridgeMainStat: null,
    cartridgeSubStats: [],
    cartridgePreferences: emptyPrefs,
  };
}

function makeParty(id: string, name: string): N2EParty {
  return {
    id,
    profileId: 'user-1',
    name,
    notes: null,
    tier: null,
    isFavorited: false,
    members: [],
    createdAt: new Date().toISOString(),
  };
}

const defaultCharactersHook = {
  availableCharacters: [],
  trackedCharacters: [],
  isInitialLoad: false,
  isLoadError: false,
  retryLoad: vi.fn(),
  pendingSaveCount: 0,
  addCharacter: vi.fn(),
  removeCharacter: vi.fn(),
  updateCharacterLevel: vi.fn(),
  toggleAwakeningSlot: vi.fn(),
  updateResonanceCount: vi.fn(),
  updateArc: vi.fn(),
  updateCartridge: vi.fn(),
  saveCartridgePreferences: vi.fn(),
  toggleFavoriteCharacter: vi.fn(),
  getFilteredRoster: vi.fn().mockReturnValue([]),
};

const defaultPartiesHook = {
  parties: [],
  isLoading: false,
  saveParty: vi.fn().mockResolvedValue(null),
  deleteParty: vi.fn().mockResolvedValue(true),
  toggleFavoriteParty: vi.fn(),
  refreshParties: vi.fn(),
};

describe('N2ePage', () => {
  beforeEach(() => {
    vi.mocked(useCharacters).mockReturnValue(defaultCharactersHook);
    vi.mocked(useParties).mockReturnValue(defaultPartiesHook);
  });

  it('shows "Authenticating..." while auth is loading', () => {
    renderWithProviders(<N2ePage session={null} isAuthLoading={true} onSignIn={vi.fn()} />);
    expect(screen.getByText(/authenticating/i)).toBeInTheDocument();
  });

  it('shows AuthGate when there is no session', () => {
    renderWithProviders(<N2ePage session={null} isAuthLoading={false} onSignIn={vi.fn()} />);
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument();
  });

  it('shows "Loading database sync..." during initial load with session', () => {
    vi.mocked(useCharacters).mockReturnValue({
      ...defaultCharactersHook,
      isInitialLoad: true,
    });
    const session = createMockSession();
    renderWithProviders(<N2ePage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    expect(screen.getByText(/loading database sync/i)).toBeInTheDocument();
  });

  it('shows load error state when isLoadError is true', () => {
    vi.mocked(useCharacters).mockReturnValue({
      ...defaultCharactersHook,
      isLoadError: true,
    });
    const session = createMockSession();
    renderWithProviders(<N2ePage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    expect(screen.getByText(/failed to load data/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('disables the add character button when isLoadError is true', () => {
    vi.mocked(useCharacters).mockReturnValue({
      ...defaultCharactersHook,
      isLoadError: true,
    });
    const session = createMockSession();
    renderWithProviders(<N2ePage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    expect(screen.getByTitle('Add Character')).toBeDisabled();
  });

  it('calls retryLoad when Retry button is clicked', () => {
    const retryLoad = vi.fn();
    vi.mocked(useCharacters).mockReturnValue({
      ...defaultCharactersHook,
      isLoadError: true,
      retryLoad,
    });
    const session = createMockSession();
    renderWithProviders(<N2ePage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(retryLoad).toHaveBeenCalledTimes(1);
  });

  it('shows empty state when no espers are tracked', () => {
    const session = createMockSession();
    renderWithProviders(<N2ePage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    expect(screen.getByText(/no espers tracked yet/i)).toBeInTheDocument();
  });

  it('renders character cards when characters are tracked', () => {
    const session = createMockSession();
    const chars = [makeChar('baicang', 'Baicang'), makeChar('jade', 'Jade')];
    vi.mocked(useCharacters).mockReturnValue({
      ...defaultCharactersHook,
      trackedCharacters: chars,
      getFilteredRoster: vi.fn().mockReturnValue(chars),
    });
    renderWithProviders(<N2ePage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    expect(screen.getByText('Baicang')).toBeInTheDocument();
    expect(screen.getByText('Jade')).toBeInTheDocument();
  });

  it('shows "no espers match your search" when search filters all out', () => {
    const session = createMockSession();
    vi.mocked(useCharacters).mockReturnValue({
      ...defaultCharactersHook,
      trackedCharacters: [makeChar('baicang', 'Baicang')],
      getFilteredRoster: vi.fn().mockReturnValue([]),
    });
    renderWithProviders(<N2ePage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    expect(screen.getByText(/no espers match your search/i)).toBeInTheDocument();
  });

  it('shows the add character button when session exists', () => {
    const session = createMockSession();
    renderWithProviders(<N2ePage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    expect(screen.getByTitle('Add Character')).toBeInTheDocument();
  });

  it('opens AddCharacterModal when add button is clicked', () => {
    const session = createMockSession();
    renderWithProviders(<N2ePage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    fireEvent.click(screen.getByTitle('Add Character'));
    expect(screen.getByRole('heading', { name: /add esper/i })).toBeInTheDocument();
  });

  it('switches to Lineups tab when Lineups button is clicked', () => {
    const session = createMockSession();
    renderWithProviders(<N2ePage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /lineups/i }));
    expect(screen.getByText(/no lineups configured/i)).toBeInTheDocument();
  });

  it('shows parties in Lineups tab when they exist', () => {
    const session = createMockSession();
    vi.mocked(useParties).mockReturnValue({
      ...defaultPartiesHook,
      parties: [makeParty('p1', 'Alpha Team'), makeParty('p2', 'Beta Team')],
    });
    renderWithProviders(<N2ePage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /lineups/i }));
    expect(screen.getByText('Alpha Team')).toBeInTheDocument();
    expect(screen.getByText('Beta Team')).toBeInTheDocument();
  });

  it('shows SavingToast when pendingSaveCount > 0', () => {
    const session = createMockSession();
    vi.mocked(useCharacters).mockReturnValue({
      ...defaultCharactersHook,
      pendingSaveCount: 2,
    });
    renderWithProviders(<N2ePage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders the page title', () => {
    renderWithProviders(<N2ePage session={null} isAuthLoading={false} onSignIn={vi.fn()} />);
    expect(screen.getByRole('heading', { name: /neverness to everness/i })).toBeInTheDocument();
  });

  it('passes the typed search term to getFilteredRoster', () => {
    const session = createMockSession();
    const chars = [makeChar('baicang', 'Baicang')];
    const getFilteredRoster = vi.fn().mockReturnValue(chars);
    vi.mocked(useCharacters).mockReturnValue({
      ...defaultCharactersHook,
      trackedCharacters: chars,
      getFilteredRoster,
    });
    renderWithProviders(<N2ePage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText(/search by name/i), {
      target: { value: 'Jade' },
    });
    expect(getFilteredRoster).toHaveBeenCalledWith('Jade', expect.any(String));
  });

  it('Roster tab button has active class by default', () => {
    renderWithProviders(<N2ePage session={null} isAuthLoading={false} onSignIn={vi.fn()} />);
    expect(screen.getByRole('button', { name: /roster/i })).toHaveClass('active');
    expect(screen.getByRole('button', { name: /lineups/i })).not.toHaveClass('active');
  });

  it('Lineups tab button gets active class when clicked', () => {
    const session = createMockSession();
    renderWithProviders(<N2ePage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /lineups/i }));
    expect(screen.getByRole('button', { name: /lineups/i })).toHaveClass('active');
    expect(screen.getByRole('button', { name: /roster/i })).not.toHaveClass('active');
  });

  it('does not show search or sort controls when no characters are tracked', () => {
    const session = createMockSession();
    renderWithProviders(<N2ePage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    expect(screen.queryByPlaceholderText(/search by name/i)).not.toBeInTheDocument();
    expect(screen.queryByTitle(/sorted/i)).not.toBeInTheDocument();
  });

  it('shows search and sort controls when characters are tracked', () => {
    const session = createMockSession();
    const chars = [makeChar('baicang', 'Baicang')];
    vi.mocked(useCharacters).mockReturnValue({
      ...defaultCharactersHook,
      trackedCharacters: chars,
      getFilteredRoster: vi.fn().mockReturnValue(chars),
    });
    renderWithProviders(<N2ePage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    expect(screen.getByPlaceholderText(/search by name/i)).toBeInTheDocument();
    expect(screen.getByTitle(/sorted alphabetically/i)).toBeInTheDocument();
  });

  it('sort button has active class in default ALPHA mode', () => {
    const session = createMockSession();
    const chars = [makeChar('baicang', 'Baicang')];
    vi.mocked(useCharacters).mockReturnValue({
      ...defaultCharactersHook,
      trackedCharacters: chars,
      getFilteredRoster: vi.fn().mockReturnValue(chars),
    });
    renderWithProviders(<N2ePage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    const sortBtn = screen.getByTitle(/sorted alphabetically/i);
    expect(sortBtn).toHaveClass('active');
    expect(sortBtn).toHaveTextContent('AZ');
  });

  it('sort button shows Lv label after toggling to LEVEL', () => {
    const session = createMockSession();
    const chars = [makeChar('baicang', 'Baicang')];
    vi.mocked(useCharacters).mockReturnValue({
      ...defaultCharactersHook,
      trackedCharacters: chars,
      getFilteredRoster: vi.fn().mockReturnValue(chars),
    });
    renderWithProviders(<N2ePage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    fireEvent.click(screen.getByTitle(/sorted alphabetically/i));
    const sortBtn = screen.getByTitle(/sorted by level/i);
    expect(sortBtn).not.toHaveClass('active');
    expect(sortBtn).toHaveTextContent('Lv');
  });

  it('closes AddCharacterModal after a character is added', async () => {
    const session = createMockSession();
    vi.mocked(useCharacters).mockReturnValue({
      ...defaultCharactersHook,
      availableCharacters: [
        {
          id: 'baicang',
          name: 'Baicang',
          rarity: 'S',
          esperType: 'Incantation',
          arcType: 'Burst',
          roles: ['DPS'],
          imageUrl: '/assets/neverness-to-everness/characters/baicang.webp',
        },
      ],
      addCharacter: vi.fn().mockResolvedValue(undefined),
    });
    renderWithProviders(<N2ePage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    fireEvent.click(screen.getByTitle('Add Character'));
    expect(screen.getByRole('heading', { name: /add esper/i })).toBeInTheDocument();
    fireEvent.click(screen.getByText('Baicang'));
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /add esper/i })).not.toBeInTheDocument();
    });
  });

  it('switches back to roster after visiting Lineups tab', () => {
    const session = createMockSession();
    const chars = [makeChar('baicang', 'Baicang')];
    vi.mocked(useCharacters).mockReturnValue({
      ...defaultCharactersHook,
      trackedCharacters: chars,
      getFilteredRoster: vi.fn().mockReturnValue(chars),
    });
    renderWithProviders(<N2ePage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /lineups/i }));
    expect(screen.getByText(/no lineups configured/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /roster/i }));
    expect(screen.getByText('Baicang')).toBeInTheDocument();
  });
});
