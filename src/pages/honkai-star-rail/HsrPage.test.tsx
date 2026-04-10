import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
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

  // --- Search input wiring ---

  it('passes the typed search term to getFilteredRoster', () => {
    const session = createMockSession();
    const chars = [makeChar('acheron', 'Acheron')];
    const getFilteredRoster = vi.fn().mockReturnValue(chars);
    vi.mocked(useCharacters).mockReturnValue({
      ...defaultCharactersHook,
      trackedCharacters: chars,
      getFilteredRoster,
    });
    renderWithProviders(<HsrPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText(/search by name, element, or path/i), {
      target: { value: 'Blade' },
    });
    expect(getFilteredRoster).toHaveBeenCalledWith(
      'Blade',
      expect.any(String),
      expect.any(Function),
    );
  });

  // --- Relic editor modal integration ---

  it('opens RelicEditorModal when a relic slot on a character card is clicked', () => {
    const session = createMockSession();
    const chars = [makeChar('acheron', 'Acheron')];
    vi.mocked(useCharacters).mockReturnValue({
      ...defaultCharactersHook,
      trackedCharacters: chars,
      getFilteredRoster: vi.fn().mockReturnValue(chars),
    });
    renderWithProviders(<HsrPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    fireEvent.click(screen.getByTitle(/^Head/));
    expect(screen.getByRole('heading', { name: /edit head/i })).toBeInTheDocument();
  });

  // --- Tab active classes ---

  it('Roster tab button has active class by default', () => {
    renderWithProviders(<HsrPage session={null} isAuthLoading={false} onSignIn={vi.fn()} />);
    expect(screen.getByRole('button', { name: /roster/i })).toHaveClass('active');
    expect(screen.getByRole('button', { name: /parties/i })).not.toHaveClass('active');
  });

  it('Parties tab button gets active class when clicked', () => {
    const session = createMockSession();
    renderWithProviders(<HsrPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /parties/i }));
    expect(screen.getByRole('button', { name: /parties/i })).toHaveClass('active');
    expect(screen.getByRole('button', { name: /roster/i })).not.toHaveClass('active');
  });

  // --- Search / sort controls visibility ---

  it('does not show search or sort controls when no characters are tracked', () => {
    const session = createMockSession();
    renderWithProviders(<HsrPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    expect(screen.queryByPlaceholderText(/search by name/i)).not.toBeInTheDocument();
    expect(screen.queryByTitle(/sorted by relic score/i)).not.toBeInTheDocument();
  });

  it('shows search and sort controls when characters are tracked', () => {
    const session = createMockSession();
    const chars = [makeChar('acheron', 'Acheron')];
    vi.mocked(useCharacters).mockReturnValue({
      ...defaultCharactersHook,
      trackedCharacters: chars,
      getFilteredRoster: vi.fn().mockReturnValue(chars),
    });
    renderWithProviders(<HsrPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    expect(screen.getByPlaceholderText(/search by name/i)).toBeInTheDocument();
    expect(screen.getByTitle(/sorted by relic score/i)).toBeInTheDocument();
  });

  // --- Sort button toggle ---

  it('sort button has active class and ★ label in default SCORE mode', () => {
    const session = createMockSession();
    const chars = [makeChar('acheron', 'Acheron')];
    vi.mocked(useCharacters).mockReturnValue({
      ...defaultCharactersHook,
      trackedCharacters: chars,
      getFilteredRoster: vi.fn().mockReturnValue(chars),
    });
    renderWithProviders(<HsrPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    const sortBtn = screen.getByTitle(/sorted by relic score/i);
    expect(sortBtn).toHaveClass('active');
    expect(sortBtn).toHaveTextContent('★');
  });

  it('sort button loses active class and shows AZ label after toggling to ALPHA', () => {
    const session = createMockSession();
    const chars = [makeChar('acheron', 'Acheron')];
    vi.mocked(useCharacters).mockReturnValue({
      ...defaultCharactersHook,
      trackedCharacters: chars,
      getFilteredRoster: vi.fn().mockReturnValue(chars),
    });
    renderWithProviders(<HsrPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    fireEvent.click(screen.getByTitle(/sorted by relic score/i));
    const sortBtn = screen.getByTitle(/sorted alphabetically/i);
    expect(sortBtn).not.toHaveClass('active');
    expect(sortBtn).toHaveTextContent('AZ');
  });

  it('passes ALPHA to getFilteredRoster after toggling sort', () => {
    const session = createMockSession();
    const chars = [makeChar('acheron', 'Acheron')];
    const getFilteredRoster = vi.fn().mockReturnValue(chars);
    vi.mocked(useCharacters).mockReturnValue({
      ...defaultCharactersHook,
      trackedCharacters: chars,
      getFilteredRoster,
    });
    renderWithProviders(<HsrPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    fireEvent.click(screen.getByTitle(/sorted by relic score/i));
    expect(getFilteredRoster).toHaveBeenCalledWith('', 'ALPHA', expect.any(Function));
  });

  // --- AddCharacterModal: adding closes the modal ---

  it('closes AddCharacterModal after a character is added', async () => {
    const session = createMockSession();
    vi.mocked(useCharacters).mockReturnValue({
      ...defaultCharactersHook,
      availableCharacters: [
        { id: 'acheron', name: 'Acheron', element: 'Thunder', path: 'Nihility', imageUrl: '/acheron.webp' },
      ],
      addCharacter: vi.fn().mockResolvedValue(undefined),
    });
    renderWithProviders(<HsrPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    fireEvent.click(screen.getByTitle('Add Character'));
    expect(screen.getByRole('heading', { name: /add character/i })).toBeInTheDocument();
    fireEvent.click(screen.getByText('Acheron'));
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /add character/i })).not.toBeInTheDocument();
    });
  });

  // --- RelicEditorModal: close button dismisses the modal ---

  it('closes RelicEditorModal when the close button is clicked', () => {
    const session = createMockSession();
    const chars = [makeChar('acheron', 'Acheron')];
    vi.mocked(useCharacters).mockReturnValue({
      ...defaultCharactersHook,
      trackedCharacters: chars,
      getFilteredRoster: vi.fn().mockReturnValue(chars),
    });
    renderWithProviders(<HsrPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    fireEvent.click(screen.getByTitle(/^Head/));
    expect(screen.getByRole('heading', { name: /edit head/i })).toBeInTheDocument();
    fireEvent.click(document.querySelector('.close-btn')!);
    expect(screen.queryByRole('heading', { name: /edit head/i })).not.toBeInTheDocument();
  });

  // --- Tab toggle round-trip ---

  it('switches back to the character roster after visiting the Parties tab', () => {
    const session = createMockSession();
    const chars = [makeChar('acheron', 'Acheron')];
    vi.mocked(useCharacters).mockReturnValue({
      ...defaultCharactersHook,
      trackedCharacters: chars,
      getFilteredRoster: vi.fn().mockReturnValue(chars),
    });
    renderWithProviders(<HsrPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /parties/i }));
    expect(screen.getByText(/no parties configured/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /roster/i }));
    expect(screen.getByText('Acheron')).toBeInTheDocument();
  });
});
