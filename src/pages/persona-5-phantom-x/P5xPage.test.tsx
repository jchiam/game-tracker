import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, act } from '@testing-library/react';
import { P5xPage } from './P5xPage';
import { renderWithProviders, createMockSession } from '@/test/utils';
import type { P5xTrackedThief, Party } from '@/types';
import { calculateRevelationScore } from '@/utils/revelationScoring';

vi.mock('@/hooks/persona-5-phantom-x/useThieves', () => ({
  useThieves: vi.fn(),
}));

vi.mock('@/hooks/persona-5-phantom-x/useParties', () => ({
  useParties: vi.fn(),
}));

vi.mock('@/lib/imagekit', () => ({
  getMugshotUrl: (path: string) => path,
  getAvatarUrl: (path: string) => path,
}));

import { useThieves } from '@/hooks/persona-5-phantom-x/useThieves';
import { useParties } from '@/hooks/persona-5-phantom-x/useParties';

function makeThief(id: string, name: string): P5xTrackedThief {
  return {
    id,
    name,
    codename: name,
    personaName: 'Carmen',
    rarity: 5,
    role: 'Multi-target',
    element: 'Fire',
    imageUrl: `/assets/persona-5-phantom-x/thieves/${id}.webp`,
    dbId: `db-${id}`,
    isFavorited: false,
    level: 45,
    awareness: 3,
    skillProgress: 0,
    mindscapeProgress: 0,
    weaponRarity: 2,
    weaponLevel: 1,
    weaponForge: 0,
    revelations: { sun: null, moon: null, star: null, sky: null, space: null },
    revelationPreferences: {
      heavensSetId: null,
      spaceSetId: null,
      mainStats: { moon: [], star: [], sky: [] },
      subStats: [],
      comments: '',
    },
  };
}

function makeParty(id: string, name: string): Party {
  return {
    id,
    profileId: 'user-1',
    name,
    notes: null,
    members: [],
    createdAt: '2026-01-01T00:00:00Z',
  };
}

const defaultThievesHook = {
  availableThieves: [],
  trackedThieves: [] as P5xTrackedThief[],
  isInitialLoad: false,
  isLoadError: false,
  retryLoad: vi.fn(),
  pendingSaveCount: 0,
  addThief: vi.fn(),
  removeThief: vi.fn(),
  updateLevel: vi.fn(),
  updateAwareness: vi.fn(),
  updateSkillProgress: vi.fn(),
  toggleFavorite: vi.fn(),
  updateMindscapeProgress: vi.fn(),
  updateWeaponRarity: vi.fn(),
  updateWeaponLevel: vi.fn(),
  updateWeaponForge: vi.fn(),
  updateRevelationSlot: vi.fn(),
  updateRevelationPreferences: vi.fn(),
  getFilteredRoster: vi.fn().mockReturnValue([]),
} as any;

const defaultPartiesHook = {
  parties: [] as Party[],
  isInitialLoad: false,
  isLoadError: false,
  retryLoad: vi.fn(),
  saveParty: vi.fn().mockResolvedValue({ partyId: null }),
  deleteParty: vi.fn().mockResolvedValue(true),
  toggleFavoriteParty: vi.fn(),
  refreshParties: vi.fn(),
};

