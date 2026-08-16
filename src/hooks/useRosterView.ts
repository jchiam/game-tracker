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
  /**
   * Filter + sort projection — usually the page's wrapper over the roster
   * hook's `getFilteredRoster`. Runs over `entities` when given (the hook
   * passes basis snapshots), otherwise live state. Must be referentially
   * stable across entity edits; its identity changing is the signal that the
   * projection itself changed (a filter chip toggled) and refreshes all bases.
   */
  filterRoster: (searchTerm: string, sortBy: SortKey, entities?: TEntity[]) => TEntity[];
  /**
   * The live tracked roster. Membership and order come from basis snapshots,
   * but every entity this hook yields is looked up live from this array —
   * held cards keep rendering in-progress edits (Basis Snapshot in
   * CONTEXT.md).
   */
  trackedEntities: TEntity[];
  /**
   * Enables held-card detection (games with predicate filters). Called for an
   * entity whose live data no longer matches the projection its basis still
   * matches; returns the ghost-tag copy naming the failed filter, or null to
   * fall back to a generic label. Wrap in `useCallback` — a fresh identity per
   * render forces an extra projection pass.
   */
  describeHeld?: (entity: TEntity) => string | null;
}

/** Fallback removal delay when no `animationend` arrives for an exiting card. */
const EXIT_FALLBACK_MS = 600;

/**
 * View state of a roster page: roster/second view switch, search term,
 * two-mode sort toggle, add-modal visibility, and the memoized filtered
 * roster. Returns `search` / `sort` / `add` descriptors shaped exactly for
 * `RosterPageLayout`, with the sort button's label and title generated from
 * the configured modes. Pages keep only game-specific state (e.g. HSR's
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
  const { sortModes, searchPlaceholder, addTitle, addDisabled, filterRoster, trackedEntities } =
    config;
  const { describeHeld } = config;
  const defaultMode = sortModes[0];

  const [view, setView] = useState<'roster' | 'second'>('roster');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>(defaultMode.key);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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
      prev.searchTerm !== searchTerm ||
      prev.sortBy !== sortBy ||
      prev.view !== view;
    projKeyRef.current = { filterRoster, searchTerm, sortBy, view };
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
      if (!live) {
        basis.delete(id);
        continue;
      }
      const next = new Map(basis);
      next.set(id, live);
      const wouldStay = filterRoster(searchTerm, sortBy, [...next.values()]).some(
        (e) => e.id === id,
      );
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
    const membership = filterRoster(searchTerm, sortBy, [...basis.values()]);
    const roster: TEntity[] = [];
    for (const b of membership) {
      const live = liveById.get(b.id);
      if (live) roster.push(live);
    }
    membershipIdsRef.current = new Set(roster.map((e) => e.id));

    // Held detection: in the basis membership but out of the live one. Only
    // predicate-filter games configure `describeHeld`; without it the passes
    // can only diverge on order, so the extra projection run is skipped.
    const held = new Map<string, string>();
    if (describeHeld) {
      const liveMembership = new Set(filterRoster(searchTerm, sortBy).map((e) => e.id));
      for (const entity of roster) {
        if (!liveMembership.has(entity.id)) {
          held.set(entity.id, describeHeld(entity) ?? 'No longer matches the active filters');
        }
      }
    }
    return { filteredRoster: roster, heldById: held };
    // projectionVersion is the deliberate re-run trigger for the ref mutations above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filterRoster,
    searchTerm,
    sortBy,
    view,
    trackedEntities,
    liveById,
    describeHeld,
    projectionVersion,
  ]);
  /* eslint-enable react-hooks/refs */

  /** Commit an exiting card's eviction (animationend or fallback timer). */
  const completeExit = useCallback((id: string) => {
    if (!exitingRef.current.has(id)) return;
    exitingRef.current.delete(id);
    const live = liveByIdRef.current.get(id);
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
