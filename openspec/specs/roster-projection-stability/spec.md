## Purpose

Shared design pattern keeping the roster grid stable under a user's hand: membership and order changes caused by _editing an entity_ are deferred to an explicit release point, while changes caused by _adjusting the projection_ (filter chips, search, sort) stay immediate. Covers basis snapshots, release points, the held-card affordance, and the exit animation.

## Requirements

### Requirement: Edit-versus-projection principle

Roster grid changes SHALL be classified by their cause. A change caused by the user adjusting the projection (toggling a filter chip, typing a search term, cycling the sort mode) SHALL apply to the grid immediately. A change caused by the user editing an entity's data (sliders, steppers, selects, equipment edits) SHALL NOT evict or reorder that entity's card until a release point.

#### Scenario: Entity edit does not evict mid-gesture

- **WHEN** a predicate filter is active and the user edits a card's field such that the entity no longer matches the predicate
- **THEN** the card remains in the grid at its current position

#### Scenario: Chip toggle evicts immediately

- **WHEN** the user toggles a filter chip
- **THEN** the grid immediately reflects the new predicate against current entity data, including cards previously held

#### Scenario: Search typing evicts immediately

- **WHEN** the user types a search term while a card is in edit mode and the card does not match the term
- **THEN** the card leaves the grid immediately (edit state is lost with the unmount)

### Requirement: Basis snapshot separates membership from content

Each tracked entity SHALL have a basis snapshot — the entity data against which the projection (predicate membership, sort order) is evaluated. The rendered card content SHALL always come from live entity state, never from the basis snapshot, so in-progress edits stay visible and interactive on a held card.

#### Scenario: Held card renders live values

- **WHEN** a card is held (its live data no longer matches the active predicate) and the user continues adjusting a slider
- **THEN** the card displays and persists the live values; only its grid membership and position reflect the basis snapshot

#### Scenario: Newly qualifying entity appears at next basis refresh

- **WHEN** an entity's data is edited such that it newly matches an active predicate filter
- **THEN** its card appears in the grid at the next release point that refreshes its basis, not immediately

### Requirement: Release points refresh the basis

An entity's basis snapshot SHALL be refreshed to its live data at these release points: the card's edit-mode commit (collapsing edit mode), an equipment-editor modal for that entity closing, and the favorite toggle firing for that entity. All entities' bases SHALL be refreshed when the projection changes (filter chip, search term, sort mode), when the roster view is re-entered (view switch or navigation), and when the roster reloads from the DB.

#### Scenario: Edit commit releases the card

- **WHEN** the user collapses a held card's edit mode via the edit toggle
- **THEN** the entity's basis is refreshed and, if it no longer matches the active projection, the card exits the grid

#### Scenario: Equipment modal close releases the card

- **WHEN** an equipment-editor modal is closed after edits that changed the entity's match against the active projection
- **THEN** the entity's basis is refreshed and the grid re-projects that entity

#### Scenario: Favorite toggle is a completed intent

- **WHEN** the user toggles a card's favorite star
- **THEN** the entity's basis is refreshed immediately and the favorited-first reorder happens without waiting for any other release point

### Requirement: Held-card affordance and exit animation

A card whose live data no longer matches an active predicate filter SHALL be visually marked as held: dimmed, with a ghost tag naming the filter it no longer matches (e.g. "no longer matches 💠 Resonating"). On release, an evicted card SHALL exit with a fade/collapse animation. All motion SHALL honour the global `prefers-reduced-motion` kill switch.

#### Scenario: Held card is marked

- **WHEN** a card becomes held under an active filter chip
- **THEN** the card dims and shows a ghost tag naming the no-longer-matched filter

#### Scenario: Held card returns to normal when matching again

- **WHEN** further edits make a held card's live data match the active predicate again
- **THEN** the dim and ghost tag are removed and the card is a normal member (no release needed)

#### Scenario: Reduced motion suppresses exit animation

- **WHEN** the user agent reports `prefers-reduced-motion: reduce` and a held card is released
- **THEN** the card is removed without animation

### Requirement: Order stability under active edit

While a card is in edit mode, edits to its fields SHALL NOT reorder the grid, in every game and under every sort mode (including LEVEL/SCORE sorts keyed on the edited field). The entity's position re-evaluates at its release points. This applies to all games regardless of whether they define predicate filters.

#### Scenario: Level slider does not re-sort mid-drag

- **WHEN** the LEVEL sort mode is active and the user drags a card's level slider in edit mode
- **THEN** the card keeps its grid position until edit mode is committed

#### Scenario: Position updates on commit

- **WHEN** the user commits edit mode after raising a level under the LEVEL sort
- **THEN** the card moves to its new sorted position
