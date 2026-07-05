## Purpose

Shared entity tracking lifecycle used by all game modules via `useRoster`. Covers loading from DB, optimistic add/remove with dedup guards, Fuse.js fuzzy search, and favorited-first sort. Also covers the shared roster-page view state (`useRosterView`): view switch, search term, sort toggle, add-modal visibility, and the memoized filtered roster consumed by `RosterPageLayout`.

## Requirements

### Requirement: Load roster from DB on session change

The system SHALL load tracked entities from the DB when a user session becomes available, and clear the roster when the session is lost.

#### Scenario: Session available on mount

- **WHEN** a valid user session is present and auth loading is complete
- **THEN** tracked entities are fetched from DB and stored in roster state

#### Scenario: Session lost

- **WHEN** the user session becomes null
- **THEN** roster state is cleared to an empty array and initial load is marked complete

#### Scenario: DB load fails

- **WHEN** the DB fetch rejects
- **THEN** `isLoadError` is set to true and `isInitialLoad` is set to false

### Requirement: Retry on load failure

The system SHALL allow the user to retry a failed roster load without reloading the page.

#### Scenario: Retry triggered

- **WHEN** user triggers a retry after a load error
- **THEN** `isLoadError` resets to false, `isInitialLoad` resets to true, and the DB fetch is attempted again

### Requirement: Add entity to roster

The system SHALL add a tracked entity to the roster optimistically and persist it to the DB. Duplicate adds and in-flight adds for the same entity SHALL be no-ops.

#### Scenario: Successful add

- **WHEN** authenticated user adds an entity not already in the roster
- **THEN** entity appears in roster immediately (optimistic), DB insert fires in background, and `dbId` is set on the entity once the insert resolves

#### Scenario: Duplicate add ignored

- **WHEN** user adds an entity already present in `trackedEntities`
- **THEN** no state change and no DB insert

#### Scenario: In-flight add ignored

- **WHEN** user adds an entity whose insert is already in flight
- **THEN** no state change and no duplicate DB insert

#### Scenario: Add fails

- **WHEN** the DB insert rejects after optimistic add
- **THEN** entity is removed from roster and an error toast is shown

#### Scenario: Add while unauthenticated

- **WHEN** user attempts to add an entity with no active session
- **THEN** a warning toast is shown and no state change occurs

### Requirement: Remove entity from roster

The system SHALL remove a tracked entity from the roster optimistically and delete it from the DB.

#### Scenario: Successful remove

- **WHEN** user removes an entity with a `dbId`
- **THEN** entity is removed from roster immediately and DB delete fires in background

#### Scenario: Remove entity without dbId

- **WHEN** user removes an entity that has no `dbId` (insert never resolved)
- **THEN** entity is removed from local roster only; no DB delete is attempted

#### Scenario: Remove fails

- **WHEN** the DB delete rejects
- **THEN** entity is restored to roster and an error toast is shown

### Requirement: Fuzzy search roster

The system SHALL filter the roster using Fuse.js fuzzy search when a non-empty search term is provided.

#### Scenario: Search with term

- **WHEN** a non-empty search term is provided
- **THEN** roster is filtered using Fuse.js with threshold 0.3 against the configured search keys

#### Scenario: Empty search term

- **WHEN** search term is empty or whitespace-only
- **THEN** full roster is returned without filtering

### Requirement: Sort roster favorited-first

The system SHALL sort the filtered roster with favorited entities first, an optional game-specific secondary comparator second, and alphabetical by name as the final tiebreak.

#### Scenario: Favorited entities sorted first

- **WHEN** roster contains a mix of favorited and non-favorited entities
- **THEN** favorited entities appear before non-favorited entities regardless of name

#### Scenario: Secondary comparator applied within same favorite group

- **WHEN** a secondary comparator is provided and two entities have the same favorite status
- **THEN** secondary comparator result determines their relative order

#### Scenario: Alphabetical tiebreak

- **WHEN** two entities have the same favorite status and secondary comparator returns 0
- **THEN** entities are ordered alphabetically by name

### Requirement: Roster-page view state provided by the shared view hook

Roster-page view state SHALL be provided by the single shared `useRosterView` hook: the roster/second view switch, the search term, a two-mode sort toggle (first configured mode is the default), the add-modal visibility, and the filtered roster memoized over the configured filter function. The hook SHALL generate the `search` / `sort` / `add` descriptors consumed by `RosterPageLayout` from its config (sort modes with key/label/described phrase, search placeholder, add title, add disabled flag), composing the sort button title as `Sorted {active} — click to sort {inactive}`. Game pages SHALL pass config only and SHALL NOT hand-write the view-state fields or descriptor objects; state that is genuinely game-specific (e.g. HSR's relic-editor target) stays in the page.

#### Scenario: Default view state

- **WHEN** a game page mounts
- **THEN** the hook starts on the roster view with an empty search term, the first configured sort mode active, and the add modal closed

#### Scenario: Sort toggle cycles the two configured modes

- **WHEN** the sort descriptor's `onToggle` fires
- **THEN** the active sort key switches to the other configured mode, the descriptor's `active` flag reflects whether the default mode is active, and its label and title are regenerated from the newly active mode

#### Scenario: Filtered roster tracks search and sort

- **WHEN** the search term or sort mode changes
- **THEN** the filtered roster is recomputed via the configured filter function with the current term and sort key, and is not recomputed when unrelated view state (e.g. the add modal) changes

#### Scenario: Pages contain no duplicated view-state code

- **WHEN** the game pages are searched for local view/search/sort/add-modal `useState` or hand-built sort-descriptor objects
- **THEN** none exists; every page derives them from `useRosterView` config
