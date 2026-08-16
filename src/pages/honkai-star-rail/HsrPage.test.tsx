import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { HsrPage } from '@/pages/honkai-star-rail/HsrPage';
import { renderWithProviders, createMockSession } from '@/test/utils';
import type { HsrTrackedCharacter, Party } from '@/types';

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
    useAltPortrait: false,
    lightConeId: null,
    lightConeLevel: 1,
    lightConeSuperimposition: 1,
    lightConePreferences: [],
    relics: { head: null, hands: null, body: null, feet: null, sphere: null, rope: null },
    buildPreferences: emptyPrefs,
  };
}

function makeParty(id: string, name: string): Party {
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
  isLoadError: false,
  retryLoad: vi.fn(),
  pendingSaveCount: 0,
  addCharacter: vi.fn(),
  removeCharacter: vi.fn(),
  updateCharacterLevel: vi.fn(),
  toggleCharacterTraces: vi.fn(),
  toggleFavoriteCharacter: vi.fn(),
  updateUseAltPortrait: vi.fn(),
  updateLightCone: vi.fn(),
  updateLightConeLevel: vi.fn(),
  updateLightConeSuperimposition: vi.fn(),
  updateLightConePreferences: vi.fn(),
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
  toggleFavoriteParty: vi.fn(),
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

  it('shows load error state when isLoadError is true', () => {
    vi.mocked(useCharacters).mockReturnValue({
      ...defaultCharactersHook,
      isLoadError: true,
    });
    const session = createMockSession();
    renderWithProviders(<HsrPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    expect(screen.getByText(/failed to load data/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('disables the add character button when isLoadError is true', () => {
    vi.mocked(useCharacters).mockReturnValue({
      ...defaultCharactersHook,
      isLoadError: true,
    });
    const session = createMockSession();
    renderWithProviders(<HsrPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
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
    renderWithProviders(<HsrPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(retryLoad).toHaveBeenCalledTimes(1);
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

  it('party avatars use the alternate portrait when the tracked form is toggled', () => {
    const session = createMockSession();
    const tbCatalog = {
      id: 'trailblazer_harmony',
      name: 'Trailblazer (Harmony)',
      element: 'Imaginary',
      path: 'Harmony',
      imageUrl: '/assets/trailblazer_harmony.webp',
      altImageUrl: '/assets/trailblazer_harmony_alt.webp',
    };
    vi.mocked(useCharacters).mockReturnValue({
      ...defaultCharactersHook,
      availableCharacters: [tbCatalog],
      trackedCharacters: [
        {
          ...makeChar('trailblazer_harmony', 'Trailblazer (Harmony)'),
          altImageUrl: tbCatalog.altImageUrl,
          useAltPortrait: true,
        },
      ],
    });
    vi.mocked(useParties).mockReturnValue({
      ...defaultPartiesHook,
      parties: [
        {
          ...makeParty('p1', 'TB Team'),
          members: [{ entityId: 'trailblazer_harmony', slotIndex: 0 }],
        },
      ],
    });
    renderWithProviders(<HsrPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /parties/i }));
    // getMugshotUrl may prefix the CDN endpoint — assert on the resolved file path
    expect(screen.getByAltText('Trailblazer (Harmony)').getAttribute('src')).toContain(
      'trailblazer_harmony_alt.webp',
    );
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
      expect.any(Array),
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
    expect(screen.getByRole('heading', { name: /relics — acheron/i })).toBeInTheDocument();
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
    expect(screen.queryByTitle(/sorted by build score/i)).not.toBeInTheDocument();
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
    expect(screen.getByTitle(/sorted by build score/i)).toBeInTheDocument();
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
    const sortBtn = screen.getByTitle(/sorted by build score/i);
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
    fireEvent.click(screen.getByTitle(/sorted by build score/i));
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
    fireEvent.click(screen.getByTitle(/sorted by build score/i));
    expect(getFilteredRoster).toHaveBeenCalledWith(
      '',
      'ALPHA',
      expect.any(Function),
      expect.any(Array),
    );
  });

  // --- AddCharacterModal: adding closes the modal ---

  it('closes AddCharacterModal after a character is added', async () => {
    const session = createMockSession();
    vi.mocked(useCharacters).mockReturnValue({
      ...defaultCharactersHook,
      availableCharacters: [
        {
          id: 'acheron',
          name: 'Acheron',
          element: 'Thunder',
          path: 'Nihility',
          imageUrl: '/acheron.webp',
        },
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
    expect(screen.getByRole('heading', { name: /relics — acheron/i })).toBeInTheDocument();
    fireEvent.click(document.querySelector('.close-btn')!);
    expect(screen.queryByRole('heading', { name: /relics — acheron/i })).not.toBeInTheDocument();
  });

  // --- LightConeEditorModal integration ---

  it('opens the Light Cone dialog from the card and wires edits to updateLightConePreferences', () => {
    const session = createMockSession();
    const chars = [makeChar('acheron', 'Acheron')];
    const updateLightConePreferences = vi.fn();
    vi.mocked(useCharacters).mockReturnValue({
      ...defaultCharactersHook,
      trackedCharacters: chars,
      getFilteredRoster: vi.fn().mockReturnValue(chars),
      updateLightConePreferences,
    });
    renderWithProviders(<HsrPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    fireEvent.click(screen.getByTitle('Edit'));
    fireEvent.click(screen.getByRole('button', { name: /edit preferences/i }));
    expect(screen.getByText('Light Cones — Acheron')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '+ Add Light Cone' }));
    expect(updateLightConePreferences).toHaveBeenCalledWith('acheron', [expect.any(String)]);
  });

  it('closes the Light Cone dialog via its Done button', () => {
    const session = createMockSession();
    const chars = [makeChar('acheron', 'Acheron')];
    vi.mocked(useCharacters).mockReturnValue({
      ...defaultCharactersHook,
      trackedCharacters: chars,
      getFilteredRoster: vi.fn().mockReturnValue(chars),
    });
    renderWithProviders(<HsrPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    fireEvent.click(screen.getByTitle('Edit'));
    fireEvent.click(screen.getByRole('button', { name: /edit preferences/i }));
    expect(screen.getByText('Light Cones — Acheron')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(screen.queryByText('Light Cones — Acheron')).not.toBeInTheDocument();
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

  // --- Projection stability: order holds mid-edit, re-sorts on ✓ commit ---
  it('SCORE sort does not reorder mid-edit, reorders on commit', () => {
    const session = createMockSession();
    const live = {
      current: [
        { ...makeChar('acheron', 'Acheron'), level: 10 },
        { ...makeChar('blade', 'Blade'), level: 20 },
      ],
    };
    // Stands in for the SCORE comparator — only basis-vs-live ordering is under
    // test, so level doubles as the score. Identity must stay stable across
    // rerenders (a new identity is the refresh-all signal).
    const filter = vi.fn(
      (term: string, _sortBy: string, _scoreFor: unknown, entities?: HsrTrackedCharacter[]) => {
        let list = entities ?? live.current;
        if (term.trim()) list = list.filter((c) => c.name.includes(term));
        return [...list].sort((a, b) => b.level - a.level);
      },
    );
    const mock = () =>
      vi.mocked(useCharacters).mockReturnValue({
        ...defaultCharactersHook,
        trackedCharacters: live.current,
        getFilteredRoster: filter,
      });
    mock();
    const { rerender, container } = renderWithProviders(
      <HsrPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    const names = () =>
      [...container.querySelectorAll('.game-card-name')].map((n) => n.textContent);
    expect(names()).toEqual(['Blade', 'Acheron']);

    fireEvent.click(screen.getAllByTitle('Edit')[1]); // Acheron's card
    live.current = [
      { ...makeChar('acheron', 'Acheron'), level: 50 },
      { ...makeChar('blade', 'Blade'), level: 20 },
    ];
    mock();
    rerender(<HsrPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    expect(names()).toEqual(['Blade', 'Acheron']); // order held mid-edit

    fireEvent.click(screen.getByTitle('Done editing'));
    expect(names()).toEqual(['Acheron', 'Blade']); // released: re-sorted
  });
});
