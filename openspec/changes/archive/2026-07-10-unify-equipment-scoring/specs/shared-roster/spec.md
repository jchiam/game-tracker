## MODIFIED Requirements

### Requirement: Roster-page view state provided by the shared view hook

Roster-page view state SHALL be provided by the single shared `useRosterView` hook: the roster/second view switch, the search term, a sort toggle that cycles the configured sort modes (two or more; the first configured mode is the default), the add-modal visibility, and the filtered roster memoized over the configured filter function. The hook SHALL generate the `search` / `sort` / `add` descriptors consumed by `RosterPageLayout` from its config (sort modes with key/label/described phrase, search placeholder, add title, add disabled flag), composing the sort button title as `Sorted {active} — click to sort {next}` where `{next}` is the mode the toggle advances to. Game pages SHALL pass config only and SHALL NOT hand-write the view-state fields or descriptor objects; state that is genuinely game-specific (e.g. HSR's relic-editor target) stays in the page.

#### Scenario: Default view state

- **WHEN** a game page mounts
- **THEN** the hook starts on the roster view with an empty search term, the first configured sort mode active, and the add modal closed

#### Scenario: Sort toggle cycles the configured modes

- **WHEN** the sort descriptor's `onToggle` fires
- **THEN** the active sort key advances to the next configured mode, wrapping to the first after the last, the descriptor's `active` flag reflects whether the default (first) mode is active, and its label and title are regenerated from the newly active mode

#### Scenario: Filtered roster tracks search and sort

- **WHEN** the search term or sort mode changes
- **THEN** the filtered roster is recomputed via the configured filter function with the current term and sort key, and is not recomputed when unrelated view state (e.g. the add modal) changes

#### Scenario: Pages contain no duplicated view-state code

- **WHEN** the game pages are searched for local view/search/sort/add-modal `useState` or hand-built sort-descriptor objects
- **THEN** none exists; every page derives them from `useRosterView` config
