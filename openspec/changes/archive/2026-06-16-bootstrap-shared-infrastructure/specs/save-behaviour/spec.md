## ADDED Requirements

### Requirement: Debounced DB writes

The system SHALL debounce DB write operations by 1000 ms. Multiple updates to the same entity key within the debounce window SHALL be merged, with the latest values winning.

#### Scenario: Rapid field updates coalesced

- **WHEN** two updates to the same entity key arrive within 1000 ms
- **THEN** only one DB write fires, carrying the merged latest values

#### Scenario: Updates to different keys fire independently

- **WHEN** updates arrive for two different entity keys within 1000 ms
- **THEN** each key gets its own independent debounce timer and DB write

### Requirement: Optimistic UI updates

The system SHALL apply state changes immediately in local React state before the DB write completes, giving instant feedback.

#### Scenario: Optimistic update on field change

- **WHEN** user changes a tracked entity field
- **THEN** UI reflects the new value immediately, before the DB write resolves

### Requirement: Rollback on write failure

The system SHALL revert optimistic state to the pre-update snapshot and show an error toast when a DB write fails.

#### Scenario: DB write failure on field update

- **WHEN** a debounced DB write rejects
- **THEN** entity state reverts to the value before the update and an error toast is shown

#### Scenario: DB write failure on add

- **WHEN** an insert rejects after optimistic add
- **THEN** entity is removed from the roster and an error toast is shown

#### Scenario: DB write failure on remove

- **WHEN** a delete call rejects after optimistic remove
- **THEN** entity is restored to the roster and an error toast is shown

### Requirement: Saving indicator

The system SHALL display a saving indicator while any write is in flight.

#### Scenario: Write in flight

- **WHEN** `pendingSaveCount` is greater than 0
- **THEN** `SavingToast` is visible with role="status" and aria-live="polite"

#### Scenario: No writes pending

- **WHEN** `pendingSaveCount` is 0
- **THEN** `SavingToast` is not rendered

### Requirement: Unsaved-changes beforeunload guard

The system SHALL warn the user before navigating away from the page when writes are pending.

#### Scenario: Navigate away with pending saves

- **WHEN** user attempts to close or navigate away while `pendingSaveCount` is greater than 0
- **THEN** browser's beforeunload confirmation is triggered

#### Scenario: Navigate away with no pending saves

- **WHEN** no writes are pending
- **THEN** navigation proceeds without confirmation

### Requirement: Known limitation — non-atomic preference saves

The system SHALL be understood to save build preference rows (HSR) and cartridge preference rows (N2E) non-atomically: existing rows are deleted then re-inserted in separate DB calls with no transaction.

#### Scenario: Failure between delete and insert

- **WHEN** the re-insert step fails after a successful delete
- **THEN** preference rows are left empty in the DB; local optimistic state still shows previous values until next reload; error toast is shown
