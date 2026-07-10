## ADDED Requirements

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
