## Purpose

Persona 5: The Phantom X (P5X) per-Thief tracked fields. Covers level (1–80),
Awareness (0–6 duplicate ranks, shown as A0–A6), favorite toggle, level-based sort,
search keys (name, codename, personaName, role, element), and the Thief card's
collapsed-summary composition (investment-gradient chips, role/element badges,
bound-Persona static line, no rarity indicator).

## Requirements

### Requirement: Thief level field

The system SHALL track a Thief's level as an integer in the range 1–80, defaulting
to 1 on add. Updates SHALL be clamped to this range before persisting. 80 is the
current live-game cap; a future cap raise is a paired slider-max + DB CHECK change.

#### Scenario: Level updated within range

- **WHEN** user sets a Thief's level to a value between 1 and 80 inclusive
- **THEN** level is updated in local state immediately and queued for DB write via debounced save

#### Scenario: Level clamped below minimum

- **WHEN** user sets a Thief's level below 1
- **THEN** level is clamped to 1 before update

#### Scenario: Level clamped above maximum

- **WHEN** user sets a Thief's level above 80
- **THEN** level is clamped to 80 before update

### Requirement: Thief awareness field

The system SHALL track a Thief's Awareness (duplicate rank) as an integer in the
range 0–6, defaulting to 0 on add. Updates SHALL be clamped to this range before
persisting. Awareness 0 represents no duplicates; 6 is the maximum. The UI SHALL
present ranks as `A0`–`A6`.

The awareness control SHALL be a `SegmentedButtons` row with investment coloring.
Buttons SHALL stretch to equal width via `flex: 1` with no wrapping — all seven
buttons fit on a single line, matching the uniform-stretch pattern used by AE's
phase row and R1999's portrait row.

#### Scenario: Awareness updated within range

- **WHEN** user sets a Thief's awareness to a value between 0 and 6 inclusive
- **THEN** awareness is updated in local state immediately and queued for DB write via debounced save

#### Scenario: Awareness clamped to range

- **WHEN** user sets a Thief's awareness below 0 or above 6
- **THEN** awareness is clamped to 0 or 6 respectively before update

#### Scenario: Default awareness state

- **WHEN** a Thief is added to the roster
- **THEN** awareness is 0

#### Scenario: Toggle buttons stretch uniformly

- **WHEN** the awareness row is rendered
- **THEN** all seven buttons (A0–A6) have equal width via `flex: 1` with no wrapping

### Requirement: Favorite toggle

The system SHALL allow toggling the favorite status of a tracked Thief. Updates are
optimistic and persisted via debounced save.

#### Scenario: Favorite toggled

- **WHEN** user toggles favorite on a Thief
- **THEN** `isFavorited` is updated in local state immediately and queued for DB write

### Requirement: P5X roster sort by level

The system SHALL support sorting the P5X roster by Thief level (descending) in
addition to the standard alphabetical sort.

#### Scenario: Sort by level selected

- **WHEN** user selects level sort
- **THEN** roster is ordered by level descending, with favorited-first still applied as the primary sort key

#### Scenario: Sort by alpha selected

- **WHEN** user selects alphabetical sort
- **THEN** standard favorited-first + alpha sort from the roster spec is applied with no level comparator

### Requirement: P5X roster search keys

The system SHALL search the P5X roster using Fuse.js with keys: name, codename,
personaName, role, element.

#### Scenario: Search by codename

- **WHEN** user searches for a codename (e.g., Panther, Joker)
- **THEN** Thieves matching that codename are returned via fuzzy search

#### Scenario: Search by Persona name

- **WHEN** user searches for a Persona name (e.g., Arsene)
- **THEN** Thieves whose bound Persona matches are returned via fuzzy search

#### Scenario: Search by role

- **WHEN** user searches for a role name (e.g., Healer, Debuffer)
- **THEN** Thieves matching that role are returned via fuzzy search

#### Scenario: Search by element

- **WHEN** user searches for an element name (e.g., Nuclear, Bless)
- **THEN** Thieves matching that element are returned via fuzzy search

### Requirement: Thief card collapsed-summary composition

The collapsed (read-only) state of the Thief card SHALL present investment as
gradient-colored stat chips using the shared `getProgressStyle(value, min, max)`
color language (rust → teal), matching the other four games. The card SHALL render
the Thief's role and element as `GameBadge`s and the bound Persona's name as a
static line. The card SHALL NOT render a rarity-star indicator (rarity remains a
catalog field, matching AE).

#### Scenario: Level chip colored by investment

- **WHEN** a Thief card renders its collapsed summary
- **THEN** the `Lv {level}` `StatChip` text and border color are computed via `getProgressStyle(level, 1, 80)`

#### Scenario: Awareness chip colored by investment

- **WHEN** a Thief card renders its collapsed summary
- **THEN** an `A{awareness}` `StatChip` is shown, colored via `getProgressStyle(awareness, 0, 6)`

#### Scenario: Persona name line present

- **WHEN** a Thief card renders
- **THEN** the bound Persona's name is shown as a static line in the card body

#### Scenario: Level slider uses the canonical class and shared gradient

- **WHEN** a Thief card's edit body renders the level slider
- **THEN** the input uses the canonical `.level-slider` class and sets `--slider-fill-color` and `--slider-fill-glow` from `getProgressStyle(level, 1, 80)`, with the track fill percentage computed as `(level − 1) / 79`

#### Scenario: No rarity-star indicator

- **WHEN** a Thief card renders
- **THEN** no `.rarity-indicator` element is present
