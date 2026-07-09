## ADDED Requirements

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
