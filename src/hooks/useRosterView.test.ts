import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRosterView, type RosterViewConfig } from '@/hooks/useRosterView';

type SortKey = 'ALPHA' | 'LEVEL';

interface Ent {
  id: string;
  name: string;
  level: number;
}

const ent = (id: string, name: string, level: number): Ent => ({ id, name, level });

/**
 * Mirrors the real page-level filter chain: project over `entities` when
 * given (basis pass), otherwise live state; optional predicate gate; search;
 * ALPHA / LEVEL sort. Referentially stable unless the predicate changes —
 * exactly like a chip toggle recreating the page's useCallback.
 */
function makeFilter(liveRef: { current: Ent[] }, predicate?: (e: Ent) => boolean) {
  return (term: string, sortBy: SortKey, entities?: Ent[]) => {
    let list = entities ?? liveRef.current;
    if (predicate) list = list.filter(predicate);
    if (term.trim()) list = list.filter((e) => e.name.toLowerCase().includes(term.toLowerCase()));
    return [...list].sort(
      sortBy === 'LEVEL' ? (a, b) => b.level - a.level : (a, b) => a.name.localeCompare(b.name),
    );
  };
}

function makeConfig(
  overrides: Partial<RosterViewConfig<SortKey, Ent>> = {},
): RosterViewConfig<SortKey, Ent> {
  return {
    sortModes: [
      { key: 'ALPHA', label: 'AZ', described: 'alphabetically' },
      { key: 'LEVEL', label: 'Lv', described: 'by Level' },
    ],
    searchPlaceholder: 'Search by name...',
    addTitle: 'Add Thing',
    addDisabled: false,
    filterRoster: vi.fn().mockReturnValue([]),
    trackedEntities: [],
    ...overrides,
  };
}

function setup(overrides: Partial<RosterViewConfig<SortKey, Ent>> = {}) {
  const config = makeConfig(overrides);
  const utils = renderHook(
    (props: { config: RosterViewConfig<SortKey, Ent> }) => useRosterView(props.config),
    { initialProps: { config } },
  );
  return { ...utils, config };
}

/** Full projection-stability harness: live roster + stable filter chain. */
function setupProjection(opts: {
  initial: Ent[];
  predicate?: (e: Ent) => boolean;
  describeHeld?: (e: Ent) => string | null;
}) {
  const liveRef = { current: opts.initial };
  const filterRoster = makeFilter(liveRef, opts.predicate);
  const utils = renderHook(
    (props: { tracked: Ent[]; filterRoster: ReturnType<typeof makeFilter> }) =>
      useRosterView<SortKey, Ent>({
        sortModes: [
          { key: 'ALPHA', label: 'AZ', described: 'alphabetically' },
          { key: 'LEVEL', label: 'Lv', described: 'by Level' },
        ],
        searchPlaceholder: 'Search...',
        addTitle: 'Add',
        addDisabled: false,
        filterRoster: props.filterRoster,
        trackedEntities: props.tracked,
        describeHeld: opts.describeHeld,
      }),
    { initialProps: { tracked: opts.initial, filterRoster } },
  );
  const setLive = (next: Ent[]) => {
    liveRef.current = next;
    utils.rerender({ tracked: next, filterRoster });
  };
  const swapFilter = (predicate?: (e: Ent) => boolean) => {
    const nextFilter = makeFilter(liveRef, predicate);
    utils.rerender({ tracked: liveRef.current, filterRoster: nextFilter });
  };
  return { ...utils, setLive, swapFilter };
}

