## Purpose

Shared debounced save mechanism used by all game modules. Covers the write queue, optimistic updates, rollback on failure, saving indicator, and unsaved-changes guard.

## Requirements

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

The system SHALL revert optimistic state to the pre-update snapshot and show an error toast when a DB write fails. For debounced field updates, the snapshot is taken from the row when its first pending patch is queued and the rollback restores only the fields present in the failed merged payload, so unrelated fields edited afterwards are kept. Writes issued through `queueAction` (relics, preference chains) are game-specific and surface a toast only.

#### Scenario: DB write failure on field update

- **WHEN** a debounced field update rejects
- **THEN** the fields in the failed payload revert to their values before the first pending patch and an error toast is shown

#### Scenario: Unrelated fields survive rollback

- **WHEN** a debounced field update for one field rejects while a later patch to a different field is pending
- **THEN** only the failed field reverts; the later field keeps its edited value

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

### Requirement: Multi-row writes are atomic RPCs

The system SHALL perform every write that touches more than one row — preference-row replacement, equipped-slot upsert with substats, party save with members — as a single `supabase.rpc` call to a `SECURITY INVOKER` plpgsql function, so the steps commit or roll back as a unit under the caller's RLS in one round trip. Client code SHALL NOT reintroduce a sequence of dependent table calls for these writes. Because the mocked unit tests only assert the RPC payload, the functions' atomicity, RLS enforcement, and table allowlist SHALL be verified by applying the full migration history to a throwaway Postgres whenever a migration touches an RPC.

#### Scenario: Failure mid-write leaves prior state

- **WHEN** any step inside the RPC fails (bad column, unique violation, RLS rejection)
- **THEN** no step's effect is visible in the DB, the client receives the error, the debounced queue shows the error toast, and local optimistic state is unchanged until the user retries

#### Scenario: One round trip per save

- **WHEN** a preference chain, equipped slot, or party is saved
- **THEN** exactly one request reaches Supabase for the write (a party save additionally reloads the list)
