import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, act, within } from '@testing-library/react';
import { Reverse1999Page } from '@/pages/reverse1999/Reverse1999Page';
import { renderWithProviders, createMockSession } from '@/test/utils';
import type { R1999TrackedArcanist } from '@/types';

vi.mock('@/hooks/reverse1999/useArcanists', () => ({
  useArcanists: vi.fn(),
}));

vi.mock('@/hooks/reverse1999/useParties', () => ({
  useParties: vi.fn(),
}));

import { useArcanists } from '@/hooks/reverse1999/useArcanists';
import { useParties } from '@/hooks/reverse1999/useParties';

function makeArcanist(id: string, name: string): R1999TrackedArcanist {
  return {
    id,
    sourceId: id,
    name,
    afflatus: 'Star',
    damageType: 'Mental',
    imageUrl: `/assets/${id}.webp`,
    hasEuphoria: false,
    isFavorited: false,
    level: 40,
    portraitLevel: 0,
    resonanceLevel: 0,
    euphoriaStage: 0,
    psychubeName: null,
    psychubeLevel: 1,
    psychubeAmplification: 1,
  };
}

const defaultArcanistsHook = {
  availableArcanists: [],
  trackedArcanists: [],
  isInitialLoad: false,
  isLoadError: false,
  retryLoad: vi.fn(),
  pendingSaveCount: 0,
  addArcanist: vi.fn(),
  removeArcanist: vi.fn(),
  updateArcanistLevel: vi.fn(),
  updatePortraitLevel: vi.fn(),
  updateResonanceLevel: vi.fn(),
  updateEuphoriaStage: vi.fn(),
  updatePsychube: vi.fn(),
  updatePsychubeAmplification: vi.fn(),
  toggleFavoriteArcanist: vi.fn(),
  getFilteredRoster: vi.fn().mockReturnValue([]),
};

