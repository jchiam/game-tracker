import { useMemo, useState } from 'react';

export interface RosterSortMode<SortKey extends string> {
  /** Key passed to `filterRoster` while this mode is active. */
  key: SortKey;
  /** Short label shown on the sort button while active — e.g. "AZ", "Lv", "★". */
  label: string;
  /** Phrase completing "Sorted …" / "click to sort …" — e.g. "alphabetically", "by Level". */
  described: string;
}

export interface RosterViewConfig<SortKey extends string, TEntity> {
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
   * Filter + sort over the tracked roster — usually the roster hook's
   * `getFilteredRoster`, which is `useCallback`-stable. Must be
   * referentially stable or the filtered-roster memo is defeated.
   */
  filterRoster: (searchTerm: string, sortBy: SortKey) => TEntity[];
}

/**
 * View state of a roster page: roster/second view switch, search term,
 * two-mode sort toggle, add-modal visibility, and the memoized filtered
 * roster. Returns `search` / `sort` / `add` descriptors shaped exactly for
 * `RosterPageLayout`, with the sort button's label and title generated from
 * the configured modes. Pages keep only game-specific state (e.g. HSR's
 * relic editor target).
 */
export function useRosterView<SortKey extends string, TEntity>(
  config: RosterViewConfig<SortKey, TEntity>,
) {
  const { sortModes, searchPlaceholder, addTitle, addDisabled, filterRoster } = config;
  const defaultMode = sortModes[0];

  const [view, setView] = useState<'roster' | 'second'>('roster');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>(defaultMode.key);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const filteredRoster = useMemo(
    () => filterRoster(searchTerm, sortBy),
    [filterRoster, searchTerm, sortBy],
  );

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
  };
}
