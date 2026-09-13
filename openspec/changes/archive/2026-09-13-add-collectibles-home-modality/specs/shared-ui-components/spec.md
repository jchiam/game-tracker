## MODIFIED Requirements

### Requirement: GameSwitcher renders the game dropdown and hides on selection

The shared `GameSwitcher` component SHALL render a `.game-switcher` dropdown driven by
the shared `GAMES` registry (`src/lib/games.ts`) grouped by Tracker Modality via
`gamesByModality()` (`src/lib/modalities.ts`) — one `.dropdown-group` with a
`.dropdown-group-label` per populated modality, in modality order — highlight the
active game by path prefix, close on outside click, and render `null` on the selection
page (`location.pathname === '/'`).

#### Scenario: Hidden on the selection page

- **WHEN** the current route is `/`
- **THEN** `GameSwitcher` renders nothing

#### Scenario: Active game highlighted

- **WHEN** the current path starts with a game's `path`
- **THEN** that game's dropdown item carries the `active` class and the trigger shows its icon

#### Scenario: Items grouped under modality labels

- **WHEN** the dropdown is open
- **THEN** every `.dropdown-item` is a descendant of a `.dropdown-group` whose label is its game's modality title, and groups appear in `MODALITIES` order
