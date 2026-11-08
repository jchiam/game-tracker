import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useRosterView,
  type RosterFilterChip,
  type RosterFilterEntry,
  type RosterFilterFacet,
  type RosterViewConfig,
} from '@/hooks/useRosterView';

type SortKey = 'ALPHA' | 'LEVEL';

interface Ent {
  id: string;
  name: string;
  level: number;
}

type Predicate = ((e: Ent) => boolean) | undefined;

const ent = (id: string, name: string, level: number): Ent => ({ id, name, level });

/** Flat chip list across every descriptor row — what the old `filters.chips` was. */
const chipsOf = (filters: { rows: { chips: unknown[] }[] } | undefined) =>
  (filters?.rows ?? []).flatMap((r) => r.chips) as {
    key: string;
    label: string;
    fullLabel: string;
    active: boolean;
    title: string;
    toggle: () => void;
  }[];

/**
 * Mirrors the real page-level filter adapter: project over `entities` when
 * given (basis pass), otherwise live state; the hook-injected predicate gate
 * (plus an optional fixed gate standing in for a game-side filter); search;
 * ALPHA / LEVEL sort. Referentially stable — a fresh identity is itself a
 * projection change.
 */
function makeFilter(liveRef: { current: Ent[] }, fixedGate?: (e: Ent) => boolean) {
  return (term: string, sortBy: SortKey, predicate: Predicate, entities?: Ent[]) => {
    let list = entities ?? liveRef.current;
    if (fixedGate) list = list.filter(fixedGate);
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
    nounPlural: 'things',
    filterRoster: vi.fn().mockReturnValue([]),
    trackedEntities: [],
    ...overrides,
  };
}

const inProgressChip: RosterFilterChip<Ent> = {
  key: 'progress',
  label: '💠 Resonating',
  predicate: (e) => e.level < 10,
  onTitle: 'Show only things in progress',
  noMatch: 'No things in progress.',
};

const lowLevelChip: RosterFilterChip<Ent> = {
  key: 'low',
  label: '⚔ <5',
  predicate: (e) => e.level < 5,
  onTitle: 'Show only low-level things',
};

function setup(overrides: Partial<RosterViewConfig<SortKey, Ent>> = {}) {
  const config = makeConfig(overrides);
  const utils = renderHook(
    (props: { config: RosterViewConfig<SortKey, Ent> }) => useRosterView(props.config),
    { initialProps: { config } },
  );
  return { ...utils, config };
}

/**
 * Full projection-stability harness: live roster + stable filter adapter.
 * `predicate` is a game-side fixed gate (no chip); `chips` declares chips the
 * test toggles through the returned descriptor.
 */
