## Purpose

Reverse: 1999 per-arcanist tracked fields. Covers level, portrait level (rarity-dependent max), resonance level, euphoria stage, psychube equipment (name + level + amplification), favorite toggle, and level-based sort.

## Requirements

### Requirement: Arcanist level field

The system SHALL track an arcanist's level as an integer in the range 1–60, defaulting to 1 on add. Updates SHALL be clamped to this range before persisting.

#### Scenario: Level updated within range

- **WHEN** user sets an arcanist's level to a value between 1 and 60 inclusive
- **THEN** level is updated in local state immediately and queued for DB write via debounced save

#### Scenario: Level clamped below minimum

- **WHEN** user sets an arcanist's level below 1
- **THEN** level is clamped to 1 before update

#### Scenario: Level clamped above maximum

- **WHEN** user sets an arcanist's level above 60
- **THEN** level is clamped to 60 before update

### Requirement: Portrait level field

The system SHALL track an arcanist's portrait level as an integer starting at 0, defaulting to 0 on add. The maximum varies by rarity: 6★ arcanists max at 5, 5★ at 3, 4★ at 2, 3★ at 1. This maximum is enforced at the UI layer, not the data layer.

#### Scenario: Portrait level updated

- **WHEN** user sets an arcanist's portrait level to a valid value
- **THEN** portrait level is updated in local state and queued for DB write

#### Scenario: Rarity-dependent maximum (informational)

- **WHEN** UI presents portrait level options for an arcanist
- **THEN** options are limited to 0 through the rarity-specific maximum (6★=5, 5★=3, 4★=2, 3★=1)

### Requirement: Resonance level field

The system SHALL track an arcanist's resonance level as an integer in the range 0–15, defaulting to 0 on add. Updates SHALL be clamped to this range.

#### Scenario: Resonance level updated within range

- **WHEN** user sets resonance level to a value between 0 and 15 inclusive
- **THEN** resonance level is updated in local state and queued for DB write

#### Scenario: Resonance level clamped

- **WHEN** user sets resonance level below 0 or above 15
- **THEN** value is clamped to the valid range before update

### Requirement: Euphoria stage field

The system SHALL track an arcanist's euphoria stage as an integer in the range 0–4, defaulting to 0 on add. Updates SHALL be clamped to this range.

#### Scenario: Euphoria stage updated within range

- **WHEN** user sets euphoria stage to a value between 0 and 4 inclusive
- **THEN** euphoria stage is updated in local state and queued for DB write

#### Scenario: Euphoria stage clamped

- **WHEN** user sets euphoria stage below 0 or above 4
- **THEN** value is clamped to the valid range before update

### Requirement: Psychube equipment

The system SHALL track an equipped psychube per arcanist with three fields: name (string key or null), level (integer 1–60), and amplification (integer 1–5). Defaults on add: name null, level 1, amplification 1.

#### Scenario: Psychube equipped

- **WHEN** user selects a psychube by name and sets its level
- **THEN** both `psychubeName` and `psychubeLevel` are updated in local state together and queued as a single debounced DB write

#### Scenario: Psychube unequipped

- **WHEN** user clears the psychube selection
- **THEN** `psychubeName` is set to null (level and amplification retain their values but are not displayed)

#### Scenario: Psychube amplification updated

- **WHEN** user sets amplification to a value between 1 and 5
- **THEN** `psychubeAmplification` is updated in local state and queued for DB write, clamped to 1–5

### Requirement: Favorite toggle

The system SHALL allow toggling the favorite status of a tracked arcanist. Updates are optimistic and persisted via debounced save.

#### Scenario: Favorite toggled

- **WHEN** user toggles favorite on an arcanist
- **THEN** `isFavorited` is updated in local state immediately and queued for DB write

### Requirement: R1999 roster sort by level

The system SHALL support sorting the R1999 roster by arcanist level (descending) in addition to the standard alphabetical sort.

#### Scenario: Sort by level selected

- **WHEN** user selects level sort
- **THEN** roster is ordered by level descending, with favorited-first still applied as the primary sort key

#### Scenario: Sort by alpha selected

- **WHEN** user selects alphabetical sort
- **THEN** standard favorited-first + alpha sort from the shared-roster spec is applied with no level comparator

### Requirement: R1999 roster search keys

The system SHALL search the R1999 roster using Fuse.js with keys: name, afflatus, damageType.

#### Scenario: Search by afflatus

- **WHEN** user searches for an afflatus name (e.g. "Star")
- **THEN** arcanists matching that afflatus are returned via fuzzy search

### Requirement: Resonance-gate filter predicate

The R1999 `getFilteredRoster` SHALL accept an optional filter predicate
`(arcanist: R1999TrackedArcanist) => boolean`, applied before search and sort,
conforming to the shared `roster-predicate-filter` signature. When provided, only
arcanists for which the predicate returns `true` SHALL appear in results.

The roster page SHALL supply a resonance-gate predicate defined as
`resonanceLevel > 0 && resonanceLevel < 15` — arcanists that have started
resonance but are not yet at the maximum of 15.

