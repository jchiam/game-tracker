## MODIFIED Requirements

### Requirement: Shared preference-rows save

The system SHALL provide a single `savePreferenceRows` helper implementing the delete-existing-rows-then-reinsert pattern for variable-length preference chains, used by HSR `saveBuildPrefs`, N2E `saveCartridgePreferences`, and P5X `saveRevelationPreferences`. It SHALL be the only implementation of this pattern in the codebase, so the documented non-atomic-save limitation has exactly one future fix site. Every step SHALL surface its DB error: a failed delete, parent-row update, or insert is logged and rethrown so the caller's save queue reports it.

#### Scenario: Preference rows replaced

- **WHEN** `savePreferenceRows` is called with delete targets, an optional parent-row update, and ordered insert rows
- **THEN** existing rows are deleted from each target table by FK, the parent row is updated if provided, and non-empty insert sets are inserted with sequential `order_index`

#### Scenario: Delete failure surfaces

- **WHEN** a delete step returns a DB error
- **THEN** the error is logged and rethrown before any parent update or insert runs

#### Scenario: Parent update failure surfaces

- **WHEN** the parent-row update returns a DB error
- **THEN** the error is logged and rethrown before any insert runs

#### Scenario: Insert failure surfaces

- **WHEN** an insert set fails after the deletes have run
- **THEN** the error is logged and rethrown so the caller's save queue surfaces it

### Requirement: Unified party error semantics

Party persistence errors SHALL be handled uniformly across all games: `loadParties` logs and throws (the shared party hook catches); `saveParty` never rejects and resolves to a `PartySaveResult` `{ partyId: string | null; membersSaved: boolean }` — `partyId` is `null` when the party row insert/update fails, and `membersSaved` is `false` when the row persisted but the member insert failed (the row is already persisted, and the returned id triggers the hook's reload so local state reflects true DB state); `deleteParty` and `toggleFavoriteParty` log and return `false`. `saveParty` SHALL NOT throw — nothing in the save call chain catches, so a thrown save error would surface as an unhandled promise rejection.

#### Scenario: Party-row save failure

- **WHEN** the party insert or update returns a DB error
- **THEN** the error is logged and `saveParty` resolves to `{ partyId: null, membersSaved: false }` (no rejection)

#### Scenario: Member insert failure after party row persisted

- **WHEN** the party row write succeeds but the member insert returns a DB error
- **THEN** the error is logged and `saveParty` resolves to `{ partyId: <id>, membersSaved: false }`

#### Scenario: Full success

- **WHEN** the party row and member writes both succeed (or the party has no members)
- **THEN** `saveParty` resolves to `{ partyId: <id>, membersSaved: true }`

#### Scenario: Load failure propagates

- **WHEN** the parties query returns a DB error
- **THEN** the error is logged and thrown to the caller

#### Scenario: HTTP 500 surfaces as a thrown error

- **WHEN** the REST endpoint answers a roster or parties load with HTTP 500
- **THEN** the factory's load function rejects with the DB error rather than resolving to an empty list
