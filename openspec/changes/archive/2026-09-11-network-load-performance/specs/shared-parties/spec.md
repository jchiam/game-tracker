## REMOVED Requirements

### Requirement: Save party (create or update)

**Reason**: Superseded by "Save party atomically (create or update)" below — the party row and members are written in one `save_party` RPC, so the "Saved without members" outcome cannot occur and `PartySaveResult` carries only `partyId`.

**Migration**: Callers checking `membersSaved` check `partyId` instead.

## ADDED Requirements

### Requirement: Save party atomically (create or update)

The system SHALL create a new party or update an existing one by writing to the DB then reloading all parties. The DB is the source of truth for final party state after save. The write is one atomic `save_party` RPC — party row and members commit or roll back together — so the hook's save resolves to a `PartySaveResult` (`{ partyId }`) with no partial-save outcome, and SHALL surface every failure to the user.

#### Scenario: Create new party

- **WHEN** user saves a party with no existing `id`
- **THEN** a new party row and its members are inserted in one RPC and parties are reloaded from DB

#### Scenario: Update existing party

- **WHEN** user saves a party with an existing `id`
- **THEN** the party row is updated and its members replaced in one RPC, and parties are reloaded from DB

#### Scenario: Save while unauthenticated

- **WHEN** user attempts to save a party with no active session
- **THEN** save is a no-op and resolves with `partyId: null`

#### Scenario: Party save fails

- **WHEN** the save resolves with `partyId: null` for an authenticated user
- **THEN** an error toast ("Couldn't save {party}. Please try again.") is shown and no reload is attempted

#### Scenario: Post-save reload fails

- **WHEN** the party saved but the reload rejects
- **THEN** the save still resolves with the party id, an error toast tells the user the list could not be refreshed, and the hook marks a load error so the tab shows the error surface with Retry