#### Scenario: Predicate excludes un-started arcanists

- **WHEN** the resonance gate is active and an arcanist has `resonanceLevel` of 0
- **THEN** that arcanist is excluded from the roster results

#### Scenario: Predicate excludes maxed arcanists

- **WHEN** the resonance gate is active and an arcanist has `resonanceLevel` of 15
- **THEN** that arcanist is excluded from the roster results

#### Scenario: Predicate includes in-progress arcanists

- **WHEN** the resonance gate is active and an arcanist has `resonanceLevel` between 1 and 14 inclusive
- **THEN** that arcanist is included in the roster results

#### Scenario: No predicate passes all

- **WHEN** the resonance gate is inactive (no predicate provided)
- **THEN** `getFilteredRoster` returns all arcanists matching the search term and sort

### Requirement: Resonance-gate filter chip

The R1999 roster toolbar SHALL render a togglable resonance-gate filter chip in
the filter row (`.filter-row` / `.filter-chip`), per the `roster-predicate-filter`
pattern. The chip SHALL be off by default, page-local (not persisted to DB or
URL), and compose with search and sort as an intersection. When the gate is
active and no arcanist matches, the roster SHALL show a gate-specific empty
message distinct from the default no-match message.

#### Scenario: Chip toggles gate on

- **WHEN** the user clicks the inactive resonance-gate chip
- **THEN** the resonance-gate predicate is passed to `getFilteredRoster` and the roster narrows to in-progress arcanists

#### Scenario: Chip toggles gate off

- **WHEN** the user clicks the active resonance-gate chip
- **THEN** the predicate is removed and the full roster (matching search and sort) is shown

#### Scenario: Gate composes with search

- **WHEN** the resonance gate is active and the user types a search term
- **THEN** results are the intersection — arcanists matching BOTH the gate predicate AND the search term

#### Scenario: Gate resets on navigation

- **WHEN** the user navigates away from the R1999 roster page and returns
- **THEN** the resonance-gate chip is inactive (off)

#### Scenario: Gate-specific empty message

- **WHEN** the resonance gate is active and no arcanist has resonance in progress
- **THEN** the roster shows a gate-specific empty message rather than the default no-match message

### Requirement: Gluttony-gate filter predicate

The R1999 roster page SHALL supply a gluttony-gate predicate, applied through the existing
`getFilteredRoster` optional-predicate seam (`roster-predicate-filter` signature), defined as
`psychubeName !== null && psychubeAmplification < 5` — arcanists that have a psychube equipped
whose amplification has not yet reached the maximum of A5. Arcanists with no psychube equipped
SHALL be excluded.

#### Scenario: Predicate excludes arcanists with no psychube

- **WHEN** the gluttony gate is active and an arcanist has `psychubeName` of `null`
- **THEN** that arcanist is excluded from the roster results

#### Scenario: Predicate excludes fully-amplified arcanists

- **WHEN** the gluttony gate is active and an arcanist has a psychube equipped with `psychubeAmplification` of 5
- **THEN** that arcanist is excluded from the roster results

#### Scenario: Predicate includes equipped, not-maxed arcanists

- **WHEN** the gluttony gate is active and an arcanist has a psychube equipped with `psychubeAmplification` between 1 and 4 inclusive
- **THEN** that arcanist is included in the roster results

### Requirement: Gluttony-gate filter chip

The R1999 roster toolbar SHALL render a togglable gluttony-gate filter chip in the filter row
(`.filter-row` / `.filter-chip`), per the `roster-predicate-filter` pattern, alongside the
resonance-gate chip. The chip SHALL be off by default, page-local (not persisted to DB or URL),
and compose with search, sort, and any other active gate as an intersection — an arcanist appears
only if it satisfies every active gate predicate AND the search term. When at least one gate is
active and no arcanist matches, the roster SHALL show a gate-aware empty message distinct from the
default no-match message.

#### Scenario: Chip toggles gate on

- **WHEN** the user clicks the inactive gluttony-gate chip
- **THEN** the gluttony-gate predicate is applied and the roster narrows to arcanists with a psychube equipped below A5 amplification

#### Scenario: Chip toggles gate off

- **WHEN** the user clicks the active gluttony-gate chip
- **THEN** the gluttony predicate is removed and the roster (matching search, sort, and any other active gate) is shown

#### Scenario: Gluttony gate composes with the resonance gate

- **WHEN** both the resonance gate and the gluttony gate are active
- **THEN** results are the intersection — only arcanists that satisfy BOTH the resonance predicate AND the gluttony predicate appear

#### Scenario: Gluttony gate composes with search

- **WHEN** the gluttony gate is active and the user types a search term
- **THEN** results are the intersection — arcanists matching BOTH the gluttony predicate AND the search term

#### Scenario: Gate resets on navigation

- **WHEN** the user navigates away from the R1999 roster page and returns
- **THEN** the gluttony-gate chip is inactive (off)

#### Scenario: Gate-aware empty message

- **WHEN** at least one gate is active and no arcanist matches the active filters
- **THEN** the roster shows a gate-aware empty message rather than the default no-match message
