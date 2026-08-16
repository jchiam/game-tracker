import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, act } from '@testing-library/react';
import { P5xPage } from './P5xPage';
import { renderWithProviders, createMockSession } from '@/test/utils';
import type { P5xTrackedThief, Party } from '@/types';

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
  isLoading: false,
  saveParty: vi.fn().mockResolvedValue(null),
  deleteParty: vi.fn().mockResolvedValue(true),
  toggleFavoriteParty: vi.fn(),
  refreshParties: vi.fn(),
};

describe('P5xPage', () => {
  beforeEach(() => {
    vi.mocked(useThieves).mockReturnValue(defaultThievesHook);
    vi.mocked(useParties).mockReturnValue(defaultPartiesHook);
  });

  it('shows "Authenticating..." while auth is loading', () => {
    renderWithProviders(<P5xPage session={null} isAuthLoading={true} onSignIn={vi.fn()} />);
    expect(screen.getByText(/authenticating/i)).toBeInTheDocument();
  });

  it('shows AuthGate when there is no session', () => {
    renderWithProviders(<P5xPage session={null} isAuthLoading={false} onSignIn={vi.fn()} />);
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument();
  });

  it('shows "Loading database sync..." during initial load with session', () => {
    vi.mocked(useThieves).mockReturnValue({ ...defaultThievesHook, isInitialLoad: true });
    renderWithProviders(
      <P5xPage session={createMockSession()} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    expect(screen.getByText(/loading database sync/i)).toBeInTheDocument();
  });

  it('shows load error state when isLoadError is true', () => {
    vi.mocked(useThieves).mockReturnValue({ ...defaultThievesHook, isLoadError: true });
    renderWithProviders(
      <P5xPage session={createMockSession()} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    expect(screen.getByText(/failed to load data/i)).toBeInTheDocument();
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

  it('renders the rose-gate filter chip', () => {
    const thieves = [makeThief('ann-takamaki', 'Ann Takamaki')];
    vi.mocked(useThieves).mockReturnValue({
      ...defaultThievesHook,
      trackedThieves: thieves,
      getFilteredRoster: vi.fn().mockReturnValue(thieves),
    });
    renderWithProviders(
      <P5xPage session={createMockSession()} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    expect(screen.getByRole('button', { name: '🌹 Gated' })).toBeInTheDocument();
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
    fireEvent.click(screen.getByRole('button', { name: '🌹 Gated' }));
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
    fireEvent.click(screen.getByRole('button', { name: '🌹 Gated' }));
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
    fireEvent.click(screen.getByRole('button', { name: '⚔ <5★' }));
    expect(screen.getByText(/no thieves with a sub-5★ weapon/i)).toBeInTheDocument();
  });

  it('renders the <5★ weapon filter chip', () => {
    const thieves = [makeThief('ann-takamaki', 'Ann Takamaki')];
    vi.mocked(useThieves).mockReturnValue({
      ...defaultThievesHook,
      trackedThieves: thieves,
      getFilteredRoster: vi.fn().mockReturnValue(thieves),
    });
    renderWithProviders(
      <P5xPage session={createMockSession()} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    expect(screen.getByRole('button', { name: '⚔ <5★' })).toBeInTheDocument();
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
    fireEvent.click(screen.getByRole('button', { name: '⚔ <5★' }));
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
    fireEvent.click(screen.getByRole('button', { name: '🌹 Gated' }));
    fireEvent.click(screen.getByRole('button', { name: '⚔ <5★' }));
    const predicate = mockGetFiltered.mock.calls.at(-1)![2] as (t: P5xTrackedThief) => boolean;
    // rose-gated (skillProgress === 1) AND weapon < 5
    expect(predicate({ ...makeThief('a', 'A'), skillProgress: 1, weaponRarity: 3 })).toBe(true);
    // weak weapon but not rose-gated → excluded
    expect(predicate({ ...makeThief('b', 'B'), skillProgress: 0, weaponRarity: 3 })).toBe(false);
    // rose-gated but 5★ weapon → excluded
    expect(predicate({ ...makeThief('c', 'C'), skillProgress: 1, weaponRarity: 5 })).toBe(false);
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
    fireEvent.click(screen.getByRole('button', { name: '🌹 Gated' }));
    expect(screen.getByText('Ann Takamaki')).toBeInTheDocument();

    // "Complete the gated skill": live data stops matching mid-edit
    fireEvent.click(screen.getByTitle('Edit'));
    live.current = [{ ...makeThief('ann', 'Ann Takamaki'), skillProgress: 2 }];
    mockRoster(live, filter);
    rerender(<P5xPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);

    expect(screen.getByText('Ann Takamaki')).toBeInTheDocument();
    expect(container.querySelector('.game-card.is-held')).not.toBeNull();
    expect(screen.getByText(/no longer matches 🌹 Gated/)).toBeInTheDocument();

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
});
