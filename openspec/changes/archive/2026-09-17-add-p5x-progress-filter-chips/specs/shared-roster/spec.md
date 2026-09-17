## MODIFIED Requirements

### Requirement: Roster-page view state provided by the shared view hook

Roster-page view state SHALL be provided by the single shared `useRosterView` hook: the roster/second view switch, the search term, a sort toggle that cycles the configured sort modes (two or more; the first configured mode is the default), the add-modal visibility, the filter-chip state, and the filtered roster memoized over the configured filter function. The hook SHALL generate the `search` / `sort` / `add` / `filters` descriptors consumed by `RosterPageLayout` from its config (sort modes with key/label/described phrase, search placeholder, add title, add disabled flag, the plural entity noun, and the optional filter-chip list with its accent colour), composing the sort button title as `Sorted {active} — click to sort {next}` where `{next}` is the mode the toggle advances to. From the declared chips the hook SHALL derive the AND-composed predicate it passes to the configured filter function, the held-card description, the no-match message, and each chip's active flag, tooltip, and toggle (see `roster-predicate-filter`). Game pages SHALL pass config only and SHALL NOT hand-write the view-state fields, descriptor objects, chip state, predicate composition, or no-match selection; state that is genuinely game-specific (e.g. HSR's relic-editor target) stays in the page.

The filtered roster SHALL be basis-aware (see `roster-projection-stability`): membership and order are evaluated against per-entity basis snapshots, while each returned entity object is the live tracked entity. Entity edits therefore do not immediately re-project the grid; projection changes (search term, sort mode, chip toggle) and other release points refresh bases and re-project immediately. The hook SHALL expose the release operations pages wire to their release points (per-entity basis refresh, refresh-all).

#### Scenario: Default view state

- **WHEN** a game page mounts
- **THEN** the hook starts on the roster view with an empty search term, the first configured sort mode active, every filter chip inactive, and the add modal closed

#### Scenario: Sort toggle cycles the configured modes

- **WHEN** the sort descriptor's `onToggle` fires
- **THEN** the active sort key advances to the next configured mode, wrapping to the first after the last, the descriptor's `active` flag reflects whether the default (first) mode is active, and its label and title are regenerated from the newly active mode

#### Scenario: Filtered roster tracks search and sort

- **WHEN** the search term, sort mode, or a chip's active state changes
- **THEN** the filtered roster is recomputed immediately (all bases refreshed) via the configured filter function with the current term, sort key, and composed predicate, and is not recomputed when unrelated view state (e.g. the add modal) changes

#### Scenario: Chip toggle is a projection change

- **WHEN** a chip's toggle fires while an entity is held
- **THEN** every basis is refreshed and the held state clears — the grid re-projects against live data

#### Scenario: Entity edit does not re-project

- **WHEN** a tracked entity's data changes without any release point firing
- **THEN** the filtered roster keeps its previous membership and order, but the entity objects it yields reflect the live edit

#### Scenario: Per-entity basis refresh re-projects that entity

- **WHEN** a page fires the per-entity basis refresh (edit commit, modal close, favorite toggle)
- **THEN** that entity's membership and position are re-evaluated against its live data while other entities' bases are untouched

#### Scenario: Pages contain no duplicated view-state code

- **WHEN** the game pages are searched for local view/search/sort/add-modal/chip `useState`, hand-built sort-descriptor objects, predicate ladders, or no-match ternaries
- **THEN** none exists; every page derives them from `useRosterView` config

#### Scenario: Games without chips are unaffected

- **WHEN** a game passes no filter-chip list
- **THEN** the `filters` descriptor is absent, no predicate is passed to the filter function, and the no-match message is the game's default
