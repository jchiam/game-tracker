import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export interface RosterSortMode<SortKey extends string> {
  /** Key passed to `filterRoster` while this mode is active. */
  key: SortKey;
  /** Short label shown on the sort button while active — e.g. "AZ", "Lv", "★". */
  label: string;
  /** Phrase completing "Sorted …" / "click to sort …" — e.g. "alphabetically", "by Level". */
  described: string;
}

/** Minimum shape the view hook needs from a tracked entity. */
export interface RosterViewEntity {
  id: string;
}

/**
 * One predicate-filter chip, declared as data by a game page
 * (`roster-predicate-filter`). The hook derives everything else from the
 * list: chip state, the AND-composed predicate, the held-card ghost-tag copy
 * (`no longer matches {label}`), the no-match message, and the rendered row.
 */
export interface RosterFilterChip<TEntity> {
  /** Stable key — chip state and React keys. */
  key: string;
  /** Chip text; also the ghost-tag suffix on a held card. */
  label: string;
  /** Entities the chip keeps. Pure over the entity. */
  predicate: (entity: TEntity) => boolean;
  /** Tooltip while the chip is inactive — e.g. "Show only rose-gated thieves". */
  onTitle: string;
  /** Tooltip while active; defaults to `Show all {nounPlural}`. */
  offTitle?: string;
  /**
   * No-match copy when this is the only active chip; defaults to the generic
   * `No {nounPlural} match the active filters.`
   */
  noMatch?: string;
}

/** Filter-row descriptor rendered by `RosterPageLayout`. */
export interface RosterViewFilters {
  /** CSS value for `--filter-chip-accent` on the row. */
  accent: string;
  chips: {
    key: string;
    label: string;
    active: boolean;
    title: string;
    toggle: () => void;
  }[];
}

export interface RosterViewConfig<SortKey extends string, TEntity extends RosterViewEntity> {
  /**
   * Sort modes cycled by the single sort button; the first mode is the default.
   * Two or more modes — the button advances to the next on each click and wraps.
   */
  sortModes: [RosterSortMode<SortKey>, ...RosterSortMode<SortKey>[]];
  searchPlaceholder: string;
  /** Tooltip/title of the add button — e.g. "Add Arcanist". */
  addTitle: string;
  /** Disables the add button — pass the roster hook's `isLoadError`. */
  addDisabled: boolean;
  /** Plural entity noun — "thieves", "arcanists" — for tooltip and no-match copy. */
  nounPlural: string;
  /** No-match copy with no chip active; defaults to `No {nounPlural} match your search.` */
  noMatchMessage?: string;
  /** Predicate-filter chips in display order. Omit for games without chips. */
  filterChips?: RosterFilterChip<TEntity>[];
  /** CSS value for `--filter-chip-accent`; defaults to the brand colour. */
  filterAccent?: string;
  /**
   * Filter + sort projection — the page's one-line adapter over the roster
   * hook's `getFilteredRoster`. Receives the AND-composed chip predicate
   * (`undefined` when no chip is active) and runs over `entities` when given
   * (the hook passes basis snapshots), otherwise live state. Must be
   * referentially stable across entity edits — close over nothing
   * chip-related; its identity changing is itself a projection change that
   * refreshes all bases.
   */
  filterRoster: (
    searchTerm: string,
    sortBy: SortKey,
    predicate: ((entity: TEntity) => boolean) | undefined,
    entities?: TEntity[],
  ) => TEntity[];
  /**
   * The live tracked roster. Membership and order come from basis snapshots,
   * but every entity this hook yields is looked up live from this array —
   * held cards keep rendering in-progress edits (Basis Snapshot in
   * CONTEXT.md).
   */
  trackedEntities: TEntity[];
}

/** Fallback removal delay when no `animationend` arrives for an exiting card. */
const EXIT_FALLBACK_MS = 600;

const NO_CHIPS: never[] = [];

