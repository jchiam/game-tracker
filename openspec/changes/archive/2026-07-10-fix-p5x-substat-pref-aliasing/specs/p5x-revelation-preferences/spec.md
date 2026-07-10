## ADDED Requirements

### Requirement: Per-Thief preference-state isolation on load

The system SHALL, when loading the roster from the DB, give each Thief's
`revelationPreferences` a freshly-allocated structure, including every array it contains
(`subStats`, `mainStats.moon`, `mainStats.star`, `mainStats.sky`). These arrays SHALL NOT
alias any module-level default object, nor any other Thief's preference state. Mutating one
Thief's loaded preference arrays SHALL NOT affect any other Thief or any subsequent load.

#### Scenario: Two thieves have independent substat arrays

- **WHEN** the roster loads two Thieves that both carry `sub_stats` preference rows
- **THEN** their loaded `revelationPreferences.subStats` are distinct array references
- **AND** neither array is the same reference as any module-level default

#### Scenario: Reload does not accumulate

- **WHEN** the roster is loaded, then loaded again (e.g. session refresh, retry, or React
  StrictMode remount)
- **THEN** a Thief whose stored substat chain has N rows reports exactly N substat
  preferences after each load — never 2N or more

#### Scenario: One thief's edit does not bleed into another

- **WHEN** two Thieves are loaded and one Thief's `revelationPreferences.subStats` is mutated
- **THEN** the other Thief's `revelationPreferences.subStats` is unchanged