describe('Reverse1999Page', () => {
  beforeEach(() => {
    vi.mocked(useArcanists).mockReturnValue(defaultArcanistsHook);
    vi.mocked(useParties).mockReturnValue({
      parties: [],
      isInitialLoad: false,
      isLoadError: false,
      retryLoad: vi.fn(),
      saveParty: vi.fn().mockResolvedValue({ partyId: null }),
      deleteParty: vi.fn().mockResolvedValue(false),
      toggleFavoriteParty: vi.fn(),
      refreshParties: vi.fn().mockResolvedValue(undefined),
    });
  });

  it('renders the page title', () => {
    renderWithProviders(
      <Reverse1999Page session={null} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    expect(screen.getByRole('heading', { name: /reverse: 1999 arcanists/i })).toBeInTheDocument();
  });

  it('shows sign-in check while auth is loading', () => {
    renderWithProviders(<Reverse1999Page session={null} isAuthLoading={true} onSignIn={vi.fn()} />);
    expect(screen.getByText(/checking sign-in/i)).toBeInTheDocument();
  });

  it('shows AuthGate when there is no session', () => {
    renderWithProviders(
      <Reverse1999Page session={null} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument();
  });

  it('shows roster loading state during initial load with session', () => {
    vi.mocked(useArcanists).mockReturnValue({
      ...defaultArcanistsHook,
      isInitialLoad: true,
    });
    const session = createMockSession();
    renderWithProviders(
      <Reverse1999Page session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    expect(screen.getByText(/loading your roster/i)).toBeInTheDocument();
  });

  it('shows load error state when isLoadError is true', () => {
    vi.mocked(useArcanists).mockReturnValue({
      ...defaultArcanistsHook,
      isLoadError: true,
    });
    const session = createMockSession();
    renderWithProviders(
      <Reverse1999Page session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    expect(screen.getByText(/couldn.t load your roster/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('disables the add arcanist button when isLoadError is true', () => {
    vi.mocked(useArcanists).mockReturnValue({
      ...defaultArcanistsHook,
      isLoadError: true,
    });
    const session = createMockSession();
    renderWithProviders(
      <Reverse1999Page session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    expect(screen.getByTitle('Add Arcanist')).toBeDisabled();
  });

  it('calls retryLoad when Retry button is clicked', () => {
    const retryLoad = vi.fn();
    vi.mocked(useArcanists).mockReturnValue({
      ...defaultArcanistsHook,
      isLoadError: true,
      retryLoad,
    });
    const session = createMockSession();
    renderWithProviders(
      <Reverse1999Page session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(retryLoad).toHaveBeenCalledTimes(1);
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
    expect(getFilteredRoster).toHaveBeenCalledWith(
      'Vertin',
      expect.any(String),
      undefined,
      expect.any(Array),
    );
  });

  // --- Search / sort controls visibility ---

  it('does not show search or sort controls when no arcanists are tracked', () => {
    const session = createMockSession();
    renderWithProviders(
      <Reverse1999Page session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    expect(screen.queryByPlaceholderText(/search by name, afflatus/i)).not.toBeInTheDocument();
    expect(screen.queryByTitle(/sorted alphabetically/i)).not.toBeInTheDocument();
  });

  it('shows search and sort controls when arcanists are tracked', () => {
    const session = createMockSession();
    const arcanists = [makeArcanist('regulus', 'Regulus')];
    vi.mocked(useArcanists).mockReturnValue({
      ...defaultArcanistsHook,
      trackedArcanists: arcanists,
      getFilteredRoster: vi.fn().mockReturnValue(arcanists),
    });
    renderWithProviders(
      <Reverse1999Page session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    expect(screen.getByPlaceholderText(/search by name, afflatus/i)).toBeInTheDocument();
    expect(screen.getByTitle(/sorted alphabetically/i)).toBeInTheDocument();
  });

  // --- Sort button toggle ---

  it('sort button has active class and AZ label in default ALPHA mode', () => {
    const session = createMockSession();
    const arcanists = [makeArcanist('regulus', 'Regulus')];
    vi.mocked(useArcanists).mockReturnValue({
      ...defaultArcanistsHook,
      trackedArcanists: arcanists,
      getFilteredRoster: vi.fn().mockReturnValue(arcanists),
    });
    renderWithProviders(
      <Reverse1999Page session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    const sortBtn = screen.getByTitle(/sorted alphabetically/i);
    expect(sortBtn).toHaveClass('active');
    expect(sortBtn).toHaveTextContent('AZ');
  });

  it('sort button loses active class and shows Lv label after toggling to LEVEL', () => {
    const session = createMockSession();
    const arcanists = [makeArcanist('regulus', 'Regulus')];
    vi.mocked(useArcanists).mockReturnValue({
      ...defaultArcanistsHook,
      trackedArcanists: arcanists,
      getFilteredRoster: vi.fn().mockReturnValue(arcanists),
    });
    renderWithProviders(
      <Reverse1999Page session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    fireEvent.click(screen.getByTitle(/sorted alphabetically/i));
    const sortBtn = screen.getByTitle(/sorted by level/i);
    expect(sortBtn).not.toHaveClass('active');
    expect(sortBtn).toHaveTextContent('Lv');
  });

  it('passes LEVEL to getFilteredRoster after toggling sort', () => {
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
    fireEvent.click(screen.getByTitle(/sorted alphabetically/i));
    expect(getFilteredRoster).toHaveBeenCalledWith('', 'LEVEL', undefined, expect.any(Array));
  });

  // --- AddArcanistModal: adding closes the modal ---

  it('closes AddArcanistModal after an arcanist is added', () => {
    const session = createMockSession();
    vi.mocked(useArcanists).mockReturnValue({
      ...defaultArcanistsHook,
      availableArcanists: [
        {
          id: 'regulus',
          sourceId: 'regulus',
          name: 'Regulus',
          afflatus: 'Star',
          damageType: 'Mental',
          imageUrl: '/regulus.webp',
          hasEuphoria: false,
        },
      ],
      addArcanist: vi.fn(),
    });
    renderWithProviders(
      <Reverse1999Page session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    fireEvent.click(screen.getByTitle('Add Arcanist'));
    expect(screen.getByRole('heading', { name: /add arcanist/i })).toBeInTheDocument();
    fireEvent.click(screen.getByText('Regulus'));
    expect(screen.queryByRole('heading', { name: /add arcanist/i })).not.toBeInTheDocument();
  });

  // --- Filter facets (Resonance / Euphoria / Psychube) ---

  /** Chip labels repeat across facets, so chips are always selected inside their group row. */
  const chipIn = (facet: string, label: string) =>
    within(screen.getByRole('group', { name: facet })).getByRole('button', { name: label });

  const lastPredicate = (mock: ReturnType<typeof vi.fn>) =>
    mock.mock.calls.at(-1)?.[2] as ((a: R1999TrackedArcanist) => boolean) | undefined;

  function renderFacets(getFilteredRoster = vi.fn().mockReturnValue([])) {
    const arcanists = [makeArcanist('regulus', 'Regulus')];
    vi.mocked(useArcanists).mockReturnValue({
      ...defaultArcanistsHook,
      trackedArcanists: arcanists,
      getFilteredRoster,
    });
    const utils = renderWithProviders(
      <Reverse1999Page session={createMockSession()} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    return { ...utils, getFilteredRoster };
  }

  it('renders no filter block when no arcanists are tracked', () => {
    renderWithProviders(
      <Reverse1999Page session={createMockSession()} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    expect(screen.queryByRole('group')).toBeNull();
    expect(screen.queryByRole('button', { name: /^Filters/ })).toBeNull();
  });

  it('renders three facet rows in card order with their chips off', () => {
    renderFacets();
    const groups = screen.getAllByRole('group');
    expect(groups.map((g) => g.getAttribute('aria-label'))).toEqual([
      'Resonance',
      'Euphoria',
      'Psychube',
    ]);
    const labels = (g: HTMLElement) =>
      within(g)
        .getAllByRole('button')
        .map((b) => b.textContent);
    expect(labels(groups[0])).toEqual(['Not started', 'In progress']);
    expect(labels(groups[1])).toEqual(['Not started', 'In progress']);
    expect(labels(groups[2])).toEqual(['None equipped', 'Under Lv 60', 'Under A5']);
    expect(screen.getAllByRole('button', { pressed: false })).toHaveLength(7);
    expect(screen.queryByRole('button', { pressed: true })).toBeNull();
  });

  it('joins the Resonance and Euphoria pairs and spaces the Psychube chips', () => {
    renderFacets();
    const joined = [...document.querySelectorAll('.filter-facet-chips.mode-one')].map((el) =>
      el.closest('.filter-facet')!.getAttribute('aria-label'),
    );
    expect(joined).toEqual(['Resonance', 'Euphoria']);
    const psychube = screen
      .getByRole('group', { name: 'Psychube' })
      .querySelector('.filter-facet-chips')!;
    expect(psychube).toHaveClass('mode-any');
    // The exclusive chip is divided from the siblings it cannot combine with
    expect(
      [...psychube.children].map((el) =>
        el.classList.contains('filter-facet-divider') ? '│' : el.textContent,
      ),
    ).toEqual(['None equipped', '│', 'Under Lv 60', 'Under A5']);
  });

  it('forwards no predicate while every chip is off', () => {
    const { getFilteredRoster } = renderFacets();
    expect(getFilteredRoster).toHaveBeenLastCalledWith('', 'ALPHA', undefined, expect.any(Array));
  });

  it('Resonance · Not started keeps only resonance 0', () => {
    const { getFilteredRoster } = renderFacets();
    fireEvent.click(chipIn('Resonance', 'Not started'));
    const predicate = lastPredicate(getFilteredRoster)!;
    expect(predicate(makeArcanist('a', 'A'))).toBe(true);
    expect(predicate({ ...makeArcanist('b', 'B'), resonanceLevel: 1 })).toBe(false);
    expect(predicate({ ...makeArcanist('c', 'C'), resonanceLevel: 15 })).toBe(false);
  });

  it('Resonance · In progress keeps resonance 1–14', () => {
    const { getFilteredRoster } = renderFacets();
    fireEvent.click(chipIn('Resonance', 'In progress'));
    const predicate = lastPredicate(getFilteredRoster)!;
    expect(predicate(makeArcanist('a', 'A'))).toBe(false);
    expect(predicate({ ...makeArcanist('b', 'B'), resonanceLevel: 1 })).toBe(true);
    expect(predicate({ ...makeArcanist('c', 'C'), resonanceLevel: 14 })).toBe(true);
    expect(predicate({ ...makeArcanist('d', 'D'), resonanceLevel: 15 })).toBe(false);
  });

  it('Euphoria · Not started keeps only Euphoria arcanists at stage 0', () => {
    const { getFilteredRoster } = renderFacets();
    fireEvent.click(chipIn('Euphoria', 'Not started'));
    const predicate = lastPredicate(getFilteredRoster)!;
    expect(predicate({ ...makeArcanist('a', 'A'), hasEuphoria: true })).toBe(true);
    expect(predicate({ ...makeArcanist('b', 'B'), hasEuphoria: true, euphoriaStage: 1 })).toBe(
      false,
    );
    expect(predicate(makeArcanist('c', 'C'))).toBe(false); // no Euphoria system
  });

  it('Euphoria · In progress keeps only Euphoria arcanists at stage 1–3', () => {
    const { getFilteredRoster } = renderFacets();
    fireEvent.click(chipIn('Euphoria', 'In progress'));
    const predicate = lastPredicate(getFilteredRoster)!;
    const eu = (euphoriaStage: number, hasEuphoria = true) => ({
      ...makeArcanist('x', 'X'),
      hasEuphoria,
      euphoriaStage,
    });
    expect(predicate(eu(0))).toBe(false);
    expect(predicate(eu(1))).toBe(true);
    expect(predicate(eu(3))).toBe(true);
    expect(predicate(eu(4))).toBe(false);
    expect(predicate(eu(2, false))).toBe(false); // no Euphoria system
  });

  it('Psychube · None equipped keeps only arcanists without a psychube', () => {
    const { getFilteredRoster } = renderFacets();
    fireEvent.click(chipIn('Psychube', 'None equipped'));
    const predicate = lastPredicate(getFilteredRoster)!;
    expect(predicate(makeArcanist('a', 'A'))).toBe(true);
    expect(predicate({ ...makeArcanist('b', 'B'), psychubeName: 'Gluttony' })).toBe(false);
  });

  it('Psychube · Under Lv 60 keeps only equipped psychubes below Lv 60', () => {
    const { getFilteredRoster } = renderFacets();
    fireEvent.click(chipIn('Psychube', 'Under Lv 60'));
    const predicate = lastPredicate(getFilteredRoster)!;
    expect(predicate({ ...makeArcanist('a', 'A'), psychubeLevel: 1 })).toBe(false); // none equipped
    expect(
      predicate({ ...makeArcanist('b', 'B'), psychubeName: 'Gluttony', psychubeLevel: 59 }),
    ).toBe(true);
    expect(
      predicate({ ...makeArcanist('c', 'C'), psychubeName: 'Gluttony', psychubeLevel: 60 }),
    ).toBe(false);
  });

  it('Psychube · Under A5 keeps only equipped psychubes below A5', () => {
    const { getFilteredRoster } = renderFacets();
    fireEvent.click(chipIn('Psychube', 'Under A5'));
    const predicate = lastPredicate(getFilteredRoster)!;
    expect(predicate(makeArcanist('a', 'A'))).toBe(false); // none equipped
    expect(
      predicate({ ...makeArcanist('b', 'B'), psychubeName: 'Gluttony', psychubeAmplification: 1 }),
    ).toBe(true);
    expect(
      predicate({ ...makeArcanist('c', 'C'), psychubeName: 'Gluttony', psychubeAmplification: 4 }),
    ).toBe(true);
    expect(
      predicate({ ...makeArcanist('d', 'D'), psychubeName: 'Gluttony', psychubeAmplification: 5 }),
    ).toBe(false);
  });

  it.each(['Resonance', 'Euphoria'])(
    '%s chips are exclusive: activating a sibling swaps, clicking the active one clears',
    (facet) => {
      const { getFilteredRoster } = renderFacets();
      const notStarted = chipIn(facet, 'Not started');
      const inProgress = chipIn(facet, 'In progress');
      fireEvent.click(notStarted);
      expect(notStarted).toHaveAttribute('aria-pressed', 'true');
      fireEvent.click(inProgress);
      expect(inProgress).toHaveAttribute('aria-pressed', 'true');
      expect(notStarted).toHaveAttribute('aria-pressed', 'false');
      expect(notStarted).not.toHaveClass('active');
      // Only the in-progress predicate is applied: a stage-0 arcanist is excluded
      const predicate = lastPredicate(getFilteredRoster)!;
      expect(predicate({ ...makeArcanist('a', 'A'), hasEuphoria: true })).toBe(false);
      fireEvent.click(inProgress);
      expect(inProgress).toHaveAttribute('aria-pressed', 'false');
      expect(lastPredicate(getFilteredRoster)).toBeUndefined();
    },
  );

  it('Psychube chips toggle independently and AND together', () => {
    const { getFilteredRoster } = renderFacets();
    fireEvent.click(chipIn('Psychube', 'Under Lv 60'));
    fireEvent.click(chipIn('Psychube', 'Under A5'));
    expect(chipIn('Psychube', 'Under Lv 60')).toHaveAttribute('aria-pressed', 'true');
    expect(chipIn('Psychube', 'Under A5')).toHaveAttribute('aria-pressed', 'true');
    const predicate = lastPredicate(getFilteredRoster)!;
    const psy = (psychubeLevel: number, psychubeAmplification: number) => ({
      ...makeArcanist('x', 'X'),
      psychubeName: 'Gluttony',
      psychubeLevel,
      psychubeAmplification,
    });
    expect(predicate(psy(59, 2))).toBe(true);
    expect(predicate(psy(60, 2))).toBe(false);
    expect(predicate(psy(59, 5))).toBe(false);
  });

  it('None equipped is exclusive with the other Psychube chips', () => {
    const { getFilteredRoster } = renderFacets();
    const pressed = () =>
      ['None equipped', 'Under Lv 60', 'Under A5'].map((l) =>
        chipIn('Psychube', l).getAttribute('aria-pressed'),
      );
    fireEvent.click(chipIn('Psychube', 'Under Lv 60'));
    fireEvent.click(chipIn('Psychube', 'Under A5'));
    fireEvent.click(chipIn('Psychube', 'None equipped'));
    expect(pressed()).toEqual(['true', 'false', 'false']);
    expect(lastPredicate(getFilteredRoster)!(makeArcanist('a', 'A'))).toBe(true);

    fireEvent.click(chipIn('Psychube', 'Under A5'));
    expect(pressed()).toEqual(['false', 'false', 'true']);
    expect(lastPredicate(getFilteredRoster)!(makeArcanist('a', 'A'))).toBe(false);
  });

  it('chips across facets intersect', () => {
    const { getFilteredRoster } = renderFacets();
    fireEvent.click(chipIn('Resonance', 'In progress'));
    fireEvent.click(chipIn('Psychube', 'Under A5'));
    const predicate = lastPredicate(getFilteredRoster)!;
    const arc = (resonanceLevel: number, psychubeAmplification: number) => ({
      ...makeArcanist('x', 'X'),
      resonanceLevel,
      psychubeName: 'Gluttony',
      psychubeAmplification,
    });
    expect(predicate(arc(5, 2))).toBe(true);
    expect(predicate(arc(0, 2))).toBe(false);
    expect(predicate(arc(5, 5))).toBe(false);
  });

  it('a chip composes with search and LEVEL sort, and deactivating restores the roster', () => {
    const { getFilteredRoster } = renderFacets();
    fireEvent.click(chipIn('Resonance', 'In progress'));
    fireEvent.click(screen.getByTitle(/sorted alphabetically/i)); // → LEVEL
    fireEvent.change(screen.getByPlaceholderText(/search by name, afflatus/i), {
      target: { value: 'Vertin' },
    });
    const [term, sortBy, predicate] = getFilteredRoster.mock.calls.at(-1)!;
    expect(term).toBe('Vertin');
    expect(sortBy).toBe('LEVEL');
    expect(typeof predicate).toBe('function');

    fireEvent.click(chipIn('Resonance', 'In progress'));
    expect(getFilteredRoster).toHaveBeenLastCalledWith(
      'Vertin',
      'LEVEL',
      undefined,
      expect.any(Array),
    );
  });

  it('chip state resets on navigation (remount)', () => {
    const { unmount } = renderFacets();
    fireEvent.click(chipIn('Resonance', 'In progress'));
    expect(chipIn('Resonance', 'In progress')).toHaveAttribute('aria-pressed', 'true');
    unmount();
    const { getFilteredRoster } = renderFacets();
    expect(screen.queryByRole('button', { pressed: true })).toBeNull();
    expect(getFilteredRoster).toHaveBeenLastCalledWith('', 'ALPHA', undefined, expect.any(Array));
  });

  it.each([
    ['Resonance', 'Not started', /no arcanists without resonance started/i],
    ['Resonance', 'In progress', /no arcanists with resonance in progress/i],
    ['Euphoria', 'Not started', /no euphoria arcanists without euphoria started/i],
    ['Euphoria', 'In progress', /no euphoria arcanists with euphoria in progress/i],
    ['Psychube', 'None equipped', /no arcanists without a psychube/i],
    ['Psychube', 'Under Lv 60', /no arcanists with a psychube below lv 60/i],
    ['Psychube', 'Under A5', /no arcanists with un-maxed psychube amplification/i],
  ])('%s · %s shows its own no-match copy when it matches nothing', (facet, label, copy) => {
    renderFacets();
    fireEvent.click(chipIn(facet, label));
    expect(screen.getByText(copy)).toBeInTheDocument();
  });

  it('shows the generic active-filters copy when two chips match nothing', () => {
    renderFacets();
    fireEvent.click(chipIn('Resonance', 'In progress'));
    fireEvent.click(chipIn('Psychube', 'Under A5'));
    expect(screen.getByText(/no arcanists match the active filters/i)).toBeInTheDocument();
  });

  // --- Collapsible block (three rows) ---

  it('renders the Filters disclosure open with the matrix under it', () => {
    const { container } = renderFacets();
    const toggle = screen.getByRole('button', { name: /^Filters/ });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(toggle).toHaveAttribute('aria-controls', container.querySelector('.filter-row')!.id);
    expect(container.querySelectorAll('.filter-facet')).toHaveLength(3);
    expect(container.querySelector('.filter-toggle-count')).toBeNull();
  });

  it('collapsing shows facet-labelled removable pills; removing one clears only that chip', () => {
    const { container, getFilteredRoster } = renderFacets();
    fireEvent.click(chipIn('Resonance', 'In progress'));
    fireEvent.click(chipIn('Psychube', 'Under A5'));
    const toggle = screen.getByRole('button', { name: /^Filters/ });
    expect(toggle).toHaveTextContent('Filters2');

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(container.querySelector('.filter-facet')).toBeNull();
    expect(
      [...container.querySelectorAll('.filter-summary')].map((b) => b.getAttribute('aria-label')),
    ).toEqual(['Remove filter Resonance · In progress', 'Remove filter Psychube · Under A5']);

    fireEvent.click(screen.getByRole('button', { name: 'Remove filter Psychube · Under A5' }));
    expect(container.querySelectorAll('.filter-summary')).toHaveLength(1);
    expect(toggle).toHaveTextContent('Filters1');
    const predicate = lastPredicate(getFilteredRoster)!;
    expect(predicate({ ...makeArcanist('a', 'A'), resonanceLevel: 5 })).toBe(true);

    fireEvent.click(toggle);
    expect(chipIn('Resonance', 'In progress')).toHaveAttribute('aria-pressed', 'true');
    expect(chipIn('Psychube', 'Under A5')).toHaveAttribute('aria-pressed', 'false');
  });

  // --- Projection stability (deferred eviction / reorder) ---

  /** A filter implementation honouring predicate, entities override, and LEVEL sort. */
  function projectionFilter(live: { current: R1999TrackedArcanist[] }) {
    return vi.fn(
      (
        term: string,
        sortBy: string,
        predicate?: (a: R1999TrackedArcanist) => boolean,
        entities?: R1999TrackedArcanist[],
      ) => {
        let list = entities ?? live.current;
        if (predicate) list = list.filter(predicate);
        if (term.trim()) list = list.filter((a) => a.name.includes(term));
        return [...list].sort(
          sortBy === 'LEVEL' ? (a, b) => b.level - a.level : (a, b) => a.name.localeCompare(b.name),
        );
      },
    );
  }

  /**
   * `getFilteredRoster` identity must stay stable across edits (a new identity
   * is the chip-toggle signal and refreshes all bases) — one filter per test.
   */
  function mockRoster(
    live: { current: R1999TrackedArcanist[] },
    filter: ReturnType<typeof projectionFilter>,
  ) {
    vi.mocked(useArcanists).mockReturnValue({
      ...defaultArcanistsHook,
      trackedArcanists: live.current,
      getFilteredRoster: filter,
    });
  }

  it('holds a card that stops matching Resonance · In progress until edit commit', () => {
    const session = createMockSession();
    const live = { current: [{ ...makeArcanist('r1', 'Regulus'), resonanceLevel: 5 }] };
    const filter = projectionFilter(live);
    mockRoster(live, filter);
    const { rerender, container } = renderWithProviders(
      <Reverse1999Page session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    fireEvent.click(chipIn('Resonance', 'In progress'));
    expect(screen.getByText('Regulus')).toBeInTheDocument();

    // Expand edit mode, then "max resonance": mutate live state and rerender
    fireEvent.click(screen.getByTitle('Edit'));
    live.current = [{ ...makeArcanist('r1', 'Regulus'), resonanceLevel: 15 }];
    mockRoster(live, filter);
    rerender(<Reverse1999Page session={session} isAuthLoading={false} onSignIn={vi.fn()} />);

    // Card is held, not evicted — dimmed with a ghost tag
    expect(screen.getByText('Regulus')).toBeInTheDocument();
    expect(container.querySelector('.game-card.is-held')).not.toBeNull();
    expect(screen.getByText(/no longer matches Resonance · In progress/)).toBeInTheDocument();

    // ✓ commit releases: the card plays its exit animation
    vi.useFakeTimers();
    try {
      fireEvent.click(screen.getByTitle('Done editing'));
      expect(container.querySelector('.game-card.is-exiting')).not.toBeNull();

      // jsdom can't deliver React's (vendor-prefix-mapped) animationend, so
      // the hook's fallback timer commits the eviction here
      act(() => {
        vi.advanceTimersByTime(700);
      });
      expect(screen.queryByText('Regulus')).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('chip toggle evicts a held card immediately', () => {
    const session = createMockSession();
    const live = { current: [{ ...makeArcanist('r1', 'Regulus'), resonanceLevel: 5 }] };
    const filter = projectionFilter(live);
    mockRoster(live, filter);
    const { rerender } = renderWithProviders(
      <Reverse1999Page session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    fireEvent.click(chipIn('Resonance', 'In progress'));
    live.current = [{ ...makeArcanist('r1', 'Regulus'), resonanceLevel: 15 }];
    mockRoster(live, filter);
    rerender(<Reverse1999Page session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    expect(screen.getByText('Regulus')).toBeInTheDocument(); // held

    // Toggling the chip off and on refreshes all bases — instant eviction
    fireEvent.click(chipIn('Resonance', 'In progress'));
    expect(screen.getByText('Regulus')).toBeInTheDocument(); // gate off: normal member
    fireEvent.click(chipIn('Resonance', 'In progress'));
    expect(screen.queryByText('Regulus')).not.toBeInTheDocument();
  });

  it('LEVEL sort does not reorder mid-edit, reorders on commit', () => {
    const session = createMockSession();
    const live = {
      current: [
        { ...makeArcanist('r1', 'Regulus'), level: 10 },
        { ...makeArcanist('r2', 'Vertin'), level: 20 },
      ],
    };
    const filter = projectionFilter(live);
    mockRoster(live, filter);
    const { rerender, container } = renderWithProviders(
      <Reverse1999Page session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    fireEvent.click(screen.getByTitle(/sorted alphabetically/i)); // LEVEL sort
    const names = () =>
      [...container.querySelectorAll('.game-card-name')].map((n) => n.textContent);
    expect(names()).toEqual(['Vertin', 'Regulus']);

    // Edit Regulus's level above Vertin's
    fireEvent.click(screen.getAllByTitle('Edit')[1]); // Regulus card (second)
    live.current = [
      { ...makeArcanist('r1', 'Regulus'), level: 50 },
      { ...makeArcanist('r2', 'Vertin'), level: 20 },
    ];
    mockRoster(live, filter);
    rerender(<Reverse1999Page session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    expect(names()).toEqual(['Vertin', 'Regulus']); // order held

    fireEvent.click(screen.getByTitle('Done editing'));
    expect(names()).toEqual(['Regulus', 'Vertin']); // released: re-sorted
  });

  it('favorite toggle releases immediately (completed intent)', () => {
    const session = createMockSession();
    const toggleFavoriteArcanist = vi.fn();
    const live = { current: [makeArcanist('r1', 'Regulus')] };
    vi.mocked(useArcanists).mockReturnValue({
      ...defaultArcanistsHook,
      trackedArcanists: live.current,
      getFilteredRoster: projectionFilter(live),
      toggleFavoriteArcanist,
    });
    renderWithProviders(
      <Reverse1999Page session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    fireEvent.click(screen.getByTitle('Favorite Arcanist'));
    expect(toggleFavoriteArcanist).toHaveBeenCalledWith('r1', true);
  });

  it('holds a card that stops matching Psychube · Under A5 with the composed ghost tag', () => {
    const session = createMockSession();
    const live = {
      current: [
        {
          ...makeArcanist('r1', 'Regulus'),
          psychubeName: 'Luxurious Leisure',
          psychubeAmplification: 3,
        },
      ],
    };
    const filter = projectionFilter(live);
    mockRoster(live, filter);
    const { rerender, container } = renderWithProviders(
      <Reverse1999Page session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    fireEvent.click(chipIn('Psychube', 'Under A5'));
    expect(screen.getByText('Regulus')).toBeInTheDocument();

    // "Max amplification" mid-edit: live data stops matching
    fireEvent.click(screen.getByTitle('Edit'));
    live.current = [
      {
        ...makeArcanist('r1', 'Regulus'),
        psychubeName: 'Luxurious Leisure',
        psychubeAmplification: 5,
      },
    ];
    mockRoster(live, filter);
    rerender(<Reverse1999Page session={session} isAuthLoading={false} onSignIn={vi.fn()} />);

    expect(container.querySelector('.game-card.is-held')).not.toBeNull();
    expect(screen.getByText(/no longer matches Psychube · Under A5/)).toBeInTheDocument();
  });
});

describe('Reverse1999Page error surfaces and party load wiring', () => {
  const partiesHook = {
    parties: [],
    isInitialLoad: false,
    isLoadError: false,
    retryLoad: vi.fn(),
    saveParty: vi.fn().mockResolvedValue({ partyId: null }),
    deleteParty: vi.fn().mockResolvedValue(false),
    toggleFavoriteParty: vi.fn(),
    refreshParties: vi.fn().mockResolvedValue(undefined),
  };

  it('roster Retry retries both the roster and the parties load', () => {
    const retryLoad = vi.fn();
    const retryParties = vi.fn();
    vi.mocked(useArcanists).mockReturnValue({
      ...defaultArcanistsHook,
      isLoadError: true,
      retryLoad,
    });
    vi.mocked(useParties).mockReturnValue({ ...partiesHook, retryLoad: retryParties });
    renderWithProviders(
      <Reverse1999Page session={createMockSession()} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(retryLoad).toHaveBeenCalledTimes(1);
    expect(retryParties).toHaveBeenCalledTimes(1);
  });

  it('renders the roster error in the error box, not the empty box', () => {
    vi.mocked(useArcanists).mockReturnValue({ ...defaultArcanistsHook, isLoadError: true });
    renderWithProviders(
      <Reverse1999Page session={createMockSession()} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    expect(screen.getByRole('alert')).toHaveClass('error-state');
    expect(document.querySelector('.empty-state')).toBeNull();
  });

  it('parties tab reflects the party hook load state, not the roster load state', () => {
    vi.mocked(useParties).mockReturnValue({ ...partiesHook, isInitialLoad: true });
    renderWithProviders(
      <Reverse1999Page session={createMockSession()} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /lineups/i }));
    expect(screen.getByRole('status')).toHaveTextContent('Loading your lineups…');
    expect(screen.queryByText(/no lineups configured yet/i)).not.toBeInTheDocument();
  });

  it('parties tab Retry retries only the parties load', () => {
    const retryLoad = vi.fn();
    const retryParties = vi.fn();
    vi.mocked(useArcanists).mockReturnValue({ ...defaultArcanistsHook, retryLoad });
    vi.mocked(useParties).mockReturnValue({
      ...partiesHook,
      isLoadError: true,
      retryLoad: retryParties,
    });
    renderWithProviders(
      <Reverse1999Page session={createMockSession()} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /lineups/i }));
    expect(screen.getByRole('alert')).toHaveTextContent("Couldn't load your lineups.");
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(retryParties).toHaveBeenCalledTimes(1);
    expect(retryLoad).not.toHaveBeenCalled();
  });
});