/**
 * View state of a roster page: roster/second view switch, search term,
 * sort toggle, add-modal visibility, filter-chip state, and the memoized
 * filtered roster. Returns `search` / `sort` / `add` / `filters` descriptors
 * plus the `noMatchMessage`, shaped exactly for `RosterPageLayout`, with the
 * sort button's label and title generated from the configured modes and the
 * chip row, AND-composed predicate, held-card copy, and no-match copy derived
 * from the declared chips. Pages keep only game-specific state (e.g. HSR's
 * relic editor target).
 *
 * The filtered roster is basis-aware (Projection Stability in CONTEXT.md):
 * membership and order are evaluated against per-entity basis snapshots, so
 * editing an entity never evicts or reorders its card mid-gesture. Projection
 * changes (search, sort, filter identity, view re-entry) refresh all bases
 * immediately; `projection.refreshBasis(id)` is the per-entity release point
 * pages wire to edit commits, modal closes, and favorite toggles.
 */
export function useRosterView<SortKey extends string, TEntity extends RosterViewEntity>(
  config: RosterViewConfig<SortKey, TEntity>,
) {
  const {
    sortModes,
    searchPlaceholder,
    addTitle,
    addDisabled,
    nounPlural,
    filterAccent,
    filterRoster,
    trackedEntities,
  } = config;
  const chips: RosterFilterChip<TEntity>[] = config.filterChips ?? NO_CHIPS;
  const defaultMode = sortModes[0];

  const [view, setView] = useState<'roster' | 'second'>('roster');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>(defaultMode.key);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  // Active chip keys. A toggle always yields a new Set, so identity doubles
  // as the "projection changed" signal below.
  const [activeKeys, setActiveKeys] = useState<ReadonlySet<string>>(() => new Set());
  // Latest chip list, read inside the projection memo so an inline (per
  // render) chip array never counts as a projection change on its own.
  const chipsRef = useRef(chips);
  // eslint-disable-next-line react-hooks/refs
  chipsRef.current = chips;

  // --- Projection stability state ---------------------------------------
  // Basis snapshots: the entity data membership/order is evaluated against.
  const basisRef = useRef<Map<string, TEntity>>(new Map());
  // Ids whose basis a release point asked to refresh. Processed inside the
  // projection memo — never synchronously — so a release fired in the same
  // handler as the state mutation (favorite toggle) sees the fresh live data.
  const pendingRefreshRef = useRef<Set<string>>(new Set());
  // Ids mid exit animation: their (stale) basis is kept so the card stays
  // rendered until `completeExit` commits the eviction.
  const exitingRef = useRef<Set<string>>(new Set());
  const exitTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  // Bumped by release points to re-run the projection after ref mutations.
  const [projectionVersion, setProjectionVersion] = useState(0);
  // Last projection key — a change means the user adjusted the projection
  // itself (chip/search/sort/view), which refreshes all bases immediately.
  const projKeyRef = useRef<{
    filterRoster: typeof filterRoster;
    activeKeys: ReadonlySet<string>;
    searchTerm: string;
    sortBy: SortKey;
    view: 'roster' | 'second';
  } | null>(null);

  const liveById = useMemo(() => new Map(trackedEntities.map((e) => [e.id, e])), [trackedEntities]);
  const liveByIdRef = useRef(liveById);
  // eslint-disable-next-line react-hooks/refs
  liveByIdRef.current = liveById;
  const membershipIdsRef = useRef<Set<string>>(new Set());

  /* eslint-disable react-hooks/refs --
     Render-time basis bookkeeping is the design (design.md D3/D4): the maps in
     these refs are projection working state, not render inputs. Every mutation
     below is idempotent (StrictMode-safe), and everything that changes the
     memo's output is also in its dependency array — release points bump
     `projectionVersion` to re-run it. */
  const { filteredRoster, heldById } = useMemo(() => {
    const basis = basisRef.current;
    const prev = projKeyRef.current;
    const projectionChanged =
      !prev ||
      prev.filterRoster !== filterRoster ||
      prev.activeKeys !== activeKeys ||
      prev.searchTerm !== searchTerm ||
      prev.sortBy !== sortBy ||
      prev.view !== view;
    projKeyRef.current = { filterRoster, activeKeys, searchTerm, sortBy, view };

    // Active chips compose as a logical AND; no active chip = no predicate,
    // preserving the no-predicate fast path in the game's getFilteredRoster.
    const activeChips = chipsRef.current.filter((c) => activeKeys.has(c.key));
    const predicate = activeChips.length
      ? (entity: TEntity) => activeChips.every((c) => c.predicate(entity))
      : undefined;
    const project = (entities?: TEntity[]) => filterRoster(searchTerm, sortBy, predicate, entities);
    if (projectionChanged) {
      // Refresh-all release point: bases realign to live, held/exiting clear.
      basis.clear();
      exitingRef.current.clear();
      pendingRefreshRef.current.clear();
    }
    // Sync bases with the live id set: auto-enroll new entities as live (adds
    // appear immediately), drop removed ids (removes leave immediately).
    for (const entity of trackedEntities) {
      if (!basis.has(entity.id)) basis.set(entity.id, entity);
    }
    for (const id of [...basis.keys()]) {
      if (!liveById.has(id)) {
        basis.delete(id);
        exitingRef.current.delete(id);
      }
    }

    // Process per-entity releases. An eviction keeps the stale basis and marks
    // the id exiting (the card plays `.is-exiting` until completeExit); every
    // other outcome commits basis = live. Idempotent — safe under StrictMode's
    // double render.
    for (const id of [...pendingRefreshRef.current]) {
      pendingRefreshRef.current.delete(id);
      if (!basis.has(id)) continue;
      const live = liveById.get(id);
      /* v8 ignore next 4 -- defensive: the sync loop above already dropped
         bases whose id left the live set, so a pending id with a basis always
         resolves to a live entity */
      if (!live) {
        basis.delete(id);
        continue;
      }
      const next = new Map(basis);
      next.set(id, live);
      const wouldStay = project([...next.values()]).some((e) => e.id === id);
      if (wouldStay) {
        basis.set(id, live);
        exitingRef.current.delete(id);
      } else if (membershipIdsRef.current.has(id)) {
        exitingRef.current.add(id);
      } else {
        // Not rendered — nothing to animate, commit directly.
        basis.set(id, live);
      }
    }

    // Membership and order from the basis; rendered objects always live.
    const membership = project([...basis.values()]);
    const roster: TEntity[] = [];
    for (const b of membership) {
      const live = liveById.get(b.id);
      if (live) roster.push(live);
    }
    membershipIdsRef.current = new Set(roster.map((e) => e.id));

    // Held detection: in the basis membership but out of the live one. Only
    // runs while a chip is active — with none, the passes can only diverge on
    // order, so the extra projection run is skipped. The ghost tag names the
    // first active chip (declaration order) the live data fails.
    const held = new Map<string, string>();
    if (activeChips.length) {
      const liveMembership = new Set(project().map((e) => e.id));
      for (const entity of roster) {
        if (!liveMembership.has(entity.id)) {
          const failed = activeChips.find((c) => !c.predicate(entity));
          held.set(
            entity.id,
            failed ? `no longer matches ${failed.label}` : 'No longer matches the active filters',
          );
        }
      }
    }
    return { filteredRoster: roster, heldById: held };
    // projectionVersion is the deliberate re-run trigger for the ref mutations above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filterRoster,
    activeKeys,
    searchTerm,
    sortBy,
    view,
    trackedEntities,
    liveById,
    projectionVersion,
  ]);
  /* eslint-enable react-hooks/refs */

  /** Commit an exiting card's eviction (animationend or fallback timer). */
  const completeExit = useCallback((id: string) => {
    if (!exitingRef.current.has(id)) return;
    exitingRef.current.delete(id);
    const live = liveByIdRef.current.get(id);
    /* v8 ignore else -- defensive: an exiting id whose entity leaves the live
       set is cleared by the projection sync loop before completeExit can
       observe it missing */
    if (live) basisRef.current.set(id, live);
    else basisRef.current.delete(id);
    setProjectionVersion((v) => v + 1);
  }, []);

  /**
   * Per-entity release point (Release Point in CONTEXT.md): refresh the
   * entity's basis to its live data and re-project it. Wire to edit commits
   * (`GameCardShell.onEditCommit`), equipment-modal closes, and favorite
   * toggles. Processed by the projection memo on the next render, so a
   * release fired alongside the mutation itself (favorite toggle) still sees
   * the fresh data. An eviction plays the exit animation first — the basis is
   * held until `completeExit` (animationend, or the fallback timer).
   */
  const refreshBasis = useCallback((id: string) => {
    pendingRefreshRef.current.add(id);
    setProjectionVersion((v) => v + 1);
  }, []);

  // Keep one fallback timer per exiting id, declaratively: ensure a timer for
  // every exiting id, clear timers whose id stopped exiting, all cleared on
  // unmount.
  useEffect(() => {
    for (const id of exitingRef.current) {
      if (!exitTimersRef.current.has(id)) {
        exitTimersRef.current.set(
          id,
          setTimeout(() => completeExit(id), EXIT_FALLBACK_MS),
        );
      }
    }
    for (const [id, timer] of [...exitTimersRef.current]) {
      if (!exitingRef.current.has(id)) {
        clearTimeout(timer);
        exitTimersRef.current.delete(id);
      }
    }
  });
  useEffect(() => {
    const timers = exitTimersRef.current;
    return () => {
      for (const timer of timers.values()) clearTimeout(timer);
      timers.clear();
    };
  }, []);

  const toggleChip = useCallback((key: string) => {
    setActiveKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  // No-match copy: no chip → the game's default; one chip → its own copy (or
  // generic); two or more → generic. Stops the 2ⁿ-branch page ternary.
  const activeChipList = chips.filter((c) => activeKeys.has(c.key));
  const genericNoMatch = `No ${nounPlural} match the active filters.`;
  const noMatchMessage =
    activeChipList.length === 0
      ? (config.noMatchMessage ?? `No ${nounPlural} match your search.`)
      : activeChipList.length === 1
        ? (activeChipList[0].noMatch ?? genericNoMatch)
        : genericNoMatch;

  const filters: RosterViewFilters | undefined = chips.length
    ? {
        accent: filterAccent ?? 'var(--color-brand-primary)',
        chips: chips.map((c) => {
          const active = activeKeys.has(c.key);
          return {
            key: c.key,
            label: c.label,
            active,
            title: active ? (c.offTitle ?? `Show all ${nounPlural}`) : c.onTitle,
            toggle: () => toggleChip(c.key),
          };
        }),
      }
    : undefined;

  const activeIndex = Math.max(
    0,
    sortModes.findIndex((m) => m.key === sortBy),
  );
  const activeMode = sortModes[activeIndex];
  const nextMode = sortModes[(activeIndex + 1) % sortModes.length];

  return {
    view,
    setView,
    filteredRoster,
    isAddModalOpen,
    closeAddModal: () => setIsAddModalOpen(false),
    search: { value: searchTerm, placeholder: searchPlaceholder, onChange: setSearchTerm },
    sort: {
      active: sortBy === defaultMode.key,
      label: activeMode.label,
      title: `Sorted ${activeMode.described} — click to sort ${nextMode.described}`,
      onToggle: () => setSortBy(nextMode.key),
    },
    add: {
      title: addTitle,
      onClick: () => setIsAddModalOpen(true),
      disabled: addDisabled,
    },
    /** Filter-row descriptor for `RosterPageLayout`; undefined when the game declares no chips. */
    filters,
    /** No-match copy for `RosterPageLayout`, derived from the active chips. */
    noMatchMessage,
    projection: {
      refreshBasis,
      completeExit,
      /** Ghost-tag copy for a held card, or null when the card is a normal member. */
      heldReason: (id: string) => heldById.get(id) ?? null,
      /** Whether the card is playing its exit animation. */
      isExiting: (id: string) => exitingRef.current.has(id),
    },
  };
}
