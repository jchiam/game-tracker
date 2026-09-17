## ADDED Requirements

### Requirement: Filter chips are declared as data

A game that offers predicate filters SHALL declare each filter chip as a data
descriptor — a stable key, the chip's visible label, the boolean predicate over
the tracked entity, the tooltip shown while the chip is inactive, and
optionally a chip-specific no-match message — and pass the list to the shared
roster view. The tooltip shown while the chip is active SHALL default to
`Show all {nounPlural}`. Game pages SHALL NOT hand-write chip on/off state,
predicate composition, held-card copy, no-match message selection, or chip
markup; all of these derive from the declared list.

#### Scenario: Chips render in declaration order

- **WHEN** a game declares chips A, B, C in that order
- **THEN** the filter row shows A, B, C left to right with their declared labels

#### Scenario: Active tooltip defaults from the plural noun

- **WHEN** a chip declares no active-state tooltip and the game's plural noun is "thieves"
- **THEN** the active chip's tooltip reads `Show all thieves`

#### Scenario: Pages contain no hand-written chip code

- **WHEN** the game pages are searched for chip `useState` pairs, AND-composed predicate ladders, `describeHeld` ladders, or `.filter-chip` markup
- **THEN** none exists; every page passes a chip list and the shared view derives the rest

### Requirement: Active chips compose as a logical AND

When two or more declared chips are active, the composed predicate SHALL be the
logical AND of their predicates: an entity appears only if it satisfies every
active chip. When no chip is active, no predicate SHALL be applied (the
no-predicate path is preserved).

#### Scenario: Two active chips intersect

- **WHEN** chips A and B are both active and an entity satisfies A but not B
- **THEN** that entity is excluded from the roster

#### Scenario: No active chip applies no predicate

- **WHEN** every chip is inactive
- **THEN** the roster shows all entities matching the search term and sort, and no predicate is evaluated

### Requirement: Held-card copy names the first failing active chip

The ghost-tag copy of a held card (see `roster-projection-stability`) SHALL be
`no longer matches {label}` where `{label}` is the label of the first active
chip, in declaration order, whose predicate the entity's live data fails. Held
detection SHALL run only while at least one chip is active.

#### Scenario: First failing chip in declaration order

- **WHEN** chips A and B are active and a held entity fails both
- **THEN** its ghost tag reads `no longer matches {A label}`

#### Scenario: No held detection without active chips

- **WHEN** every chip is inactive and an entity is edited
- **THEN** no entity is reported as held

### Requirement: No-match message derives from the active chips

When tracked entities exist but none match, the no-match message SHALL be
chosen as follows: no active chip — the game's default no-match message;
exactly one active chip — that chip's declared no-match message, or the generic
message when it declares none; two or more active chips — the generic message
`No {nounPlural} match the active filters.`

#### Scenario: Single active chip uses its own copy

- **WHEN** only the "🌹 Gated" chip is active, it declares `No rose-gated thieves found.`, and no thief matches
- **THEN** the roster shows `No rose-gated thieves found.`

#### Scenario: Single active chip without copy uses the generic message

- **WHEN** only a chip that declares no no-match message is active and nothing matches
- **THEN** the roster shows `No {nounPlural} match the active filters.`

#### Scenario: Multiple active chips use the generic message

- **WHEN** two chips are active and nothing matches
- **THEN** the roster shows `No {nounPlural} match the active filters.`

## MODIFIED Requirements

### Requirement: Filter row within toolbar container

When a game declares predicate filter chips, the roster page layout SHALL render
a filter row (`.filter-row`) as a sibling of the roster controls
(`.roster-controls`) inside a shared parent container (`.roster-toolbar`) from
the chip descriptors it is given — games SHALL NOT render the row themselves.
The parent is a flex column that vertically stacks the controls row and filter
row with consistent internal spacing. The filter row contains pill-shaped toggle
chips — visually distinct from the square action buttons but spatially grouped
as part of the same control cluster — and SHALL wrap onto further lines when the
chips exceed the available width. The filter row SHALL only render when tracked
entities exist and at least one chip is declared. The chip accent colour is set
per game on the row.

#### Scenario: Filter row renders within toolbar container

- **WHEN** the roster view has tracked entities and the game declares filter chips
- **THEN** a filter row appears directly below the roster controls within the same parent container

#### Scenario: Chip toggles filter on

- **WHEN** user clicks an inactive filter chip in the filter row
- **THEN** the chip's predicate joins the composed predicate passed to `getFilteredRoster` and the roster narrows

#### Scenario: Chip toggles filter off

- **WHEN** user clicks an active filter chip
- **THEN** the chip's predicate leaves the composed predicate and the roster (matching search, sort, and any other active chip) is shown

#### Scenario: Filter composes with search

- **WHEN** a filter chip is active and the user types a search term
- **THEN** results are the intersection — entities matching BOTH the predicate AND the search

#### Scenario: Filter row hidden when no tracked entities

- **WHEN** the roster has no tracked entities
- **THEN** the filter row is not rendered

#### Scenario: Filter row absent when no chips are declared

- **WHEN** a game declares no filter chips
- **THEN** no filter row is rendered

#### Scenario: Filter row wraps on narrow viewports

- **WHEN** four chips are declared and the toolbar is narrower than their combined width
- **THEN** the chips wrap onto a second line instead of overflowing the toolbar
