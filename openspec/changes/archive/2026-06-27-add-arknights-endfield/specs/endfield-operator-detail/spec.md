## ADDED Requirements

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