describe('useRosterView', () => {
  it('starts on the roster view with empty search, default sort, closed modal', () => {
    const { result } = setup();
    expect(result.current.view).toBe('roster');
    expect(result.current.search.value).toBe('');
    expect(result.current.sort.active).toBe(true);
    expect(result.current.isAddModalOpen).toBe(false);
  });

  it('switches view via setView', () => {
    const { result } = setup();
    act(() => result.current.setView('second'));
    expect(result.current.view).toBe('second');
  });

  it('exposes the configured search placeholder and updates the term', () => {
    const filterRoster = vi.fn().mockReturnValue([]);
    const { result } = setup({ filterRoster });
    expect(result.current.search.placeholder).toBe('Search by name...');
    act(() => result.current.search.onChange('vertin'));
    expect(result.current.search.value).toBe('vertin');
    expect(filterRoster).toHaveBeenLastCalledWith('vertin', 'ALPHA', expect.any(Array));
  });

  it('generates the sort descriptor from the default mode', () => {
    const { result } = setup();
    expect(result.current.sort.label).toBe('AZ');
    expect(result.current.sort.title).toBe('Sorted alphabetically — click to sort by Level');
  });

  it('toggling sort switches to the alternate mode and back', () => {
    const filterRoster = vi.fn().mockReturnValue([]);
    const { result } = setup({ filterRoster });

    act(() => result.current.sort.onToggle());
    expect(result.current.sort.active).toBe(false);
    expect(result.current.sort.label).toBe('Lv');
    expect(result.current.sort.title).toBe('Sorted by Level — click to sort alphabetically');
    expect(filterRoster).toHaveBeenLastCalledWith('', 'LEVEL', expect.any(Array));

    act(() => result.current.sort.onToggle());
    expect(result.current.sort.active).toBe(true);
    expect(result.current.sort.label).toBe('AZ');
  });

  it('cycles through three sort modes and wraps back to the default', () => {
    const filterRoster = vi.fn().mockReturnValue([]);
    const threeModes = renderHook(() =>
      useRosterView<'ALPHA' | 'LEVEL' | 'SCORE', Ent>({
        sortModes: [
          { key: 'ALPHA', label: 'AZ', described: 'alphabetically' },
          { key: 'LEVEL', label: 'Lv', described: 'by Level' },
          { key: 'SCORE', label: '★', described: 'by Score' },
        ],
        searchPlaceholder: 'Search...',
        addTitle: 'Add',
        addDisabled: false,
        filterRoster,
        trackedEntities: [],
      }),
    );

    expect(threeModes.result.current.sort.label).toBe('AZ');
    expect(threeModes.result.current.sort.title).toBe(
      'Sorted alphabetically — click to sort by Level',
    );

    act(() => threeModes.result.current.sort.onToggle());
    expect(threeModes.result.current.sort.label).toBe('Lv');
    expect(filterRoster).toHaveBeenLastCalledWith('', 'LEVEL', expect.any(Array));

    act(() => threeModes.result.current.sort.onToggle());
    expect(threeModes.result.current.sort.label).toBe('★');
    expect(threeModes.result.current.sort.active).toBe(false);
    expect(filterRoster).toHaveBeenLastCalledWith('', 'SCORE', expect.any(Array));

    act(() => threeModes.result.current.sort.onToggle());
    expect(threeModes.result.current.sort.label).toBe('AZ');
    expect(threeModes.result.current.sort.active).toBe(true);
    expect(filterRoster).toHaveBeenLastCalledWith('', 'ALPHA', expect.any(Array));
  });

  it('does not re-filter when unrelated state changes', () => {
    const filterRoster = vi.fn().mockReturnValue([]);
    const { result } = setup({ filterRoster });
    filterRoster.mockClear();
    act(() => result.current.add.onClick());
    expect(filterRoster).not.toHaveBeenCalled();
  });

  it('add descriptor carries the configured title and disabled flag', () => {
    const { result } = setup({ addTitle: 'Add Arcanist', addDisabled: true });
    expect(result.current.add.title).toBe('Add Arcanist');
    expect(result.current.add.disabled).toBe(true);
  });

  it('add.onClick opens the modal and closeAddModal closes it', () => {
    const { result } = setup();
    act(() => result.current.add.onClick());
    expect(result.current.isAddModalOpen).toBe(true);
    act(() => result.current.closeAddModal());
    expect(result.current.isAddModalOpen).toBe(false);
  });

  describe('projection stability', () => {
    const inProgress = (e: Ent) => e.level < 10;

    it('projects membership and order from the filter chain', () => {
      const { result } = setupProjection({
        initial: [ent('b', 'Beta', 3), ent('a', 'Alpha', 5)],
      });
      expect(result.current.filteredRoster.map((e) => e.id)).toEqual(['a', 'b']);
    });

    it('an edit neither evicts nor reorders, but yields live content', () => {
      const { result, setLive } = setupProjection({
        initial: [ent('a', 'Alpha', 5), ent('b', 'Beta', 3)],
        predicate: inProgress,
      });
      act(() => result.current.sort.onToggle()); // LEVEL sort: a(5), b(3)
      expect(result.current.filteredRoster.map((e) => e.id)).toEqual(['a', 'b']);

      // Edit b to 15: fails the predicate AND would sort first under LEVEL
      act(() => setLive([ent('a', 'Alpha', 5), ent('b', 'Beta', 15)]));

      // Membership and order unchanged; content live
      expect(result.current.filteredRoster.map((e) => e.id)).toEqual(['a', 'b']);
      expect(result.current.filteredRoster[1].level).toBe(15);
    });

    it('refreshBasis reorders the released entity only', () => {
      const { result, setLive } = setupProjection({
        initial: [ent('a', 'Alpha', 5), ent('b', 'Beta', 3)],
      });
      act(() => result.current.sort.onToggle()); // LEVEL
      act(() => setLive([ent('a', 'Alpha', 5), ent('b', 'Beta', 8)]));
      expect(result.current.filteredRoster.map((e) => e.id)).toEqual(['a', 'b']);

      act(() => result.current.projection.refreshBasis('b'));
      expect(result.current.filteredRoster.map((e) => e.id)).toEqual(['b', 'a']);
    });

    it('refreshBasis on a no-longer-matching entity plays exit then evicts', () => {
      const { result, setLive } = setupProjection({
        initial: [ent('a', 'Alpha', 5)],
        predicate: inProgress,
      });
      act(() => setLive([ent('a', 'Alpha', 15)]));
      expect(result.current.filteredRoster).toHaveLength(1);

      act(() => result.current.projection.refreshBasis('a'));
      // Exit phase: still rendered, marked exiting
      expect(result.current.filteredRoster).toHaveLength(1);
      expect(result.current.projection.isExiting('a')).toBe(true);

      act(() => result.current.projection.completeExit('a'));
      expect(result.current.filteredRoster).toHaveLength(0);
      expect(result.current.projection.isExiting('a')).toBe(false);
    });

    it('search change refreshes all bases and evicts immediately', () => {
      const { result, setLive } = setupProjection({
        initial: [ent('a', 'Alpha', 5), ent('b', 'Beta', 3)],
        predicate: inProgress,
      });
      act(() => setLive([ent('a', 'Alpha', 15), ent('b', 'Beta', 3)]));
      expect(result.current.filteredRoster).toHaveLength(2); // a held

      act(() => result.current.search.onChange('a'));
      // Bases refreshed: a now fails the predicate, gone despite matching 'a'
      expect(result.current.filteredRoster.map((e) => e.id)).toEqual(['b']);
    });

    it('filter identity change (chip toggle) refreshes all bases immediately', () => {
      const { result, setLive, swapFilter } = setupProjection({
        initial: [ent('a', 'Alpha', 5), ent('b', 'Beta', 3)],
        predicate: inProgress,
      });
      act(() => setLive([ent('a', 'Alpha', 15), ent('b', 'Beta', 3)]));
      expect(result.current.filteredRoster).toHaveLength(2); // a held

      act(() => swapFilter(inProgress)); // same gate, new identity — a chip re-toggle
      expect(result.current.filteredRoster.map((e) => e.id)).toEqual(['b']);
    });

    it('an added entity appears immediately', () => {
      const { result, setLive } = setupProjection({ initial: [ent('a', 'Alpha', 5)] });
      act(() => setLive([ent('a', 'Alpha', 5), ent('b', 'Beta', 3)]));
      expect(result.current.filteredRoster.map((e) => e.id)).toEqual(['a', 'b']);
    });

    it('a removed entity drops immediately', () => {
      const { result, setLive } = setupProjection({
        initial: [ent('a', 'Alpha', 5), ent('b', 'Beta', 3)],
      });
      act(() => setLive([ent('a', 'Alpha', 5)]));
      expect(result.current.filteredRoster.map((e) => e.id)).toEqual(['a']);
    });

    it('reports held reason for cards whose live data stopped matching', () => {
      const { result, setLive } = setupProjection({
        initial: [ent('a', 'Alpha', 5), ent('b', 'Beta', 3)],
        predicate: inProgress,
        describeHeld: () => 'no longer matches 💠 Resonating',
      });
      expect(result.current.projection.heldReason('a')).toBeNull();

      act(() => setLive([ent('a', 'Alpha', 15), ent('b', 'Beta', 3)]));
      expect(result.current.projection.heldReason('a')).toBe('no longer matches 💠 Resonating');
      expect(result.current.projection.heldReason('b')).toBeNull();
    });

    it('a held card that matches again returns to normal without a release', () => {
      const { result, setLive } = setupProjection({
        initial: [ent('a', 'Alpha', 5)],
        predicate: inProgress,
        describeHeld: () => 'held',
      });
      act(() => setLive([ent('a', 'Alpha', 15)]));
      expect(result.current.projection.heldReason('a')).toBe('held');

      act(() => setLive([ent('a', 'Alpha', 9)]));
      expect(result.current.projection.heldReason('a')).toBeNull();
      expect(result.current.filteredRoster).toHaveLength(1);
    });

    it('a release fired in the same tick as the mutation sees the fresh data', () => {
      // The favorite-toggle pattern: page mutates state and calls refreshBasis
      // in one handler. The refresh must use the post-mutation live data.
      const { result, setLive } = setupProjection({
        initial: [ent('a', 'Alpha', 5), ent('b', 'Beta', 3)],
      });
      act(() => result.current.sort.onToggle()); // LEVEL: a(5), b(3)

      act(() => {
        setLive([ent('a', 'Alpha', 5), ent('b', 'Beta', 9)]);
        result.current.projection.refreshBasis('b');
      });
      expect(result.current.filteredRoster.map((e) => e.id)).toEqual(['b', 'a']);
    });

    it('a newly qualifying entity appears only after its basis refreshes', () => {
      const maxed = (e: Ent) => e.level >= 10;
      const { result, setLive } = setupProjection({
        initial: [ent('a', 'Alpha', 5)],
        predicate: maxed,
      });
      expect(result.current.filteredRoster).toHaveLength(0);

      act(() => setLive([ent('a', 'Alpha', 15)]));
      expect(result.current.filteredRoster).toHaveLength(0); // deferred

      act(() => result.current.projection.refreshBasis('a'));
      expect(result.current.filteredRoster.map((e) => e.id)).toEqual(['a']);
    });

    it('refreshBasis on an unknown id is a no-op', () => {
      const { result } = setupProjection({ initial: [ent('a', 'Alpha', 5)] });
      act(() => result.current.projection.refreshBasis('ghost'));
      expect(result.current.filteredRoster.map((e) => e.id)).toEqual(['a']);
    });

    it('a refresh queued for an entity removed in the same tick drops cleanly', () => {
      const { result, setLive } = setupProjection({
        initial: [ent('a', 'Alpha', 5), ent('b', 'Beta', 3)],
      });
      act(() => {
        result.current.projection.refreshBasis('b');
        setLive([ent('a', 'Alpha', 5)]);
      });
      expect(result.current.filteredRoster.map((e) => e.id)).toEqual(['a']);
    });

    it('refreshing a non-member that still fails the predicate commits without an exit', () => {
      const maxed = (e: Ent) => e.level >= 10;
      const { result, setLive } = setupProjection({
        initial: [ent('a', 'Alpha', 5)],
        predicate: maxed,
      });
      act(() => setLive([ent('a', 'Alpha', 6)]));
      act(() => result.current.projection.refreshBasis('a'));
      expect(result.current.filteredRoster).toHaveLength(0);
      expect(result.current.projection.isExiting('a')).toBe(false);
    });

    it('completeExit on a non-exiting id is a no-op', () => {
      const { result } = setupProjection({ initial: [ent('a', 'Alpha', 5)] });
      act(() => result.current.projection.completeExit('a'));
      expect(result.current.filteredRoster.map((e) => e.id)).toEqual(['a']);
    });

    it('the fallback timer completes an exit when no animationend arrives', () => {
      vi.useFakeTimers();
      try {
        const inProgressGate = (e: Ent) => e.level < 10;
        const { result, setLive } = setupProjection({
          initial: [ent('a', 'Alpha', 5)],
          predicate: inProgressGate,
        });
        act(() => setLive([ent('a', 'Alpha', 15)]));
        act(() => result.current.projection.refreshBasis('a'));
        expect(result.current.projection.isExiting('a')).toBe(true);

        act(() => vi.advanceTimersByTime(700));
        expect(result.current.filteredRoster).toHaveLength(0);
        expect(result.current.projection.isExiting('a')).toBe(false);
      } finally {
        vi.useRealTimers();
      }
    });

    it('unmount clears pending exit fallback timers', () => {
      vi.useFakeTimers();
      try {
        const inProgressGate = (e: Ent) => e.level < 10;
        const { result, setLive, unmount } = setupProjection({
          initial: [ent('a', 'Alpha', 5)],
          predicate: inProgressGate,
        });
        act(() => setLive([ent('a', 'Alpha', 15)]));
        act(() => result.current.projection.refreshBasis('a'));
        expect(result.current.projection.isExiting('a')).toBe(true);

        unmount();
        // Timer cleared on unmount — firing the clock must not touch state
        expect(() => vi.advanceTimersByTime(700)).not.toThrow();
        expect(vi.getTimerCount()).toBe(0);
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
