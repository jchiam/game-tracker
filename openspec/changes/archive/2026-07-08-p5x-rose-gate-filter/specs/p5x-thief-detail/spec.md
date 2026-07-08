## ADDED Requirements

### Requirement: Rose-gated roster filter

The P5X roster toolbar SHALL render a "🌹 Gated" filter chip that, when active,
narrows the displayed roster to only thieves in the rose-gated state
(`skillsLeveled && !roseMaxed`). The chip composes with existing search and sort.

#### Scenario: Filter chip shown in toolbar

- **WHEN** the P5X roster view renders
- **THEN** a "🌹 Gated" filter chip is visible in the toolbar area

#### Scenario: Activating the filter narrows roster

- **WHEN** user activates the "🌹 Gated" filter chip
- **THEN** only thieves with `skillsLeveled === true` and `roseMaxed === false` are shown

#### Scenario: Deactivating the filter restores full roster

- **WHEN** user deactivates the "🌹 Gated" filter chip
- **THEN** all tracked thieves (matching current search/sort) are shown again

#### Scenario: Filter composes with level sort

- **WHEN** the rose-gate filter is active and sort is set to LEVEL
- **THEN** only rose-gated thieves are shown, sorted by level descending (favorites first)

#### Scenario: Filter composes with search

- **WHEN** the rose-gate filter is active and user searches "fire"
- **THEN** only rose-gated thieves matching "fire" are shown

#### Scenario: Empty state when no thieves are rose-gated

- **WHEN** the rose-gate filter is active but no thieves have `skillsLeveled && !roseMaxed`
- **THEN** an empty state message is shown (e.g., "No rose-gated thieves")
