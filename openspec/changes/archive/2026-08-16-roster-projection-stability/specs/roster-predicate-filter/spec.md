## MODIFIED Requirements

### Requirement: Predicate filter signature

A per-game `getFilteredRoster` function SHALL accept an optional filter predicate
`(entity: T) => boolean` that is applied before search and sort. When the
predicate is provided and returns `false` for an entity, that entity SHALL be
excluded from results regardless of search term or sort order.

Predicate membership SHALL be evaluated against each entity's basis snapshot
(see `roster-projection-stability`), not its live state — so an in-progress edit
that stops an entity matching does not evict its card until a release point.
Toggling a filter chip refreshes all bases, so chip toggles still narrow or
widen the grid immediately against current entity data.

#### Scenario: Predicate narrows roster

- **WHEN** a filter predicate is active that matches 3 of 10 tracked entities (by their basis snapshots)
- **THEN** `getFilteredRoster` returns only those 3 entities (sorted normally)

#### Scenario: No predicate passes all

- **WHEN** no filter predicate is provided (undefined)
- **THEN** `getFilteredRoster` returns all entities matching the search term

#### Scenario: Edit under active predicate defers eviction

- **WHEN** a predicate filter is active and the user edits a rendered card so its live data no longer matches
- **THEN** the entity remains in results (its basis still matches) until a release point refreshes its basis
