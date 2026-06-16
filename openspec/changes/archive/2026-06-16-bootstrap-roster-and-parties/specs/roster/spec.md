## ADDED Requirements

### Requirement: Load roster from DB on session change
The system SHALL load tracked entities from the DB when a user session becomes available, and clear the roster when the session is lost.

#### Scenario: Session available on mount
- **WHEN** a valid user session is present and auth loading is complete
- **THEN** tracked entities are fetched from DB and stored in roster state

#### Scenario: Session lost
- **WHEN** the user session becomes null
- **THEN** roster state is cleared to an empty array and initial load is marked complete

#### Scenario: DB load fails
- **WHEN** the DB fetch rejects
- **THEN** `isLoadError` is set to true and `isInitialLoad` is set to false

### Requirement: Retry on load failure
The system SHALL allow the user to retry a failed roster load without reloading the page.

#### Scenario: Retry triggered
- **WHEN** user triggers a retry after a load error
- **THEN** `isLoadError` resets to false, `isInitialLoad` resets to true, and the DB fetch is attempted again

### Requirement: Add entity to roster
The system SHALL add a tracked entity to the roster optimistically and persist it to the DB. Duplicate adds and in-flight adds for the same entity SHALL be no-ops.

#### Scenario: Successful add
- **WHEN** authenticated user adds an entity not already in the roster
- **THEN** entity appears in roster immediately (optimistic), DB insert fires in background, and `dbId` is set on the entity once the insert resolves

#### Scenario: Duplicate add ignored
- **WHEN** user adds an entity already present in `trackedEntities`
- **THEN** no state change and no DB insert

#### Scenario: In-flight add ignored
- **WHEN** user adds an entity whose insert is already in flight
- **THEN** no state change and no duplicate DB insert

#### Scenario: Add fails
- **WHEN** the DB insert rejects after optimistic add
- **THEN** entity is removed from roster and an error toast is shown

#### Scenario: Add while unauthenticated
- **WHEN** user attempts to add an entity with no active session
- **THEN** a warning toast is shown and no state change occurs

### Requirement: Remove entity from roster
The system SHALL remove a tracked entity from the roster optimistically and delete it from the DB.

#### Scenario: Successful remove
- **WHEN** user removes an entity with a `dbId`
- **THEN** entity is removed from roster immediately and DB delete fires in background

#### Scenario: Remove entity without dbId
- **WHEN** user removes an entity that has no `dbId` (insert never resolved)
- **THEN** entity is removed from local roster only; no DB delete is attempted

#### Scenario: Remove fails
- **WHEN** the DB delete rejects
- **THEN** entity is restored to roster and an error toast is shown

### Requirement: Fuzzy search roster
The system SHALL filter the roster using Fuse.js fuzzy search when a non-empty search term is provided.

#### Scenario: Search with term
- **WHEN** a non-empty search term is provided
- **THEN** roster is filtered using Fuse.js with threshold 0.3 against the configured search keys

#### Scenario: Empty search term
- **WHEN** search term is empty or whitespace-only
- **THEN** full roster is returned without filtering

### Requirement: Sort roster favorited-first
The system SHALL sort the filtered roster with favorited entities first, an optional game-specific secondary comparator second, and alphabetical by name as the final tiebreak.

#### Scenario: Favorited entities sorted first
- **WHEN** roster contains a mix of favorited and non-favorited entities
- **THEN** favorited entities appear before non-favorited entities regardless of name

#### Scenario: Secondary comparator applied within same favorite group
- **WHEN** a secondary comparator is provided and two entities have the same favorite status
- **THEN** secondary comparator result determines their relative order

#### Scenario: Alphabetical tiebreak
- **WHEN** two entities have the same favorite status and secondary comparator returns 0
- **THEN** entities are ordered alphabetically by name
