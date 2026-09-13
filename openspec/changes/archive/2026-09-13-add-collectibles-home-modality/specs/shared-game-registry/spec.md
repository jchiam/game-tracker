## MODIFIED Requirements

### Requirement: Single game registry drives routes, switcher, and selection page

The system SHALL declare every trackable game exactly once, in the `GAMES` array in
`src/lib/games.ts`. Each entry SHALL carry the game's `id`, `name`, `path`,
`developer`, `description`, `icon`, `color`, `coverImage`, `bgClass`, a `modality`
(a `TrackerModality` id declared in `src/lib/modalities.ts` — see
`shared-tracker-modality`), and a lazy `Page` component typed against the shared
`GamePageProps` (`session`, `isAuthLoading`, `onSignIn`). `App.tsx` SHALL generate one
route per entry, and `GameSwitcher` and `SelectionPage` SHALL render from the same
array (grouped by modality through `gamesByModality()`) — no consumer keeps a private
game list.

#### Scenario: Route generated per entry

- **WHEN** the app renders
- **THEN** each registry entry produces a `<Route>` at its `path` rendering its lazy
  `Page` with the shared page props, and per-game chunks remain code-split

#### Scenario: Adding a game is one registry entry

- **WHEN** a new game module is wired into the app
- **THEN** adding its `GAMES` entry (including its `modality`) makes it appear in the
  router, the correct game-switcher group, and the correct selection-page section
  without touching those consumers

#### Scenario: Registry invariants hold

- **WHEN** the registry unit tests run
- **THEN** they verify entries have unique `id`s and `path`s, complete non-empty
  metadata fields, and a `modality` that exists in `MODALITIES`
