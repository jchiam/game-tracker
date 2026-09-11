## MODIFIED Requirements

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
