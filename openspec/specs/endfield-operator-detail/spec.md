## Purpose

Arknights: Endfield per-operator tracked fields. Covers level (1–90), potential (0–5), favorite toggle, level-based sort, and search keys (name, class, element, weapon).

## Requirements

### Requirement: Operator level field

The system SHALL track an operator's level as an integer in the range 1–90, defaulting to 1 on add. Updates SHALL be clamped to this range before persisting.

#### Scenario: Level updated within range

- **WHEN** user sets an operator's level to a value between 1 and 90 inclusive
- **THEN** level is updated in local state immediately and queued for DB write via debounced save

#### Scenario: Level clamped below minimum

- **WHEN** user sets an operator's level below 1
- **THEN** level is clamped to 1 before update

#### Scenario: Level clamped above maximum

- **WHEN** user sets an operator's level above 90
- **THEN** level is clamped to 90 before update

### Requirement: Operator potential field

The system SHALL track an operator's potential as an integer in the range 0–5, defaulting to 0 on add. Updates SHALL be clamped to this range before persisting.

#### Scenario: Potential updated within range

- **WHEN** user sets potential to a value between 0 and 5 inclusive
- **THEN** potential is updated in local state immediately and queued for DB write

#### Scenario: Potential clamped below minimum

- **WHEN** user sets potential below 0
- **THEN** potential is clamped to 0 before update

#### Scenario: Potential clamped above maximum

- **WHEN** user sets potential above 5
- **THEN** potential is clamped to 5 before update

#### Scenario: Default potential state

- **WHEN** an operator is added to the roster
- **THEN** potential is 0

### Requirement: Favorite toggle

The system SHALL allow toggling the favorite status of a tracked operator. Updates are optimistic and persisted via debounced save.

#### Scenario: Favorite toggled

- **WHEN** user toggles favorite on an operator
- **THEN** `isFavorited` is updated in local state immediately and queued for DB write

### Requirement: Endfield roster sort by level

The system SHALL support sorting the Endfield roster by operator level (descending) in addition to the standard alphabetical sort.

#### Scenario: Sort by level selected

- **WHEN** user selects level sort
- **THEN** roster is ordered by level descending, with favorited-first still applied as the primary sort key

#### Scenario: Sort by alpha selected

- **WHEN** user selects alphabetical sort
- **THEN** standard favorited-first + alpha sort from the roster spec is applied with no level comparator

### Requirement: Endfield roster search keys

The system SHALL search the Endfield roster using Fuse.js with keys: name, class, element, weapon.

#### Scenario: Search by class

- **WHEN** user searches for a class name (e.g., Guard, Caster)
- **THEN** operators matching that class are returned via fuzzy search

#### Scenario: Search by element

- **WHEN** user searches for an element name (e.g., Heat, Cryo)
- **THEN** operators matching that element are returned via fuzzy search

#### Scenario: Search by weapon

- **WHEN** user searches for a weapon type (e.g., Sword, Polearm)
- **THEN** operators matching that weapon type are returned via fuzzy search

### Requirement: Operator card collapsed-summary composition

The collapsed (read-only) state of the operator card SHALL present investment as gradient-colored stat chips, and the expanded (edit) state SHALL drive its level slider with the same shared investment gradient. The card SHALL use the shared `getProgressStyle(value, min, max)` color language (rust → teal) so AE matches HSR, R1999, and N2E. Because AE operators have no equippable gear, the operator card SHALL NOT render a `.game-card-static-line` gear one-liner.

#### Scenario: Level chip colored by investment

- **WHEN** an operator card renders its collapsed summary
- **THEN** the `Lv {level}` `StatChip` text and border color are computed via `getProgressStyle(level, 1, 90)`, so a low-level operator reads rust and a level-90 operator reads teal

#### Scenario: Potential chip colored by investment

- **WHEN** an operator card renders its collapsed summary
- **THEN** the `P{potential}` `StatChip` text and border color are computed via `getProgressStyle(potential, 0, 5)`

#### Scenario: Level slider uses the canonical class and shared gradient

- **WHEN** an operator card's edit body renders the level slider
- **THEN** the input uses the canonical `.level-slider` class (not `.character-slider`) and sets `--slider-fill-color` and `--slider-fill-glow` from `getProgressStyle(level, 1, 90)`, with the track fill percentage computed as `(level − 1) / 89`

#### Scenario: No gear one-liner in the summary

- **WHEN** an operator card renders its collapsed summary
- **THEN** no `.game-card-static-line` equip digest is present, because AE operators track only level and potential and have no equippable gear

#### Scenario: Rarity stars are not gradient-colored

- **WHEN** an operator card renders the rarity indicator
- **THEN** the rarity stars retain their intrinsic per-rarity color and are NOT passed through `getProgressStyle`, because rarity is an intrinsic property rather than an investment level
