## MODIFIED Requirements

### Requirement: N2E roster sort by level

The system SHALL support sorting the N2E roster by character level (descending) and by calculated cartridge score (descending), in addition to the standard alphabetical sort.

#### Scenario: Sort by level selected

- **WHEN** user selects level sort
- **THEN** roster is ordered by level descending, with favorited-first still applied as the primary sort key

#### Scenario: Sort by score selected

- **WHEN** user selects score sort
- **THEN** roster is ordered by `calculateCartridgeScore(character)` descending, with favorited-first still applied as the primary sort key, and insufficient-data (`-1`) characters ordered last among non-favorites

#### Scenario: Sort by alpha selected

- **WHEN** user selects alphabetical sort
- **THEN** standard favorited-first + alpha sort from the shared-roster spec is applied with no level or score comparator
