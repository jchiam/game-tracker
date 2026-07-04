## ADDED Requirements

### Requirement: Config-driven roster CRUD factory

The system SHALL provide a `createRosterPersistence(config)` factory that produces `load`, `insert`, `remove`, and `update` functions for a game's tracked-entity table from a per-game config: table name, entity FK column, static catalog array, patch-key-to-column map, insert defaults, own-table select string, and an explicit `fromRow(row, baseEntity)` mapper.

#### Scenario: Load merges DB rows with catalog

- **WHEN** `load(userId)` is called with Supabase configured
- **THEN** the configured table is queried filtered by `profile_id = userId`, each row is matched to its catalog entry by the entity FK column, `fromRow` builds the tracked entity, and rows without a catalog match are dropped

#### Scenario: Insert upserts profile then inserts row

- **WHEN** `insert(userId, entityId)` is called
- **THEN** `user_profiles` is upserted for `userId` first, then a row with the configured insert defaults is inserted into the tracked table, and the new row's `id` is returned

#### Scenario: Update maps patch keys to columns

- **WHEN** `update(dbId, patch)` is called
- **THEN** each camelCase patch key is translated through the configured column map and a single UPDATE is issued against the row matching `dbId`

#### Scenario: Remove deletes by dbId

- **WHEN** `remove(dbId)` is called
- **THEN** the row matching `dbId` is deleted from the configured table

### Requirement: DB-disabled early return

All functions produced by the factory SHALL return early without touching Supabase when the client is not configured: `load` returns an empty array, `insert` returns `null`, `remove` and `update` return without effect.

#### Scenario: Load with DB disabled

- **WHEN** `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` is absent and `load` is called
- **THEN** an empty array is returned and no query is issued

#### Scenario: Insert with DB disabled

- **WHEN** Supabase is not configured and `insert` is called
- **THEN** `null` is returned and no query is issued

### Requirement: Errors are logged and rethrown

Factory-produced functions SHALL log Supabase errors via `console.error` and rethrow them, so callers (hooks) can roll back optimistic state.

#### Scenario: Load failure propagates

- **WHEN** the Supabase query inside `load` returns an error
- **THEN** the error is logged and thrown to the caller

### Requirement: Extras seam for game-specific load reconstruction

The config SHALL accept an optional `extras` adapter — `{ selectFragment, mapRow }` — whose select fragment is appended to the base select and whose `mapRow(row, tracked)` runs after `fromRow` to attach game-specific structures built from joined tables. Games without extras omit the adapter and incur no extra query cost.

#### Scenario: HSR relics and build preferences reconstructed

- **WHEN** the HSR adapter's `load` runs
- **THEN** equipped relics (with substats) and ordered build-preference main/sub stat chains are reconstructed onto each tracked character exactly as the pre-refactor service produced them

#### Scenario: N2E cartridge preferences reconstructed

- **WHEN** the N2E adapter's `load` runs
- **THEN** ordered cartridge-preference main/sub stat chains and comments are reconstructed onto each tracked character exactly as the pre-refactor service produced them

#### Scenario: Game without extras

- **WHEN** a config omits `extras` (R1999, AE)
- **THEN** only the own-table select string is queried and `fromRow` output is returned unchanged

### Requirement: Shared preference-rows save

The system SHALL provide a single `savePreferenceRows` helper implementing the delete-existing-rows-then-reinsert pattern for variable-length preference chains, used by both HSR `saveBuildPrefs` and N2E `saveCartridgePreferences`. It SHALL be the only implementation of this pattern in the codebase, so the documented non-atomic-save limitation has exactly one future fix site.

#### Scenario: Preference rows replaced

- **WHEN** `savePreferenceRows` is called with delete targets, an optional parent-row update, and ordered insert rows
- **THEN** existing rows are deleted from each target table by FK, the parent row is updated if provided, and non-empty insert sets are inserted with sequential `order_index`

#### Scenario: Insert failure surfaces

- **WHEN** an insert step returns an error
- **THEN** the error is logged and thrown so the pending-save queue can raise an error toast

### Requirement: Per-game adapters preserve public service interface

Each game's service file SHALL become a thin config adapter that calls the factory and re-exports the produced functions under the pre-existing names (`loadCharactersFromDB`, `insertArcanist`, `deleteOperator`, …). Game-specific write functions (`upsertRelic`, `deleteRelic`, `saveBuildPrefs`, `saveCartridgePreferences`) remain per-game exports.

#### Scenario: Existing hooks and tests unaffected

- **WHEN** the refactor lands
- **THEN** all four pre-existing service test files pass unmodified and no hook, page, or component import changes