describe('P5xPage', () => {
  beforeEach(() => {
    vi.mocked(useThieves).mockReturnValue(defaultThievesHook);
    vi.mocked(useParties).mockReturnValue(defaultPartiesHook);
  });

  it('shows sign-in check while auth is loading', () => {
    renderWithProviders(<P5xPage session={null} isAuthLoading={true} onSignIn={vi.fn()} />);
    expect(screen.getByText(/checking sign-in/i)).toBeInTheDocument();
  });

  it('shows AuthGate when there is no session', () => {
    renderWithProviders(<P5xPage session={null} isAuthLoading={false} onSignIn={vi.fn()} />);
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument();
  });

  it('shows roster loading state during initial load with session', () => {
    vi.mocked(useThieves).mockReturnValue({ ...defaultThievesHook, isInitialLoad: true });
    renderWithProviders(
      <P5xPage session={createMockSession()} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    expect(screen.getByText(/loading your roster/i)).toBeInTheDocument();
  });

  it('shows load error state when isLoadError is true', () => {
    vi.mocked(useThieves).mockReturnValue({ ...defaultThievesHook, isLoadError: true });
    renderWithProviders(
      <P5xPage session={createMockSession()} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    expect(screen.getByText(/couldn.t load your roster/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('renders tracked thief cards from the filtered roster', () => {
    const thieves = [makeThief('ann-takamaki', 'Ann Takamaki'), makeThief('lufel', 'Lufel')];
    vi.mocked(useThieves).mockReturnValue({
      ...defaultThievesHook,
      trackedThieves: thieves,
      getFilteredRoster: vi.fn().mockReturnValue(thieves),
    });
    renderWithProviders(
      <P5xPage session={createMockSession()} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    expect(screen.getByText('Ann Takamaki')).toBeInTheDocument();
    expect(screen.getByText('Lufel')).toBeInTheDocument();
  });

  it('shows the empty message when nothing is tracked', () => {
    renderWithProviders(
      <P5xPage session={createMockSession()} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    expect(screen.getByText(/no phantom thieves tracked yet/i)).toBeInTheDocument();
  });

  it('switches to the Parties view', () => {
    vi.mocked(useParties).mockReturnValue({
      ...defaultPartiesHook,
      parties: [makeParty('p1', 'Party Alpha')],
    });
    renderWithProviders(
      <P5xPage session={createMockSession()} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Parties' }));
    expect(screen.getByText('Your Parties')).toBeInTheDocument();
    expect(screen.getByText('Party Alpha')).toBeInTheDocument();
  });

  it('opens the add modal from the add button', () => {
    renderWithProviders(
      <P5xPage session={createMockSession()} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    fireEvent.click(screen.getByTitle('Add Phantom Thief'));
    expect(screen.getByRole('heading', { name: /add phantom thief/i })).toBeInTheDocument();
  });

  it('renders the rose-gated filter chip', () => {
    const thieves = [makeThief('ann-takamaki', 'Ann Takamaki')];
    vi.mocked(useThieves).mockReturnValue({
      ...defaultThievesHook,
      trackedThieves: thieves,
      getFilteredRoster: vi.fn().mockReturnValue(thieves),
    });
    renderWithProviders(
      <P5xPage session={createMockSession()} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    expect(screen.getByRole('button', { name: '🌹 Rose-gated' })).toBeInTheDocument();
  });

  it('chip composes with search and LEVEL sort, and deactivating restores the roster', () => {
    const thieves = [makeThief('ann-takamaki', 'Ann Takamaki')];
    const mockGetFiltered = vi.fn().mockReturnValue(thieves);
    vi.mocked(useThieves).mockReturnValue({
      ...defaultThievesHook,
      trackedThieves: thieves,
      getFilteredRoster: mockGetFiltered,
    });
    renderWithProviders(
      <P5xPage session={createMockSession()} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Sub-5★' }));
    fireEvent.click(screen.getByTitle(/sorted alphabetically/i)); // → LEVEL
    fireEvent.change(screen.getByPlaceholderText(/search by name/i), { target: { value: 'fire' } });
    const [term, sortBy, predicate] = mockGetFiltered.mock.calls.at(-1)!;
    expect(term).toBe('fire');
    expect(sortBy).toBe('LEVEL');
    expect(
      (predicate as (t: P5xTrackedThief) => boolean)({ ...makeThief('a', 'A'), weaponRarity: 3 }),
    ).toBe(true);
    expect(
      (predicate as (t: P5xTrackedThief) => boolean)({ ...makeThief('b', 'B'), weaponRarity: 5 }),
    ).toBe(false);

    // Deactivate: search and sort survive, predicate is gone
    fireEvent.click(screen.getByRole('button', { name: 'Sub-5★' }));
    expect(mockGetFiltered).toHaveBeenLastCalledWith('fire', 'LEVEL', undefined, expect.any(Array));
    expect(screen.getByRole('button', { name: 'Sub-5★' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('activating filter chip calls getFilteredRoster with predicate', () => {
    const thieves = [makeThief('ann-takamaki', 'Ann Takamaki')];
    const mockGetFiltered = vi.fn().mockReturnValue(thieves);
    vi.mocked(useThieves).mockReturnValue({
      ...defaultThievesHook,
      trackedThieves: thieves,
      getFilteredRoster: mockGetFiltered,
    });
    renderWithProviders(
      <P5xPage session={createMockSession()} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: '🌹 Rose-gated' }));
    const lastCall = mockGetFiltered.mock.calls[mockGetFiltered.mock.calls.length - 1];
    expect(lastCall[2]).toBeInstanceOf(Function);
  });

  it('shows contextual empty message when filter active with no matches', () => {
    const thieves = [makeThief('ann-takamaki', 'Ann Takamaki')];
    const mockGetFiltered = vi.fn().mockReturnValue([]);
    vi.mocked(useThieves).mockReturnValue({
      ...defaultThievesHook,
      trackedThieves: thieves,
      getFilteredRoster: mockGetFiltered,
    });
    renderWithProviders(
      <P5xPage session={createMockSession()} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: '🌹 Rose-gated' }));
    expect(screen.getByText(/no rose-gated thieves found/i)).toBeInTheDocument();
  });

  it('shows weapon-specific empty message when only the weapon filter is active', () => {
    const thieves = [makeThief('ann-takamaki', 'Ann Takamaki')];
    vi.mocked(useThieves).mockReturnValue({
      ...defaultThievesHook,
      trackedThieves: thieves,
      getFilteredRoster: vi.fn().mockReturnValue([]),
    });
    renderWithProviders(
      <P5xPage session={createMockSession()} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Sub-5★' }));
    expect(screen.getByText(/no thieves with a sub-5★ weapon/i)).toBeInTheDocument();
  });

  it('renders the Sub-5★ weapon filter chip', () => {
    const thieves = [makeThief('ann-takamaki', 'Ann Takamaki')];
    vi.mocked(useThieves).mockReturnValue({
      ...defaultThievesHook,
      trackedThieves: thieves,
      getFilteredRoster: vi.fn().mockReturnValue(thieves),
    });
    renderWithProviders(
      <P5xPage session={createMockSession()} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    expect(screen.getByRole('button', { name: 'Sub-5★' })).toBeInTheDocument();
  });

  it('weapon filter predicate keeps sub-5★ weapons and drops 5★', () => {
    const thieves = [makeThief('ann-takamaki', 'Ann Takamaki')];
    const mockGetFiltered = vi.fn().mockReturnValue(thieves);
    vi.mocked(useThieves).mockReturnValue({
      ...defaultThievesHook,
      trackedThieves: thieves,
      getFilteredRoster: mockGetFiltered,
    });
    renderWithProviders(
      <P5xPage session={createMockSession()} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Sub-5★' }));
    const predicate = mockGetFiltered.mock.calls.at(-1)![2] as (t: P5xTrackedThief) => boolean;
    expect(predicate({ ...makeThief('a', 'A'), weaponRarity: 4 })).toBe(true);
    expect(predicate({ ...makeThief('b', 'B'), weaponRarity: 2 })).toBe(true);
    expect(predicate({ ...makeThief('c', 'C'), weaponRarity: 5 })).toBe(false);
  });

  it('both chips active compose as logical AND', () => {
    const thieves = [makeThief('ann-takamaki', 'Ann Takamaki')];
    const mockGetFiltered = vi.fn().mockReturnValue(thieves);
    vi.mocked(useThieves).mockReturnValue({
      ...defaultThievesHook,
      trackedThieves: thieves,
      getFilteredRoster: mockGetFiltered,
    });
    renderWithProviders(
      <P5xPage session={createMockSession()} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: '🌹 Rose-gated' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sub-5★' }));
    const predicate = mockGetFiltered.mock.calls.at(-1)![2] as (t: P5xTrackedThief) => boolean;
    // rose-gated (skillProgress === 1) AND weapon < 5
    expect(predicate({ ...makeThief('a', 'A'), skillProgress: 1, weaponRarity: 3 })).toBe(true);
    // weak weapon but not rose-gated → excluded
    expect(predicate({ ...makeThief('b', 'B'), skillProgress: 0, weaponRarity: 3 })).toBe(false);
    // rose-gated but 5★ weapon → excluded
    expect(predicate({ ...makeThief('c', 'C'), skillProgress: 1, weaponRarity: 5 })).toBe(false);
  });

  // --- Mindscape / Revelations / Skills / weapon-level chips ---

  const fullRevelations = {
    sun: { setId: 'power', mainStat: null, subStats: [] },
    moon: { setId: 'power', mainStat: null, subStats: [] },
    star: { setId: 'power', mainStat: null, subStats: [] },
    sky: { setId: 'power', mainStat: null, subStats: [] },
    space: { setId: 'meditation', mainStat: null, subStats: [] },
  };

  it('renders four facet rows in card-summary order with their chips', () => {
    const thieves = [makeThief('ann-takamaki', 'Ann Takamaki')];
    vi.mocked(useThieves).mockReturnValue({
      ...defaultThievesHook,
      trackedThieves: thieves,
      getFilteredRoster: vi.fn().mockReturnValue(thieves),
    });
    const { container } = renderWithProviders(
      <P5xPage session={createMockSession()} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    const rows = [...container.querySelectorAll('.filter-facet')];
    expect(rows.map((r) => r.getAttribute('aria-label'))).toEqual([
      'Weapon',
      'Mindscape',
      'Revelations',
      'Skills',
    ]);
    expect(rows.every((r) => r.getAttribute('role') === 'group')).toBe(true);
    expect(rows.map((r) => r.querySelector('.filter-facet-label')?.textContent)).toEqual([
      'Weapon',
      'Mindscape',
      'Revelations',
      'Skills',
    ]);
    expect(
      rows.map((r) => [...r.querySelectorAll('.filter-chip')].map((b) => b.textContent)),
    ).toEqual([
      ['Sub-5★', 'Under Lv 80'],
      ['No Outer', 'No Inner'],
      ['Open slots', 'No build'],
      ['Under Lv 8', '🌹 Rose-gated'],
    ]);
    // Joined pill only on the one-mode facets
    expect(rows.map((r) => r.querySelector('.filter-facet-chips')?.className)).toEqual([
      'filter-facet-chips mode-any',
      'filter-facet-chips mode-one',
      'filter-facet-chips mode-any',
      'filter-facet-chips mode-one',
    ]);
    expect(container.querySelectorAll('.filter-chip[aria-pressed="false"]')).toHaveLength(8);
  });

  it('No Outer predicate keeps thieves without Outer Mindscape and drops Outer/Inner', () => {
    const thieves = [makeThief('ann-takamaki', 'Ann Takamaki')];
    const mockGetFiltered = vi.fn().mockReturnValue(thieves);
    vi.mocked(useThieves).mockReturnValue({
      ...defaultThievesHook,
      trackedThieves: thieves,
      getFilteredRoster: mockGetFiltered,
    });
    renderWithProviders(
      <P5xPage session={createMockSession()} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'No Outer' }));
    const predicate = mockGetFiltered.mock.calls.at(-1)![2] as (t: P5xTrackedThief) => boolean;
    expect(predicate({ ...makeThief('a', 'A'), mindscapeProgress: 0 })).toBe(true);
    expect(predicate({ ...makeThief('b', 'B'), mindscapeProgress: 1 })).toBe(false);
    expect(predicate({ ...makeThief('c', 'C'), mindscapeProgress: 2 })).toBe(false);
  });

  it('Open slots predicate keeps open slots, treats a set-less card as empty, drops a full loadout', () => {
    const thieves = [makeThief('ann-takamaki', 'Ann Takamaki')];
    const mockGetFiltered = vi.fn().mockReturnValue(thieves);
    vi.mocked(useThieves).mockReturnValue({
      ...defaultThievesHook,
      trackedThieves: thieves,
      getFilteredRoster: mockGetFiltered,
    });
    renderWithProviders(
      <P5xPage session={createMockSession()} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Open slots' }));
    const predicate = mockGetFiltered.mock.calls.at(-1)![2] as (t: P5xTrackedThief) => boolean;
    expect(predicate(makeThief('a', 'A'))).toBe(true); // no cards
    expect(
      predicate({
        ...makeThief('b', 'B'),
        revelations: { ...fullRevelations, space: null },
      }),
    ).toBe(true); // four cards
    expect(
      predicate({
        ...makeThief('c', 'C'),
        revelations: {
          ...fullRevelations,
          space: { setId: null, mainStat: 'attack', subStats: [] },
        },
      }),
    ).toBe(true); // five entries, one without a set
    expect(predicate({ ...makeThief('d', 'D'), revelations: fullRevelations })).toBe(false);
  });

  it('shows each new chip’s own empty copy when it is the only active chip', () => {
    const thieves = [makeThief('ann-takamaki', 'Ann Takamaki')];
    vi.mocked(useThieves).mockReturnValue({
      ...defaultThievesHook,
      trackedThieves: thieves,
      getFilteredRoster: vi.fn().mockReturnValue([]),
    });
    renderWithProviders(
      <P5xPage session={createMockSession()} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'No Outer' }));
    expect(screen.getByText('No thieves without Outer Mindscape.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'No Outer' }));
    fireEvent.click(screen.getByRole('button', { name: 'Open slots' }));
    expect(screen.getByText('No thieves with open revelation slots.')).toBeInTheDocument();
  });

  it('chips across groups compose as AND and share the generic empty copy', () => {
    const thieves = [makeThief('ann-takamaki', 'Ann Takamaki')];
    const mockGetFiltered = vi.fn().mockReturnValue([]);
    vi.mocked(useThieves).mockReturnValue({
      ...defaultThievesHook,
      trackedThieves: thieves,
      getFilteredRoster: mockGetFiltered,
    });
    renderWithProviders(
      <P5xPage session={createMockSession()} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    for (const name of ['🌹 Rose-gated', 'Sub-5★', 'No Outer', 'Open slots']) {
      fireEvent.click(screen.getByRole('button', { name }));
    }
    expect(screen.getByText('No thieves match the active filters.')).toBeInTheDocument();
    const predicate = mockGetFiltered.mock.calls.at(-1)![2] as (t: P5xTrackedThief) => boolean;
    const passing = { ...makeThief('a', 'A'), skillProgress: 1, weaponRarity: 3 };
    expect(predicate(passing)).toBe(true);
    expect(predicate({ ...passing, mindscapeProgress: 1 })).toBe(false);
    expect(predicate({ ...passing, revelations: fullRevelations })).toBe(false);
    expect(predicate({ ...passing, weaponRarity: 5 })).toBe(false);
    expect(predicate({ ...passing, skillProgress: 2 })).toBe(false);
  });

  function renderChips(getFilteredRoster = vi.fn().mockReturnValue([])) {
    const thieves = [makeThief('ann-takamaki', 'Ann Takamaki')];
    vi.mocked(useThieves).mockReturnValue({
      ...defaultThievesHook,
      trackedThieves: thieves,
      getFilteredRoster,
    });
    return renderWithProviders(
      <P5xPage session={createMockSession()} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
  }
  const lastPredicate = (mock: ReturnType<typeof vi.fn>) =>
    mock.mock.calls.at(-1)![2] as (t: P5xTrackedThief) => boolean;

  it('Under Lv 80 predicate keeps weapons below Lv 80 regardless of rarity', () => {
    const mock = vi.fn().mockReturnValue([]);
    renderChips(mock);
    fireEvent.click(screen.getByRole('button', { name: 'Under Lv 80' }));
    const predicate = lastPredicate(mock);
    expect(predicate({ ...makeThief('a', 'A'), weaponRarity: 5, weaponLevel: 79 })).toBe(true);
    expect(predicate({ ...makeThief('b', 'B'), weaponRarity: 2, weaponLevel: 80 })).toBe(false);
    expect(screen.getByText('No thieves with a weapon below Lv 80.')).toBeInTheDocument();
  });

  it('No Inner predicate keeps only thieves stuck at Outer', () => {
    const mock = vi.fn().mockReturnValue([]);
    renderChips(mock);
    fireEvent.click(screen.getByRole('button', { name: 'No Inner' }));
    const predicate = lastPredicate(mock);
    expect(predicate({ ...makeThief('a', 'A'), mindscapeProgress: 0 })).toBe(false);
    expect(predicate({ ...makeThief('b', 'B'), mindscapeProgress: 1 })).toBe(true);
    expect(predicate({ ...makeThief('c', 'C'), mindscapeProgress: 2 })).toBe(false);
    expect(screen.getByText('No thieves with Outer done and Inner pending.')).toBeInTheDocument();
  });

  it('No build predicate matches the scorer insufficient-data sentinel', () => {
    const mock = vi.fn().mockReturnValue([]);
    renderChips(mock);
    fireEvent.click(screen.getByRole('button', { name: 'No build' }));
    const predicate = lastPredicate(mock);
    const bare = makeThief('a', 'A');
    expect(predicate(bare)).toBe(true); // no prefs, no cards
    const noPrefsWithCards = { ...makeThief('b', 'B'), revelations: fullRevelations };
    expect(predicate(noPrefsWithCards)).toBe(true);
    expect(calculateRevelationScore(noPrefsWithCards)).toBe(-1);
    const withHeavens = {
      ...makeThief('c', 'C'),
      revelationPreferences: { ...bare.revelationPreferences, heavensSetId: 'power' },
    };
    expect(predicate(withHeavens)).toBe(false);
    const withSub = {
      ...makeThief('d', 'D'),
      revelationPreferences: {
        ...bare.revelationPreferences,
        subStats: [{ stat: 'attack', operator: null, orderIndex: 0 }],
      },
    };
    expect(predicate(withSub)).toBe(false);
    expect(screen.getByText('No thieves without a revelation Target Build.')).toBeInTheDocument();
  });

  it('Under Lv 8 predicate keeps only thieves who have not started skills', () => {
    const mock = vi.fn().mockReturnValue([]);
    renderChips(mock);
    fireEvent.click(screen.getByRole('button', { name: 'Under Lv 8' }));
    const predicate = lastPredicate(mock);
    expect(predicate({ ...makeThief('a', 'A'), skillProgress: 0 })).toBe(true);
    expect(predicate({ ...makeThief('b', 'B'), skillProgress: 1 })).toBe(false);
    expect(predicate({ ...makeThief('c', 'C'), skillProgress: 2 })).toBe(false);
    expect(screen.getByText('No thieves with skills below Lv8.')).toBeInTheDocument();
  });

  it('Mindscape chips are mutually exclusive: a sibling click swaps, a repeat click clears', () => {
    const mock = vi.fn().mockReturnValue([]);
    renderChips(mock);
    const outer = screen.getByRole('button', { name: 'No Outer' });
    const inner = screen.getByRole('button', { name: 'No Inner' });
    fireEvent.click(outer);
    expect(outer).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(inner);
    expect(outer).toHaveAttribute('aria-pressed', 'false');
    expect(inner).toHaveAttribute('aria-pressed', 'true');
    const predicate = lastPredicate(mock);
    expect(predicate({ ...makeThief('a', 'A'), mindscapeProgress: 1 })).toBe(true);
    expect(predicate({ ...makeThief('b', 'B'), mindscapeProgress: 0 })).toBe(false);
    fireEvent.click(inner);
    expect(inner).toHaveAttribute('aria-pressed', 'false');
    expect(mock.mock.calls.at(-1)![2]).toBeUndefined();
  });

  it('Skills chips are mutually exclusive and compose with ungrouped chips', () => {
    const mock = vi.fn().mockReturnValue([]);
    renderChips(mock);
    fireEvent.click(screen.getByRole('button', { name: '🌹 Rose-gated' }));
    fireEvent.click(screen.getByRole('button', { name: 'Under Lv 8' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sub-5★' }));
    expect(screen.getByRole('button', { name: '🌹 Rose-gated' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    const predicate = lastPredicate(mock);
    expect(predicate({ ...makeThief('a', 'A'), skillProgress: 0, weaponRarity: 3 })).toBe(true);
    expect(predicate({ ...makeThief('b', 'B'), skillProgress: 1, weaponRarity: 3 })).toBe(false);
    expect(predicate({ ...makeThief('c', 'C'), skillProgress: 0, weaponRarity: 5 })).toBe(false);
    expect(screen.getByText('No thieves match the active filters.')).toBeInTheDocument();
  });

  // --- Collapsible block ---

  it('renders the Filters disclosure open by default (no matchMedia in jsdom)', () => {
    const { container } = renderChips();
    const toggle = screen.getByRole('button', { name: /^Filters/ });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(toggle).toHaveAttribute('aria-controls', container.querySelector('.filter-row')!.id);
    expect(container.querySelectorAll('.filter-facet')).toHaveLength(4);
    expect(container.querySelector('.filter-summary')).toBeNull();
    // No active chip → no count badge
    expect(container.querySelector('.filter-toggle-count')).toBeNull();
    expect(toggle).toHaveTextContent(/^Filters▾$/);
  });

  it('starts collapsed under a narrow viewport and open under a wide one', () => {
    const matchMedia = vi.fn().mockReturnValue({ matches: false });
    vi.stubGlobal('matchMedia', matchMedia);
    try {
      const { container, unmount } = renderChips();
      expect(matchMedia).toHaveBeenCalledWith('(min-width: 600px)');
      expect(screen.getByRole('button', { name: /^Filters/ })).toHaveAttribute(
        'aria-expanded',
        'false',
      );
      expect(container.querySelector('.filter-facet')).toBeNull();
      unmount();
      matchMedia.mockReturnValue({ matches: true });
      const wide = renderChips();
      expect(wide.container.querySelectorAll('.filter-facet')).toHaveLength(4);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('collapsing shows active chips as removable facet-labelled pills; removing clears the chip', () => {
    const mock = vi.fn().mockReturnValue([]);
    const { container } = renderChips(mock);
    fireEvent.click(screen.getByRole('button', { name: 'No Outer' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sub-5★' }));
    const toggle = screen.getByRole('button', { name: /^Filters/ });
    expect(toggle).toHaveTextContent('Filters2');

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(container.querySelector('.filter-facet')).toBeNull();
    const pills = [...container.querySelectorAll('.filter-summary')];
    expect(pills.map((b) => b.getAttribute('aria-label'))).toEqual([
      'Remove filter Weapon · Sub-5★',
      'Remove filter Mindscape · No Outer',
    ]);

    fireEvent.click(screen.getByRole('button', { name: 'Remove filter Mindscape · No Outer' }));
    expect(container.querySelectorAll('.filter-summary')).toHaveLength(1);
    expect(toggle).toHaveTextContent('Filters1');
    const predicate = lastPredicate(mock);
    expect(predicate({ ...makeThief('a', 'A'), weaponRarity: 3, mindscapeProgress: 2 })).toBe(true);

    fireEvent.click(toggle);
    expect(screen.getByRole('button', { name: 'No Outer' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(container.querySelector('.filter-summary')).toBeNull();
  });

  it('Weapon chips toggle independently (any facet) and AND together', () => {
    const mock = vi.fn().mockReturnValue([]);
    renderChips(mock);
    fireEvent.click(screen.getByRole('button', { name: 'Sub-5★' }));
    fireEvent.click(screen.getByRole('button', { name: 'Under Lv 80' }));
    expect(screen.getByRole('button', { name: 'Sub-5★' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Under Lv 80' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    const predicate = lastPredicate(mock);
    expect(predicate({ ...makeThief('a', 'A'), weaponRarity: 4, weaponLevel: 50 })).toBe(true);
    expect(predicate({ ...makeThief('b', 'B'), weaponRarity: 5, weaponLevel: 50 })).toBe(false);
    expect(predicate({ ...makeThief('c', 'C'), weaponRarity: 4, weaponLevel: 80 })).toBe(false);
  });

  // --- Projection stability (deferred eviction / reorder) ---

  /** Filter honouring predicate, entities override, and LEVEL sort. */
  function projectionFilter(live: { current: P5xTrackedThief[] }) {
    return vi.fn(
      (
        term: string,
        sortBy: string,
        predicate?: (t: P5xTrackedThief) => boolean,
        entities?: P5xTrackedThief[],
      ) => {
        let list = entities ?? live.current;
        if (predicate) list = list.filter(predicate);
        if (term.trim()) list = list.filter((t) => t.name.includes(term));
        return [...list].sort(
          sortBy === 'LEVEL' ? (a, b) => b.level - a.level : (a, b) => a.name.localeCompare(b.name),
        );
      },
    );
  }

  /** Keep getFilteredRoster identity stable across rerenders — a new identity is the chip-toggle signal. */
  function mockRoster(
    live: { current: P5xTrackedThief[] },
    filter: ReturnType<typeof projectionFilter>,
  ) {
    vi.mocked(useThieves).mockReturnValue({
      ...defaultThievesHook,
      trackedThieves: live.current,
      getFilteredRoster: filter,
    });
  }

  it('holds a card that stops matching the rose gate until edit commit', () => {
    const session = createMockSession();
    const live = { current: [{ ...makeThief('ann', 'Ann Takamaki'), skillProgress: 1 }] };
    const filter = projectionFilter(live);
    mockRoster(live, filter);
    const { rerender, container } = renderWithProviders(
      <P5xPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: '🌹 Rose-gated' }));
    expect(screen.getByText('Ann Takamaki')).toBeInTheDocument();

    // "Complete the gated skill": live data stops matching mid-edit
    fireEvent.click(screen.getByTitle('Edit'));
    live.current = [{ ...makeThief('ann', 'Ann Takamaki'), skillProgress: 2 }];
    mockRoster(live, filter);
    rerender(<P5xPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);

    expect(screen.getByText('Ann Takamaki')).toBeInTheDocument();
    expect(container.querySelector('.game-card.is-held')).not.toBeNull();
    expect(screen.getByText(/no longer matches Skills · 🌹 Rose-gated/)).toBeInTheDocument();

    // ✓ commit releases via the exit animation (fallback timer in jsdom)
    vi.useFakeTimers();
    try {
      fireEvent.click(screen.getByTitle('Done editing'));
      expect(container.querySelector('.game-card.is-exiting')).not.toBeNull();
      act(() => {
        vi.advanceTimersByTime(700);
      });
      expect(screen.queryByText('Ann Takamaki')).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('LEVEL sort does not reorder mid-edit, reorders on commit', () => {
    const session = createMockSession();
    const live = {
      current: [
        { ...makeThief('ann', 'Ann Takamaki'), level: 10 },
        { ...makeThief('ren', 'Ren Amamiya'), level: 20 },
      ],
    };
    const filter = projectionFilter(live);
    mockRoster(live, filter);
    const { rerender, container } = renderWithProviders(
      <P5xPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    fireEvent.click(screen.getByTitle(/sorted alphabetically/i)); // LEVEL sort
    const names = () =>
      [...container.querySelectorAll('.game-card-name')].map((n) => n.textContent);
    expect(names()).toEqual(['Ren Amamiya', 'Ann Takamaki']);

    fireEvent.click(screen.getAllByTitle('Edit')[1]); // Ann's card
    live.current = [
      { ...makeThief('ann', 'Ann Takamaki'), level: 60 },
      { ...makeThief('ren', 'Ren Amamiya'), level: 20 },
    ];
    mockRoster(live, filter);
    rerender(<P5xPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    expect(names()).toEqual(['Ren Amamiya', 'Ann Takamaki']); // order held

    fireEvent.click(screen.getByTitle('Done editing'));
    expect(names()).toEqual(['Ann Takamaki', 'Ren Amamiya']); // released: re-sorted
  });

  it('holds a card that stops matching the weapon gate with the ⚔ ghost tag', () => {
    const session = createMockSession();
    const live = { current: [{ ...makeThief('ann', 'Ann Takamaki'), weaponRarity: 4 }] };
    const filter = projectionFilter(live);
    mockRoster(live, filter);
    const { rerender, container } = renderWithProviders(
      <P5xPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Sub-5★' }));
    expect(screen.getByText('Ann Takamaki')).toBeInTheDocument();

    // "Upgrade to a 5★ weapon" mid-edit: live data stops matching
    fireEvent.click(screen.getByTitle('Edit'));
    live.current = [{ ...makeThief('ann', 'Ann Takamaki'), weaponRarity: 5 }];
    mockRoster(live, filter);
    rerender(<P5xPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);

    expect(container.querySelector('.game-card.is-held')).not.toBeNull();
    expect(screen.getByText(/no longer matches Weapon · Sub-5★/)).toBeInTheDocument();
  });

  it('a held card survives a disclosure toggle', () => {
    const session = createMockSession();
    const live = { current: [makeThief('ann', 'Ann Takamaki')] };
    const filter = projectionFilter(live);
    mockRoster(live, filter);
    const { rerender, container } = renderWithProviders(
      <P5xPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'No Outer' }));
    fireEvent.click(screen.getByTitle('Edit'));
    live.current = [{ ...makeThief('ann', 'Ann Takamaki'), mindscapeProgress: 1 }];
    mockRoster(live, filter);
    rerender(<P5xPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    expect(container.querySelector('.game-card.is-held')).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /^Filters/ }));
    expect(container.querySelector('.game-card.is-held')).not.toBeNull();
    expect(screen.getByText(/no longer matches Mindscape · No Outer/)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Remove filter Mindscape · No Outer' }),
    ).toBeInTheDocument();
  });

  it('holds a card that completes Outer Mindscape with the Mindscape · No Outer ghost tag until edit commit', () => {
    const session = createMockSession();
    const live = { current: [makeThief('ann', 'Ann Takamaki')] };
    const filter = projectionFilter(live);
    mockRoster(live, filter);
    const { rerender, container } = renderWithProviders(
      <P5xPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'No Outer' }));
    expect(screen.getByText('Ann Takamaki')).toBeInTheDocument();

    // "Finish Outer" mid-edit: live data stops matching
    fireEvent.click(screen.getByTitle('Edit'));
    live.current = [{ ...makeThief('ann', 'Ann Takamaki'), mindscapeProgress: 1 }];
    mockRoster(live, filter);
    rerender(<P5xPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);

    expect(container.querySelector('.game-card.is-held')).not.toBeNull();
    expect(screen.getByText(/no longer matches Mindscape · No Outer/)).toBeInTheDocument();

    vi.useFakeTimers();
    try {
      fireEvent.click(screen.getByTitle('Done editing'));
      expect(container.querySelector('.game-card.is-exiting')).not.toBeNull();
      act(() => {
        vi.advanceTimersByTime(700);
      });
      expect(screen.queryByText('Ann Takamaki')).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('holds a card that fills its fifth slot with the Revelations · Open slots ghost tag until the editor closes', () => {
    const session = createMockSession();
    const live: { current: P5xTrackedThief[] } = {
      current: [
        { ...makeThief('ann', 'Ann Takamaki'), revelations: { ...fullRevelations, space: null } },
      ],
    };
    const filter = projectionFilter(live);
    mockRoster(live, filter);
    const { rerender, container } = renderWithProviders(
      <P5xPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Open slots' }));
    expect(screen.getByText('Ann Takamaki')).toBeInTheDocument();

    // Open the editor, then "equip the fifth card": live data stops matching
    fireEvent.click(screen.getByTitle('Space'));
    live.current = [{ ...makeThief('ann', 'Ann Takamaki'), revelations: fullRevelations }];
    mockRoster(live, filter);
    rerender(<P5xPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);

    expect(container.querySelector('.game-card.is-held')).not.toBeNull();
    expect(screen.getByText(/no longer matches Revelations · Open slots/)).toBeInTheDocument();

    // Editor close is the release point — the card plays its exit animation
    vi.useFakeTimers();
    try {
      fireEvent.click(document.querySelector('.close-btn')!);
      expect(container.querySelector('.game-card.is-exiting')).not.toBeNull();
      act(() => {
        vi.advanceTimersByTime(700);
      });
      expect(screen.queryByText('Ann Takamaki')).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('holds a card that completes Inner Mindscape with the Mindscape · No Inner ghost tag until edit commit', () => {
    const session = createMockSession();
    const live = { current: [{ ...makeThief('ann', 'Ann Takamaki'), mindscapeProgress: 1 }] };
    const filter = projectionFilter(live);
    mockRoster(live, filter);
    const { rerender, container } = renderWithProviders(
      <P5xPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'No Inner' }));
    expect(screen.getByText('Ann Takamaki')).toBeInTheDocument();

    fireEvent.click(screen.getByTitle('Edit'));
    live.current = [{ ...makeThief('ann', 'Ann Takamaki'), mindscapeProgress: 2 }];
    mockRoster(live, filter);
    rerender(<P5xPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);

    expect(container.querySelector('.game-card.is-held')).not.toBeNull();
    expect(screen.getByText(/no longer matches Mindscape · No Inner/)).toBeInTheDocument();

    vi.useFakeTimers();
    try {
      fireEvent.click(screen.getByTitle('Done editing'));
      expect(container.querySelector('.game-card.is-exiting')).not.toBeNull();
      act(() => {
        vi.advanceTimersByTime(700);
      });
      expect(screen.queryByText('Ann Takamaki')).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('holds a card that gains a Target Build with the Revelations · No build ghost tag until the editor closes', () => {
    const session = createMockSession();
    const live: { current: P5xTrackedThief[] } = { current: [makeThief('ann', 'Ann Takamaki')] };
    const filter = projectionFilter(live);
    mockRoster(live, filter);
    const { rerender, container } = renderWithProviders(
      <P5xPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'No build' }));
    expect(screen.getByText('Ann Takamaki')).toBeInTheDocument();

    // Open the editor, then "save a Heavens set": live data stops matching
    fireEvent.click(screen.getByTitle('Space'));
    const base = makeThief('ann', 'Ann Takamaki');
    live.current = [
      {
        ...base,
        revelationPreferences: { ...base.revelationPreferences, heavensSetId: 'power' },
      },
    ];
    mockRoster(live, filter);
    rerender(<P5xPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);

    expect(container.querySelector('.game-card.is-held')).not.toBeNull();
    expect(screen.getByText(/no longer matches Revelations · No build/)).toBeInTheDocument();

    vi.useFakeTimers();
    try {
      fireEvent.click(document.querySelector('.close-btn')!);
      expect(container.querySelector('.game-card.is-exiting')).not.toBeNull();
      act(() => {
        vi.advanceTimersByTime(700);
      });
      expect(screen.queryByText('Ann Takamaki')).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('favorite toggle releases immediately (completed intent)', () => {
    const session = createMockSession();
    const toggleFavorite = vi.fn();
    const live = { current: [makeThief('ann', 'Ann Takamaki')] };
    vi.mocked(useThieves).mockReturnValue({
      ...defaultThievesHook,
      trackedThieves: live.current,
      getFilteredRoster: projectionFilter(live),
      toggleFavorite,
    });
    renderWithProviders(<P5xPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    fireEvent.click(screen.getByTitle('Favorite Phantom Thief'));
    expect(toggleFavorite).toHaveBeenCalledWith('ann', true);
  });

  it('opens the revelation editor from a slot and closing it releases the card', () => {
    const session = createMockSession();
    const live = { current: [makeThief('ann', 'Ann Takamaki')] };
    const filter = projectionFilter(live);
    mockRoster(live, filter);
    renderWithProviders(<P5xPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    fireEvent.click(screen.getByTitle('Sun'));
    expect(screen.getByText('Revelations — Ann Takamaki')).toBeInTheDocument();
    fireEvent.click(document.querySelector('.close-btn')!);
    expect(screen.queryByText('Revelations — Ann Takamaki')).not.toBeInTheDocument();
    // Modal close is a release point — the card stays a normal member
    expect(screen.getByText('Ann Takamaki')).toBeInTheDocument();
  });

  it('wires revelation slot and preference edits from the revelation modal', () => {
    const session = createMockSession();
    const updateRevelationSlot = vi.fn();
    const updateRevelationPreferences = vi.fn();
    const live = { current: [makeThief('ann', 'Ann Takamaki')] };
    vi.mocked(useThieves).mockReturnValue({
      ...defaultThievesHook,
      trackedThieves: live.current,
      getFilteredRoster: projectionFilter(live),
      updateRevelationSlot,
      updateRevelationPreferences,
    });
    const { container } = renderWithProviders(
      <P5xPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    fireEvent.click(screen.getByTitle('Sun'));

    const setSelect = container.querySelector('select[name="rev-sun-set"]') as HTMLSelectElement;
    const firstSet = setSelect.options[1].value;
    fireEvent.change(setSelect, { target: { value: firstSet } });
    expect(updateRevelationSlot).toHaveBeenCalledWith(
      'ann',
      'sun',
      expect.objectContaining({ setId: firstSet }),
    );

    fireEvent.click(screen.getByRole('button', { name: /preferences/i }));
    const spaceSelect = container.querySelector(
      'select[name="rev-pref-space"]',
    ) as HTMLSelectElement;
    const firstSpace = spaceSelect.options[1].value;
    fireEvent.change(spaceSelect, { target: { value: firstSpace } });
    expect(updateRevelationPreferences).toHaveBeenCalledWith(
      'ann',
      expect.objectContaining({ spaceSetId: firstSpace }),
    );
  });

  it('closes the add modal after a thief is added', () => {
    const session = createMockSession();
    const addThief = vi.fn();
    vi.mocked(useThieves).mockReturnValue({
      ...defaultThievesHook,
      availableThieves: [
        {
          id: 'ann-takamaki',
          name: 'Ann Takamaki',
          codename: 'Panther',
          personaName: 'Carmen',
          rarity: 5,
          role: 'Multi-target',
          element: 'Fire',
          imageUrl: '/ann.webp',
        },
      ],
      addThief,
    });
    renderWithProviders(<P5xPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    fireEvent.click(screen.getByTitle('Add Phantom Thief'));
    fireEvent.click(screen.getByText('Ann Takamaki'));
    expect(addThief).toHaveBeenCalled();
    expect(screen.queryByRole('heading', { name: /add phantom thief/i })).not.toBeInTheDocument();
  });
});

describe('P5xPage error surfaces and party load wiring', () => {
  const partiesHook = defaultPartiesHook;

  it('roster Retry retries both the roster and the parties load', () => {
    const retryLoad = vi.fn();
    const retryParties = vi.fn();
    vi.mocked(useThieves).mockReturnValue({ ...defaultThievesHook, isLoadError: true, retryLoad });
    vi.mocked(useParties).mockReturnValue({ ...partiesHook, retryLoad: retryParties });
    renderWithProviders(
      <P5xPage session={createMockSession()} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(retryLoad).toHaveBeenCalledTimes(1);
    expect(retryParties).toHaveBeenCalledTimes(1);
  });

  it('renders the roster error in the error box, not the empty box', () => {
    vi.mocked(useThieves).mockReturnValue({ ...defaultThievesHook, isLoadError: true });
    renderWithProviders(
      <P5xPage session={createMockSession()} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    expect(screen.getByRole('alert')).toHaveClass('error-state');
    expect(document.querySelector('.empty-state')).toBeNull();
  });

  it('parties tab reflects the party hook load state, not the roster load state', () => {
    vi.mocked(useParties).mockReturnValue({ ...partiesHook, isInitialLoad: true });
    renderWithProviders(
      <P5xPage session={createMockSession()} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /parties/i }));
    expect(screen.getByRole('status')).toHaveTextContent('Loading your parties…');
    expect(screen.queryByText(/no parties configured yet/i)).not.toBeInTheDocument();
  });

  it('parties tab Retry retries only the parties load', () => {
    const retryLoad = vi.fn();
    const retryParties = vi.fn();
    vi.mocked(useThieves).mockReturnValue({ ...defaultThievesHook, retryLoad });
    vi.mocked(useParties).mockReturnValue({
      ...partiesHook,
      isLoadError: true,
      retryLoad: retryParties,
    });
    renderWithProviders(
      <P5xPage session={createMockSession()} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /parties/i }));
    expect(screen.getByRole('alert')).toHaveTextContent("Couldn't load your parties.");
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(retryParties).toHaveBeenCalledTimes(1);
    expect(retryLoad).not.toHaveBeenCalled();
  });
});
