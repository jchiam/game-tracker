## ADDED Requirements

### Requirement: Retry on parties load failure

The system SHALL allow the user to retry a failed parties load without reloading the page. The parties tab's own Retry SHALL retry only the parties load.

#### Scenario: Parties retry triggered

- **WHEN** user triggers a parties retry after a load error
- **THEN** `isLoadError` resets to false, `isInitialLoad` resets to true, and the parties fetch is attempted again

## MODIFIED Requirements

### Requirement: Load parties from DB on session change

The system SHALL load parties from the DB when a user session becomes available, and clear parties when the session is lost. The hook SHALL expose `isInitialLoad` (true until the first fetch settles) and `isLoadError` (true when the fetch rejected), mirroring the roster hook.

#### Scenario: Session available

- **WHEN** a valid user session is present
- **THEN** parties are fetched from DB and stored in state, ordered by `created_at` descending, and `isInitialLoad` becomes false

#### Scenario: Session lost

- **WHEN** the user session becomes null
- **THEN** parties state is cleared to an empty array and `isInitialLoad` is false

#### Scenario: DB load fails

- **WHEN** the parties fetch rejects
- **THEN** `isLoadError` is set to true, `isInitialLoad` is set to false, and parties state is left empty

### Requirement: Save party (create or update)

The system SHALL create a new party or update an existing one by writing to the DB then reloading all parties. The DB is the source of truth for final party state after save. The hook's save resolves to a `PartySaveResult` (`{ partyId, membersSaved }`) and SHALL surface every failure to the user.

#### Scenario: Create new party

- **WHEN** user saves a party with no existing `id`
- **THEN** a new party row is inserted and parties are reloaded from DB

#### Scenario: Update existing party

- **WHEN** user saves a party with an existing `id`
- **THEN** party row is updated, existing members are cleared and re-inserted, and parties are reloaded from DB

#### Scenario: Save while unauthenticated

- **WHEN** user attempts to save a party with no active session
- **THEN** save is a no-op and resolves with `partyId: null`

#### Scenario: Party-row save fails

- **WHEN** the save resolves with `partyId: null` for an authenticated user
- **THEN** an error toast ("Couldn't save {party}. Please try again.") is shown and no reload is attempted

#### Scenario: Saved without members

- **WHEN** the save resolves with a party id but `membersSaved: false`
- **THEN** parties are reloaded and a warning toast tells the user the {party} was saved without its members

#### Scenario: Post-save reload fails

- **WHEN** the party row saved but the reload rejects
- **THEN** the save still resolves with the party id, an error toast tells the user the list could not be refreshed, and the hook marks a load error so the tab shows the error surface with Retry

### Requirement: Delete party

The system SHALL delete a party optimistically from local state and then remove it from the DB, surfacing a failure to the user.

#### Scenario: Successful delete

- **WHEN** user deletes a party
- **THEN** party is removed from local state immediately and DB delete fires in background

#### Scenario: Delete fails

- **WHEN** the DB delete reports failure
- **THEN** the party stays in local state and an error toast ("Couldn't delete {party}. Please try again.") is shown

#### Scenario: Delete while unauthenticated

- **WHEN** user attempts to delete a party with no active session
- **THEN** delete is a no-op and returns false

### Requirement: Party favorite toggle

The system SHALL allow toggling the favorite status of a party optimistically, reverting and notifying on failure. This capability is available for all games (HSR, R1999, N2E, AE, P5X, ZZZ).

#### Scenario: Favorite toggled successfully

- **WHEN** user toggles favorite on any game's party
- **THEN** `isFavorited` is updated in local state immediately and persisted to DB

#### Scenario: Favorite toggle fails

- **WHEN** the DB persist call returns false or rejects
- **THEN** party state reverts to the pre-toggle snapshot and an error toast is shown

### Requirement: Manual party refresh

The system SHALL allow an explicit refresh of parties from the DB without a session change, surfacing a failure to the user.

#### Scenario: Refresh triggered

- **WHEN** `refreshParties` is called with an active session
- **THEN** parties are reloaded from DB and state is updated

#### Scenario: Refresh fails

- **WHEN** the refresh fetch rejects
- **THEN** existing parties state is kept, an error toast is shown, and the hook marks a load error
