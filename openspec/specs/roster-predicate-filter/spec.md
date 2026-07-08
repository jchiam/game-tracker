## Purpose

Shared design pattern for boolean-predicate roster filtering. Describes how a
game hook exposes a filter predicate, how the page manages filter state, and how
the toolbar renders filter chips. Games with item-gate bottlenecks (P5X rose
gate, or hypothetical future equivalents) implement this pattern to let users
narrow their roster to entities matching a derived boolean condition.

## Requirements

### Requirement: Predicate filter signature

A per-game `getFilteredRoster` function SHALL accept an optional filter predicate
`(entity: T) => boolean` that is applied before search and sort. When the
predicate is provided and returns `false` for an entity, that entity SHALL be
excluded from results regardless of search term or sort order.

#### Scenario: Predicate narrows roster

- **WHEN** a filter predicate is active that matches 3 of 10 tracked entities
- **THEN** `getFilteredRoster` returns only those 3 entities (sorted normally)

#### Scenario: No predicate passes all

- **WHEN** no filter predicate is provided (undefined)
- **THEN** `getFilteredRoster` returns all entities matching the search term

### Requirement: Filter row within toolbar container

When a game defines predicate filters, the roster page SHALL render a filter row
(`.filter-row`) as a sibling of the roster controls (`.roster-controls`) inside
a shared parent container (`.roster-toolbar`). The parent is a flex column that
vertically stacks the controls row and filter row with consistent internal
spacing. The filter row contains pill-shaped toggle chips — visually distinct
from the square action buttons but spatially grouped as part of the same control
cluster. The filter row SHALL only render when tracked entities exist.

#### Scenario: Filter row renders within toolbar container

- **WHEN** the roster view has tracked entities and the game defines filter chips
- **THEN** a filter row appears directly below the roster controls within the same parent container

#### Scenario: Chip toggles filter on

- **WHEN** user clicks an inactive filter chip in the filter row
- **THEN** the corresponding predicate is passed to `getFilteredRoster` and the roster narrows

#### Scenario: Chip toggles filter off

- **WHEN** user clicks an active filter chip
- **THEN** the predicate is removed and the full roster (matching search/sort) is shown

#### Scenario: Filter composes with search

- **WHEN** a filter chip is active and the user types a search term
- **THEN** results are the intersection — entities matching BOTH the predicate AND the search

#### Scenario: Filter row hidden when no tracked entities

- **WHEN** the roster has no tracked entities
- **THEN** the filter row is not rendered

### Requirement: Filter state is page-local

Filter chip state (on/off) SHALL be managed in the page component, not persisted
to the database or URL. Navigating away and back resets all filters to off.

#### Scenario: Navigation resets filter

- **WHEN** user navigates away from the roster page and returns
- **THEN** all filter chips are inactive (off)
