import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, act } from '@testing-library/react';
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
      isLoading: false,
      saveParty: vi.fn().mockResolvedValue(null),
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

  it('shows load error state when isLoadError is true', () => {
    vi.mocked(useArcanists).mockReturnValue({
      ...defaultArcanistsHook,
      isLoadError: true,
    });
    const session = createMockSession();
    renderWithProviders(
      <Reverse1999Page session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    expect(screen.getByText(/failed to load data/i)).toBeInTheDocument();
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

  // --- Resonance-gate filter chip ---

  it('does not render the resonance-gate chip when no arcanists are tracked', () => {
    const session = createMockSession();
    renderWithProviders(
      <Reverse1999Page session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    expect(screen.queryByText(/resonating/i)).not.toBeInTheDocument();
  });

  it('renders the resonance-gate chip, off by default, when arcanists are tracked', () => {
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
    const chip = screen.getByRole('button', { name: /resonating/i });
    expect(chip).toBeInTheDocument();
    expect(chip).not.toHaveClass('active');
  });

  it('toggles the gate chip active class on click', () => {
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
    const chip = screen.getByRole('button', { name: /resonating/i });
    fireEvent.click(chip);
    expect(chip).toHaveClass('active');
    fireEvent.click(chip);
    expect(chip).not.toHaveClass('active');
  });

  it('forwards no predicate while the gate is off, then a resonance predicate when on', () => {
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
    // Off: predicate arg is undefined
    expect(getFilteredRoster).toHaveBeenLastCalledWith('', 'ALPHA', undefined, expect.any(Array));

    fireEvent.click(screen.getByRole('button', { name: /resonating/i }));

    // On: a predicate is forwarded; verify its resonance-gate semantics
    const predicate = getFilteredRoster.mock.calls.at(-1)?.[2] as (
      a: R1999TrackedArcanist,
    ) => boolean;
    expect(typeof predicate).toBe('function');
    expect(predicate(makeArcanist('a', 'A'))).toBe(false); // resonance 0
    expect(predicate({ ...makeArcanist('b', 'B'), resonanceLevel: 1 })).toBe(true);
    expect(predicate({ ...makeArcanist('c', 'C'), resonanceLevel: 14 })).toBe(true);
    expect(predicate({ ...makeArcanist('d', 'D'), resonanceLevel: 15 })).toBe(false);
  });

  it('composes the gate with search (both forwarded to getFilteredRoster)', () => {
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
    fireEvent.click(screen.getByRole('button', { name: /resonating/i }));
    fireEvent.change(screen.getByPlaceholderText(/search by name, afflatus/i), {
      target: { value: 'Vertin' },
    });
    const [term, , predicate] = getFilteredRoster.mock.calls.at(-1)!;
    expect(term).toBe('Vertin');
    expect(typeof predicate).toBe('function');
  });

  it('shows the gate-specific empty message when the gate matches nothing', () => {
    const session = createMockSession();
    vi.mocked(useArcanists).mockReturnValue({
      ...defaultArcanistsHook,
      trackedArcanists: [makeArcanist('regulus', 'Regulus')],
      getFilteredRoster: vi.fn().mockReturnValue([]),
    });
    renderWithProviders(
      <Reverse1999Page session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /resonating/i }));
    expect(screen.getByText(/no arcanists with resonance in progress/i)).toBeInTheDocument();
  });

  it('renders the gluttony-gate chip, off by default, when arcanists are tracked', () => {
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
    const chip = screen.getByRole('button', { name: /amplifying/i });
    expect(chip).toBeInTheDocument();
    expect(chip).not.toHaveClass('active');
  });

  it('toggles the gluttony-gate chip active class on click', () => {
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
    const chip = screen.getByRole('button', { name: /amplifying/i });
    fireEvent.click(chip);
    expect(chip).toHaveClass('active');
    fireEvent.click(chip);
    expect(chip).not.toHaveClass('active');
  });

  it('forwards a gluttony predicate excluding no-psychube and maxed arcanists', () => {
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
    expect(getFilteredRoster).toHaveBeenLastCalledWith('', 'ALPHA', undefined, expect.any(Array));

    fireEvent.click(screen.getByRole('button', { name: /amplifying/i }));

    const predicate = getFilteredRoster.mock.calls.at(-1)?.[2] as (
      a: R1999TrackedArcanist,
    ) => boolean;
    expect(typeof predicate).toBe('function');
    // no psychube equipped -> excluded
    expect(predicate(makeArcanist('a', 'A'))).toBe(false);
    // equipped, A1 -> included
    expect(
      predicate({ ...makeArcanist('b', 'B'), psychubeName: 'Gluttony', psychubeAmplification: 1 }),
    ).toBe(true);
    // equipped, A4 -> included
    expect(
      predicate({ ...makeArcanist('c', 'C'), psychubeName: 'Gluttony', psychubeAmplification: 4 }),
    ).toBe(true);
    // equipped, A5 (maxed) -> excluded
    expect(
      predicate({ ...makeArcanist('d', 'D'), psychubeName: 'Gluttony', psychubeAmplification: 5 }),
    ).toBe(false);
  });

  it('composes both gates as an intersection when both are active', () => {
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
    fireEvent.click(screen.getByRole('button', { name: /resonating/i }));
    fireEvent.click(screen.getByRole('button', { name: /amplifying/i }));

    const predicate = getFilteredRoster.mock.calls.at(-1)?.[2] as (
      a: R1999TrackedArcanist,
    ) => boolean;
    expect(typeof predicate).toBe('function');
    // satisfies BOTH: resonance in progress AND psychube below max
    expect(
      predicate({
        ...makeArcanist('a', 'A'),
        resonanceLevel: 5,
        psychubeName: 'Gluttony',
        psychubeAmplification: 2,
      }),
    ).toBe(true);
    // satisfies gluttony only (resonance 0) -> excluded by intersection
    expect(
      predicate({
        ...makeArcanist('b', 'B'),
        resonanceLevel: 0,
        psychubeName: 'Gluttony',
        psychubeAmplification: 2,
      }),
    ).toBe(false);
    // satisfies resonance only (psychube maxed) -> excluded by intersection
    expect(
      predicate({
        ...makeArcanist('c', 'C'),
        resonanceLevel: 5,
        psychubeName: 'Gluttony',
        psychubeAmplification: 5,
      }),
    ).toBe(false);
  });

  it('composes the gluttony gate with search (both forwarded)', () => {
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
    fireEvent.click(screen.getByRole('button', { name: /amplifying/i }));
    fireEvent.change(screen.getByPlaceholderText(/search by name, afflatus/i), {
      target: { value: 'Vertin' },
    });
    const [term, , predicate] = getFilteredRoster.mock.calls.at(-1)!;
    expect(term).toBe('Vertin');
    expect(typeof predicate).toBe('function');
  });

  it('shows the gluttony-specific empty message when only that gate matches nothing', () => {
    const session = createMockSession();
    vi.mocked(useArcanists).mockReturnValue({
      ...defaultArcanistsHook,
      trackedArcanists: [makeArcanist('regulus', 'Regulus')],
      getFilteredRoster: vi.fn().mockReturnValue([]),
    });
    renderWithProviders(
      <Reverse1999Page session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /amplifying/i }));
    expect(
      screen.getByText(/no arcanists with un-maxed psychube amplification/i),
    ).toBeInTheDocument();
  });

  it('shows the generic active-filters empty message when both gates match nothing', () => {
    const session = createMockSession();
    vi.mocked(useArcanists).mockReturnValue({
      ...defaultArcanistsHook,
      trackedArcanists: [makeArcanist('regulus', 'Regulus')],
      getFilteredRoster: vi.fn().mockReturnValue([]),
    });
    renderWithProviders(
      <Reverse1999Page session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /resonating/i }));
    fireEvent.click(screen.getByRole('button', { name: /amplifying/i }));
    expect(screen.getByText(/no arcanists match the active filters/i)).toBeInTheDocument();
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

  it('holds a card that stops matching the resonance gate until edit commit', () => {
    const session = createMockSession();
    const live = { current: [{ ...makeArcanist('r1', 'Regulus'), resonanceLevel: 5 }] };
    const filter = projectionFilter(live);
    mockRoster(live, filter);
    const { rerender, container } = renderWithProviders(
      <Reverse1999Page session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /resonating/i }));
    expect(screen.getByText('Regulus')).toBeInTheDocument();

    // Expand edit mode, then "max resonance": mutate live state and rerender
    fireEvent.click(screen.getByTitle('Edit'));
    live.current = [{ ...makeArcanist('r1', 'Regulus'), resonanceLevel: 15 }];
    mockRoster(live, filter);
    rerender(<Reverse1999Page session={session} isAuthLoading={false} onSignIn={vi.fn()} />);

    // Card is held, not evicted — dimmed with a ghost tag
    expect(screen.getByText('Regulus')).toBeInTheDocument();
    expect(container.querySelector('.game-card.is-held')).not.toBeNull();
    expect(screen.getByText(/no longer matches 💠 Resonating/)).toBeInTheDocument();

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
    fireEvent.click(screen.getByRole('button', { name: /resonating/i }));
    live.current = [{ ...makeArcanist('r1', 'Regulus'), resonanceLevel: 15 }];
    mockRoster(live, filter);
    rerender(<Reverse1999Page session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    expect(screen.getByText('Regulus')).toBeInTheDocument(); // held

    // Toggling the chip off and on refreshes all bases — instant eviction
    fireEvent.click(screen.getByRole('button', { name: /resonating/i }));
    expect(screen.getByText('Regulus')).toBeInTheDocument(); // gate off: normal member
    fireEvent.click(screen.getByRole('button', { name: /resonating/i }));
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
});