function setupProjection(opts: {
  initial: Ent[];
  predicate?: (e: Ent) => boolean;
  chips?: RosterFilterEntry<Ent>[];
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
        nounPlural: 'things',
        filterChips: opts.chips,
        filterRoster: props.filterRoster,
        trackedEntities: props.tracked,
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
  const toggle = (key: string) =>
    act(() =>
      chipsOf(utils.result.current.filters)
        .find((c) => c.key === key)!
        .toggle(),
    );
  return { ...utils, setLive, swapFilter, toggle };
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
    expect(filterRoster).toHaveBeenLastCalledWith('vertin', 'ALPHA', undefined, expect.any(Array));
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
    expect(filterRoster).toHaveBeenLastCalledWith('', 'LEVEL', undefined, expect.any(Array));

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
        nounPlural: 'things',
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
    expect(filterRoster).toHaveBeenLastCalledWith('', 'LEVEL', undefined, expect.any(Array));

    act(() => threeModes.result.current.sort.onToggle());
    expect(threeModes.result.current.sort.label).toBe('★');
    expect(threeModes.result.current.sort.active).toBe(false);
    expect(filterRoster).toHaveBeenLastCalledWith('', 'SCORE', undefined, expect.any(Array));

    act(() => threeModes.result.current.sort.onToggle());
    expect(threeModes.result.current.sort.label).toBe('AZ');
    expect(threeModes.result.current.sort.active).toBe(true);
    expect(filterRoster).toHaveBeenLastCalledWith('', 'ALPHA', undefined, expect.any(Array));
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

  describe('filter chips', () => {
    it('yields no filters descriptor and the default no-match copy without chips', () => {
      const { result } = setup();
      expect(result.current.filters).toBeUndefined();
      expect(result.current.noMatchMessage).toBe('No things match your search.');
    });

    it('uses the configured default no-match copy when no chip is active', () => {
      const { result } = setup({
        noMatchMessage: 'No phantom things match your search.',
        filterChips: [inProgressChip],
      });
      expect(result.current.noMatchMessage).toBe('No phantom things match your search.');
    });

    it('renders chips in declaration order, inactive, with the accent and on-titles', () => {
      const { result } = setup({
        filterChips: [inProgressChip, lowLevelChip],
        filterAccent: 'var(--color-r1999-accent)',
      });
      const filters = result.current.filters!;
      expect(filters.accent).toBe('var(--color-r1999-accent)');
      const chips = chipsOf(filters);
      expect(chips.map((c) => c.label)).toEqual(['💠 Resonating', '⚔ <5']);
      expect(chips.every((c) => !c.active)).toBe(true);
      expect(chips[0].title).toBe('Show only things in progress');
      // Bare chips coalesce into one unlabelled `any` row
      expect(filters.rows).toHaveLength(1);
      expect(filters.rows[0].label).toBeUndefined();
      expect(filters.rows[0].mode).toBe('any');
    });

    it('defaults the accent to the brand colour', () => {
      const { result } = setup({ filterChips: [inProgressChip] });
      expect(result.current.filters!.accent).toBe('var(--color-brand-primary)');
    });

    it('passes no predicate while no chip is active, the chip predicate when one is on', () => {
      const filterRoster = vi.fn().mockReturnValue([]);
      const { result } = setup({ filterRoster, filterChips: [inProgressChip] });
      expect(filterRoster).toHaveBeenLastCalledWith('', 'ALPHA', undefined, expect.any(Array));

      act(() => chipsOf(result.current.filters)[0].toggle());
      const predicate = filterRoster.mock.calls.at(-1)![2] as (e: Ent) => boolean;
      expect(typeof predicate).toBe('function');
      expect(predicate(ent('a', 'A', 3))).toBe(true);
      expect(predicate(ent('b', 'B', 12))).toBe(false);
      expect(chipsOf(result.current.filters)[0].active).toBe(true);

      act(() => chipsOf(result.current.filters)[0].toggle());
      expect(filterRoster).toHaveBeenLastCalledWith('', 'ALPHA', undefined, expect.any(Array));
      expect(chipsOf(result.current.filters)[0].active).toBe(false);
    });

    it('composes two active chips as a logical AND', () => {
      const filterRoster = vi.fn().mockReturnValue([]);
      const { result } = setup({ filterRoster, filterChips: [inProgressChip, lowLevelChip] });
      act(() => chipsOf(result.current.filters)[0].toggle());
      act(() => chipsOf(result.current.filters)[1].toggle());
      const predicate = filterRoster.mock.calls.at(-1)![2] as (e: Ent) => boolean;
      expect(predicate(ent('a', 'A', 3))).toBe(true); // <10 and <5
      expect(predicate(ent('b', 'B', 7))).toBe(false); // <10 but not <5
      expect(predicate(ent('c', 'C', 12))).toBe(false);
    });

    it('active chip title defaults to "Show all {nounPlural}" and honours offTitle', () => {
      const { result } = setup({
        filterChips: [inProgressChip, { ...lowLevelChip, offTitle: 'Everything, please' }],
      });
      act(() => chipsOf(result.current.filters)[0].toggle());
      act(() => chipsOf(result.current.filters)[1].toggle());
      expect(chipsOf(result.current.filters)[0].title).toBe('Show all things');
      expect(chipsOf(result.current.filters)[1].title).toBe('Everything, please');
    });

    it('single active chip uses its own no-match copy, or the generic copy without one', () => {
      const { result } = setup({ filterChips: [inProgressChip, lowLevelChip] });
      act(() => chipsOf(result.current.filters)[0].toggle());
      expect(result.current.noMatchMessage).toBe('No things in progress.');

      act(() => chipsOf(result.current.filters)[0].toggle());
      act(() => chipsOf(result.current.filters)[1].toggle());
      expect(result.current.noMatchMessage).toBe('No things match the active filters.');
    });

    it('two or more active chips use the generic no-match copy', () => {
      const { result } = setup({ filterChips: [inProgressChip, lowLevelChip] });
      act(() => chipsOf(result.current.filters)[0].toggle());
      act(() => chipsOf(result.current.filters)[1].toggle());
      expect(result.current.noMatchMessage).toBe('No things match the active filters.');
    });

    it('a chip toggle refreshes all bases and narrows immediately', () => {
      const { result, setLive, toggle } = setupProjection({
        initial: [ent('a', 'Alpha', 5), ent('b', 'Beta', 12)],
        chips: [inProgressChip],
      });
      expect(result.current.filteredRoster).toHaveLength(2);

      toggle('progress');
      expect(result.current.filteredRoster.map((e) => e.id)).toEqual(['a']);

      // Held under the chip, then a re-toggle evicts at once
      act(() => setLive([ent('a', 'Alpha', 15), ent('b', 'Beta', 12)]));
      expect(result.current.filteredRoster.map((e) => e.id)).toEqual(['a']); // held
      toggle('progress');
      expect(result.current.filteredRoster).toHaveLength(2);
      toggle('progress');
      expect(result.current.filteredRoster).toHaveLength(0);
    });

    it('an inline chip array does not count as a projection change on its own', () => {
      const liveRef = { current: [ent('a', 'Alpha', 5)] };
      const filterRoster = makeFilter(liveRef);
      const { result, rerender } = renderHook(
        (props: { tracked: Ent[] }) =>
          useRosterView<SortKey, Ent>({
            sortModes: [
              { key: 'ALPHA', label: 'AZ', described: 'alphabetically' },
              { key: 'LEVEL', label: 'Lv', described: 'by Level' },
            ],
            searchPlaceholder: 'Search...',
            addTitle: 'Add',
            addDisabled: false,
            nounPlural: 'things',
            filterChips: [{ ...inProgressChip }], // fresh identity every render
            filterRoster,
            trackedEntities: props.tracked,
          }),
        { initialProps: { tracked: liveRef.current } },
      );
      act(() => chipsOf(result.current.filters)[0].toggle());
      liveRef.current = [ent('a', 'Alpha', 15)];
      rerender({ tracked: liveRef.current });
      // Still held — the rerender with a new chip array did not refresh bases
      expect(result.current.filteredRoster).toHaveLength(1);
      expect(result.current.projection.heldReason('a')).toBe('no longer matches 💠 Resonating');
    });
  });

  describe('chip facets', () => {
    const notStarted: RosterFilterChip<Ent> = {
      key: 'ms0',
      label: 'No Outer',
      predicate: (e) => e.level === 0,
      onTitle: 'Show only not started',
      noMatch: 'None not started.',
    };
    const stuckAtOne: RosterFilterChip<Ent> = {
      key: 'ms1',
      label: 'No Inner',
      predicate: (e) => e.level === 1,
      onTitle: 'Show only stuck at one',
      noMatch: 'None stuck at one.',
    };
    const mindscape: RosterFilterFacet<Ent> = {
      key: 'mindscape',
      label: 'Mindscape',
      mode: 'one',
      chips: [notStarted, stuckAtOne],
    };
    const weapon: RosterFilterFacet<Ent> = {
      key: 'weapon',
      label: 'Weapon',
      mode: 'any',
      chips: [
        lowLevelChip,
        { key: 'odd', label: 'Odd', predicate: (e) => e.level % 2 === 1, onTitle: 'Odd only' },
      ],
    };

    it('emits one row per facet with its label and mode, chips in order', () => {
      const { result } = setup({ filterChips: [weapon, mindscape] });
      const rows = result.current.filters!.rows;
      expect(rows.map((r) => [r.key, r.label, r.mode])).toEqual([
        ['weapon', 'Weapon', 'any'],
        ['mindscape', 'Mindscape', 'one'],
      ]);
      expect(rows[1].chips.map((c) => c.label)).toEqual(['No Outer', 'No Inner']);
    });

    it('coalesces bare chips around facets and drops the label of a single-chip facet', () => {
      const lone: RosterFilterFacet<Ent> = { ...mindscape, key: 'lone', chips: [notStarted] };
      const { result } = setup({
        filterChips: [
          inProgressChip,
          lowLevelChip,
          lone,
          mindscape,
          { ...inProgressChip, key: 'p2' },
        ],
      });
      const rows = result.current.filters!.rows;
      expect(rows.map((r) => [r.label, r.mode, r.chips.map((c) => c.key)])).toEqual([
        [undefined, 'any', ['progress', 'low']],
        [undefined, 'one', ['ms0']],
        ['Mindscape', 'one', ['ms0', 'ms1']],
        [undefined, 'any', ['p2']],
      ]);
    });

    it('activating a sibling in a one facet swaps the active member in one projection change', () => {
      const filterRoster = vi.fn().mockReturnValue([]);
      const { result } = setup({ filterRoster, filterChips: [mindscape] });
      const chips = () => chipsOf(result.current.filters);
      act(() => chips()[0].toggle());
      const callsBefore = filterRoster.mock.calls.length;
      act(() => chips()[1].toggle());
      expect(chips()[0].active).toBe(false);
      expect(chips()[1].active).toBe(true);
      // Every projection pass during the swap already sees the sibling alone
      const swapCalls = filterRoster.mock.calls.slice(callsBefore);
      expect(swapCalls.length).toBeGreaterThan(0);
      for (const call of swapCalls) {
        const predicate = call[2] as (e: Ent) => boolean;
        expect(predicate(ent('a', 'A', 1))).toBe(true);
        expect(predicate(ent('b', 'B', 0))).toBe(false);
      }
      expect(result.current.noMatchMessage).toBe('None stuck at one.');
    });

    it('clicking the active member of a one facet clears it', () => {
      const filterRoster = vi.fn().mockReturnValue([]);
      const { result } = setup({ filterRoster, filterChips: [mindscape] });
      act(() => chipsOf(result.current.filters)[1].toggle());
      act(() => chipsOf(result.current.filters)[1].toggle());
      expect(chipsOf(result.current.filters).every((c) => !c.active)).toBe(true);
      expect(filterRoster).toHaveBeenLastCalledWith('', 'ALPHA', undefined, expect.any(Array));
    });

    it('chips in an any facet toggle independently and AND together', () => {
      const filterRoster = vi.fn().mockReturnValue([]);
      const { result } = setup({ filterRoster, filterChips: [weapon] });
      act(() => chipsOf(result.current.filters)[0].toggle());
      act(() => chipsOf(result.current.filters)[1].toggle());
      expect(chipsOf(result.current.filters).map((c) => c.active)).toEqual([true, true]);
      const predicate = filterRoster.mock.calls.at(-1)![2] as (e: Ent) => boolean;
      expect(predicate(ent('a', 'A', 3))).toBe(true); // <5 and odd
      expect(predicate(ent('b', 'B', 4))).toBe(false); // <5 but even
      expect(predicate(ent('c', 'C', 7))).toBe(false);
    });

    it('a one-facet member ANDs with a bare chip and never with its sibling', () => {
      const filterRoster = vi.fn().mockReturnValue([]);
      const { result } = setup({ filterRoster, filterChips: [lowLevelChip, mindscape] });
      const chips = () => chipsOf(result.current.filters);
      act(() => chips()[1].toggle()); // ms0
      act(() => chips()[2].toggle()); // ms1 replaces ms0
      act(() => chips()[0].toggle()); // low (<5)
      const predicate = filterRoster.mock.calls.at(-1)![2] as (e: Ent) => boolean;
      expect(predicate(ent('a', 'A', 1))).toBe(true); // ms1 and <5
      expect(predicate(ent('b', 'B', 0))).toBe(false); // ms0 is no longer active
      expect(predicate(ent('c', 'C', 7))).toBe(false);
      expect(result.current.noMatchMessage).toBe('No things match the active filters.');
    });

    it('a facet swap is a projection change that refreshes held cards', () => {
      const { result, setLive, toggle } = setupProjection({
        initial: [ent('a', 'Alpha', 0), ent('b', 'Beta', 1)],
        chips: [mindscape],
      });
      toggle('ms0');
      expect(result.current.filteredRoster.map((e) => e.id)).toEqual(['a']);
      act(() => setLive([ent('a', 'Alpha', 1), ent('b', 'Beta', 1)]));
      expect(result.current.projection.heldReason('a')).toBe(
        'no longer matches Mindscape · No Outer',
      );
      toggle('ms1');
      expect(result.current.filteredRoster.map((e) => e.id)).toEqual(['a', 'b']);
      expect(result.current.projection.heldReason('a')).toBeNull();
    });

    it('ghost tag omits the facet label for a bare chip and for a single-chip facet', () => {
      const lone: RosterFilterFacet<Ent> = { ...mindscape, key: 'lone', chips: [notStarted] };
      const { result, setLive, toggle } = setupProjection({
        initial: [ent('a', 'Alpha', 0), ent('b', 'Beta', 5)],
        chips: [lone, inProgressChip],
      });
      toggle('ms0');
      act(() => setLive([ent('a', 'Alpha', 1), ent('b', 'Beta', 5)]));
      expect(result.current.projection.heldReason('a')).toBe('no longer matches No Outer');
      toggle('ms0');
      toggle('progress');
      act(() => setLive([ent('a', 'Alpha', 1), ent('b', 'Beta', 15)]));
      expect(result.current.projection.heldReason('b')).toBe('no longer matches 💠 Resonating');
    });
  });

  describe('collapsible filter block', () => {
    const mindscape: RosterFilterFacet<Ent> = {
      key: 'mindscape',
      label: 'Mindscape',
      mode: 'one',
      chips: [
        { key: 'ms0', label: 'No Outer', predicate: (e) => e.level === 0, onTitle: 'Outer' },
        { key: 'ms1', label: 'No Inner', predicate: (e) => e.level === 1, onTitle: 'Inner' },
      ],
    };

    it('is collapsible only with two or more rows', () => {
      expect(
        setup({ filterChips: [inProgressChip, lowLevelChip] }).result.current.filters!.collapsible,
      ).toBe(false);
      expect(
        setup({ filterChips: [mindscape, inProgressChip] }).result.current.filters!.collapsible,
      ).toBe(true);
    });

    it('starts open without matchMedia, and follows matchMedia when present', () => {
      expect(setup({ filterChips: [mindscape, inProgressChip] }).result.current.filters!.open).toBe(
        true,
      );
      const matchMedia = vi.fn().mockReturnValue({ matches: false });
      vi.stubGlobal('matchMedia', matchMedia);
      try {
        expect(
          setup({ filterChips: [mindscape, inProgressChip] }).result.current.filters!.open,
        ).toBe(false);
        expect(matchMedia).toHaveBeenCalledWith('(min-width: 600px)');
        matchMedia.mockReturnValue({ matches: true });
        expect(
          setup({ filterChips: [mindscape, inProgressChip] }).result.current.filters!.open,
        ).toBe(true);
      } finally {
        vi.unstubAllGlobals();
      }
    });

    it('toggleOpen flips open without re-projecting or releasing a held card', () => {
      const { result, setLive, toggle } = setupProjection({
        initial: [ent('a', 'Alpha', 0), ent('b', 'Beta', 5)],
        chips: [mindscape, inProgressChip],
      });
      toggle('ms0');
      act(() => setLive([ent('a', 'Alpha', 1), ent('b', 'Beta', 5)]));
      expect(result.current.projection.heldReason('a')).toBe(
        'no longer matches Mindscape · No Outer',
      );
      act(() => result.current.filters!.toggleOpen());
      expect(result.current.filters!.open).toBe(false);
      expect(result.current.filteredRoster.map((e) => e.id)).toEqual(['a']);
      expect(result.current.projection.heldReason('a')).toBe(
        'no longer matches Mindscape · No Outer',
      );
      act(() => result.current.filters!.toggleOpen());
      expect(result.current.filters!.open).toBe(true);
    });

    it('toggleOpen does not call the filter function again', () => {
      const filterRoster = vi.fn().mockReturnValue([]);
      const { result } = setup({ filterRoster, filterChips: [mindscape, inProgressChip] });
      const calls = filterRoster.mock.calls.length;
      act(() => result.current.filters!.toggleOpen());
      expect(filterRoster.mock.calls.length).toBe(calls);
    });

    it('summarises active chips in declaration order with facet-composed labels, and remove clears one', () => {
      const { result } = setup({ filterChips: [inProgressChip, mindscape] });
      const chips = () => chipsOf(result.current.filters);
      expect(result.current.filters!.activeCount).toBe(0);
      expect(result.current.filters!.active).toEqual([]);
      act(() => chips()[2].toggle()); // ms1
      act(() => chips()[0].toggle()); // progress
      expect(result.current.filters!.activeCount).toBe(2);
      expect(result.current.filters!.active.map((a) => a.label)).toEqual([
        '💠 Resonating',
        'Mindscape · No Inner',
      ]);
      expect(chips().map((c) => c.fullLabel)).toEqual([
        '💠 Resonating',
        'Mindscape · No Outer',
        'Mindscape · No Inner',
      ]);
      act(() => result.current.filters!.active[1].remove());
      expect(result.current.filters!.active.map((a) => a.label)).toEqual(['💠 Resonating']);
      expect(chips()[2].active).toBe(false);
    });
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

    it('reports held reason naming the failed chip for cards whose live data stopped matching', () => {
      const { result, setLive, toggle } = setupProjection({
        initial: [ent('a', 'Alpha', 5), ent('b', 'Beta', 3)],
        chips: [inProgressChip],
      });
      toggle('progress');
      expect(result.current.projection.heldReason('a')).toBeNull();

      act(() => setLive([ent('a', 'Alpha', 15), ent('b', 'Beta', 3)]));
      expect(result.current.projection.heldReason('a')).toBe('no longer matches 💠 Resonating');
      expect(result.current.projection.heldReason('b')).toBeNull();
    });

    it('names the first failing active chip in declaration order', () => {
      const { result, setLive, toggle } = setupProjection({
        initial: [ent('a', 'Alpha', 3)],
        chips: [inProgressChip, lowLevelChip],
      });
      toggle('progress');
      toggle('low');
      act(() => setLive([ent('a', 'Alpha', 15)])); // fails both
      expect(result.current.projection.heldReason('a')).toBe('no longer matches 💠 Resonating');

      act(() => setLive([ent('a', 'Alpha', 7)])); // fails only ⚔ <5
      expect(result.current.projection.heldReason('a')).toBe('no longer matches ⚔ <5');
    });

    it('falls back to the generic held label when no active chip explains the eviction', () => {
      // A game-side gate (not a chip) evicts while every active chip still passes.
      const { result, setLive, toggle } = setupProjection({
        initial: [ent('a', 'Alpha', 5)],
        predicate: inProgress,
        chips: [{ ...lowLevelChip, predicate: () => true }],
      });
      toggle('low');
      act(() => setLive([ent('a', 'Alpha', 15)]));
      expect(result.current.projection.heldReason('a')).toBe(
        'No longer matches the active filters',
      );
    });

    it('does not report held cards while no chip is active', () => {
      const { result, setLive } = setupProjection({
        initial: [ent('a', 'Alpha', 5)],
        predicate: inProgress,
        chips: [inProgressChip],
      });
      act(() => setLive([ent('a', 'Alpha', 15)]));
      expect(result.current.filteredRoster).toHaveLength(1); // held by the fixed gate
      expect(result.current.projection.heldReason('a')).toBeNull();
    });

    it('a held card that matches again returns to normal without a release', () => {
      const { result, setLive, toggle } = setupProjection({
        initial: [ent('a', 'Alpha', 5)],
        chips: [inProgressChip],
      });
      toggle('progress');
      act(() => setLive([ent('a', 'Alpha', 15)]));
      expect(result.current.projection.heldReason('a')).toBe('no longer matches 💠 Resonating');

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
