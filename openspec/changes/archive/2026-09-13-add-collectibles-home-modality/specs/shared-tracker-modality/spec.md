## ADDED Requirements

### Requirement: Modality registry declares the ordered set of tracker modalities

The system SHALL declare every Tracker Modality exactly once, in the ordered `MODALITIES` array in `src/lib/modalities.ts`. Each entry SHALL carry an `id` (the `TrackerModality` union: `'roster' | 'collection'`), a `title` shown as the home-page section heading, and a `subtitle` shown beneath it. Array order is display order everywhere modalities are listed.

#### Scenario: Registry accessible at runtime

- **WHEN** any module imports `MODALITIES` from `@/lib/modalities`
- **THEN** it receives the ordered array with `roster` first and `collection` second, each with non-empty `title` and `subtitle`

#### Scenario: Modality ids are unique

- **WHEN** the modality registry unit tests run
- **THEN** they verify every `id` is unique and every `title` / `subtitle` is non-empty

### Requirement: Games are grouped by modality through one shared helper

The system SHALL expose `gamesByModality()` from `src/lib/modalities.ts`, returning `{ modality, games }[]` in `MODALITIES` order where `games` is the `GAMES` entries whose `modality` equals that id, preserving `GAMES` order within each group. Modalities with no games SHALL be omitted. `SelectionPage` and `GameSwitcher` SHALL consume this helper and SHALL NOT filter `GAMES` by modality themselves.

#### Scenario: Populated modalities returned in order

- **WHEN** `GAMES` contains six `roster` games and one `collection` game
- **THEN** `gamesByModality()` returns two groups, `roster` first with the six games in registry order, then `collection` with the one game

#### Scenario: Empty modality omitted

- **WHEN** no `GAMES` entry references a modality
- **THEN** that modality does not appear in the result

### Requirement: Home page renders one section per populated modality

`SelectionPage` SHALL render, for each group returned by `gamesByModality()`, a `section.selection-section` containing a `.selection-section-header` (an `h2.selection-section-title` with the modality title and a `p.selection-section-subtitle` with the subtitle) followed by a `.selection-grid` of that modality's game cards. The page hero SHALL be tracker-neutral: title "Your Trackers", subtitle "Pick something to track." Card content, the sign-in redirect on click, the "Requires Login" badge, and the auth-loading state are unchanged.

#### Scenario: Two populated modalities render two sections

- **WHEN** the selection page renders with `roster` and `collection` games registered and a session present
- **THEN** it renders a "Live-Service Rosters" section containing the six roster cards and a "Collections" section containing the collection card, in that order

#### Scenario: Section headings are level-two headings

- **WHEN** the selection page renders
- **THEN** the page has exactly one `h1` (the hero title) and one `h2` per rendered modality section, each `h2` text equal to the modality title

#### Scenario: Card click behaviour unchanged across sections

- **WHEN** a signed-out user clicks a card in any section
- **THEN** `signInWithGoogle` is called with that game's `path`, exactly as before sectioning

### Requirement: Game switcher groups entries by modality

`GameSwitcher` SHALL render its dropdown list as one `.dropdown-group` per group returned by `gamesByModality()`, each starting with a `.dropdown-group-label` containing the modality title, followed by that modality's `.dropdown-item` links in registry order. The dropdown header reads "Switch Tracker". Active-item highlighting by path prefix, outside-click close, the "Back to Selection" footer, and rendering `null` on `/` are unchanged.

#### Scenario: Grouped dropdown

- **WHEN** the switcher is opened on a game route
- **THEN** the list shows the "Live-Service Rosters" label followed by the roster games, then the "Collections" label followed by the collection games

#### Scenario: Active collection game highlighted

- **WHEN** the current path starts with a collection game's `path`
- **THEN** that item carries the `active` class and the trigger shows its icon
