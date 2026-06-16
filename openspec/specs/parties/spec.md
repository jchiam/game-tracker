## Purpose

Shared party lineup management used by all game modules via `useParties`. Covers party CRUD, slot constraints per game, reload-after-save, optimistic delete, and game-specific extensions (tier and favorite toggle for R1999 and N2E).

## Requirements

### Requirement: Load parties from DB on session change
The system SHALL load parties from the DB when a user session becomes available, and clear parties when the session is lost.

#### Scenario: Session available
- **WHEN** a valid user session is present
- **THEN** parties are fetched from DB and stored in state, ordered by `created_at` descending

#### Scenario: Session lost
- **WHEN** the user session becomes null
- **THEN** parties state is cleared to an empty array

### Requirement: Save party (create or update)
The system SHALL create a new party or update an existing one by writing to the DB then reloading all parties. The DB is the source of truth for final party state after save.

#### Scenario: Create new party
- **WHEN** user saves a party with no existing `id`
- **THEN** a new party row is inserted and parties are reloaded from DB

#### Scenario: Update existing party
- **WHEN** user saves a party with an existing `id`
- **THEN** party row is updated, existing members are cleared and re-inserted, and parties are reloaded from DB

#### Scenario: Save while unauthenticated
- **WHEN** user attempts to save a party with no active session
- **THEN** save is a no-op and returns null

### Requirement: Delete party
The system SHALL delete a party optimistically from local state and then remove it from the DB.

#### Scenario: Successful delete
- **WHEN** user deletes a party
- **THEN** party is removed from local state immediately and DB delete fires in background

#### Scenario: Delete while unauthenticated
- **WHEN** user attempts to delete a party with no active session
- **THEN** delete is a no-op and returns false

### Requirement: Party slot constraints
The system SHALL enforce slot index constraints per game when saving party members.

#### Scenario: HSR party slots
- **WHEN** saving an HSR party
- **THEN** member slot indices are in range 0–3 (maximum 4 members)

#### Scenario: R1999 party slots
- **WHEN** saving an R1999 party
- **THEN** member slot indices are in range 0–3 (maximum 4 members)

#### Scenario: N2E party slots
- **WHEN** saving an N2E party
- **THEN** member slot indices are in range 0–3 (maximum 4 members)

### Requirement: Party favorite toggle (R1999 and N2E only)
The system SHALL allow toggling the favorite status of a party optimistically, reverting on failure. This capability is NOT available for HSR parties.

#### Scenario: Favorite toggled successfully
- **WHEN** user toggles favorite on an R1999 or N2E party
- **THEN** `isFavorited` is updated in local state immediately and persisted to DB

#### Scenario: Favorite toggle fails
- **WHEN** the DB persist call returns false or rejects
- **THEN** party state reverts to the pre-toggle snapshot

### Requirement: Party tier field (R1999 and N2E only)
The system SHALL support an optional tier field on R1999 and N2E parties. HSR parties SHALL NOT have a tier field.

#### Scenario: Tier saved with party
- **WHEN** user saves an R1999 or N2E party with a tier value
- **THEN** tier is persisted and returned with the party on next load

#### Scenario: Tier absent
- **WHEN** no tier is set
- **THEN** tier field is null

### Requirement: Manual party refresh
The system SHALL allow an explicit refresh of parties from the DB without a session change.

#### Scenario: Refresh triggered
- **WHEN** `refreshParties` is called with an active session
- **THEN** parties are reloaded from DB and state is updated
