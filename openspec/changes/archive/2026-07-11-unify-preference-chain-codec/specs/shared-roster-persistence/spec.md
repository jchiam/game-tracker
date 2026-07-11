## MODIFIED Requirements

### Requirement: Shared preference-rows save

The system SHALL provide a single `savePreferenceRows` helper implementing the delete-existing-rows-then-reinsert pattern for variable-length preference chains, used by HSR `saveBuildPrefs`, N2E `saveCartridgePreferences`, and P5X `saveRevelationPreferences`. It SHALL be the only implementation of this pattern in the codebase, so the documented non-atomic-save limitation has exactly one future fix site.

#### Scenario: Preference rows replaced

- **WHEN** `savePreferenceRows` is called with delete targets, an optional parent-row update, and ordered insert rows
- **THEN** existing rows are deleted from each target table by FK, the parent row is updated if provided, and non-empty insert sets are inserted with sequential `order_index`

#### Scenario: Insert failure surfaces

- **WHEN** an insert set fails after the deletes have run
- **THEN** the error is logged and rethrown so the caller's save queue surfaces it

## ADDED Requirements

### Requirement: Shared preference-chain codec

The system SHALL provide a single chain↔rows codec beside `savePreferenceRows`, and it SHALL be the only implementation of preference-chain serialization and reconstruction in the codebase:

- `rowsToChain(raw)` SHALL sort rows by `order_index` and map each to a `StatPreference` (`stat`, `operator` from the `operator_to_next` column, `orderIndex` from `order_index`).
- `chainToRows(chain, { dbId, fkColumn, extra })` SHALL build insert rows carrying the FK column, any static `extra` columns (e.g. `slot`, `category`), `stat`, `operator_to_next`, and an `order_index` **re-derived from array position** (`0..n-1`) — never the chain entries' stored `orderIndex` values.

Game services SHALL use the codec for every preference chain (HSR main-stat/substat chains, N2E main-stat/substat chains, P5X per-slot main-stat and substat chains) and SHALL NOT hand-write the sort/map/index mechanics. Non-chain scalar values (parent-column updates, single-row set categories) remain per-game and are outside the codec.

#### Scenario: Round trip preserves the chain

- **WHEN** a chain is serialized with `chainToRows` and the resulting rows are reconstructed with `rowsToChain`
- **THEN** the reconstructed chain has the same stats and operators in the same order

#### Scenario: Degenerate order indices are normalized on write

- **WHEN** a chain whose entries carry gapped or duplicate `orderIndex` values (produced by mid-chain delete then add in the shared chain editor) is serialized
- **THEN** the written rows carry `order_index` values `0..n-1` matching the array order the user saw

#### Scenario: Reconstruction orders by order_index

- **WHEN** rows arrive from the DB in arbitrary order
- **THEN** `rowsToChain` returns entries sorted by `order_index`
