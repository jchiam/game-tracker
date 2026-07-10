## MODIFIED Requirements

### Requirement: P5X roster sort by level

The system SHALL support sorting the P5X roster by Thief level (descending) and by calculated revelation score (descending), in addition to the standard alphabetical sort.

#### Scenario: Sort by level selected

- **WHEN** user selects level sort
- **THEN** roster is ordered by level descending, with favorited-first still applied as the primary sort key

#### Scenario: Sort by score selected

- **WHEN** user selects score sort
- **THEN** roster is ordered by `calculateRevelationScore(thief)` descending, with favorited-first still applied as the primary sort key, and insufficient-data (`-1`) Thieves ordered last among non-favorites

#### Scenario: Sort by alpha selected

- **WHEN** user selects alphabetical sort
- **THEN** standard favorited-first + alpha sort from the roster spec is applied with no level or score comparator
