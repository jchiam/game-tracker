## Purpose

Service-layer persistence core shared by all game modules via `createRosterPersistence` and `createPartyPersistence` (`src/services/rosterPersistence.ts`). Covers config-driven CRUD against per-game Supabase tables, DB-disabled early-return semantics, catalog merge on load, profile upsert on insert, patch-to-column mapping, the extras seam for game-specific joined-table reconstruction, party persistence (load / create-or-update save / delete / favorite toggle), and the shared preference-rows save pattern.

## Requirements

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

### Requirement: Config-driven party persistence factory

The system SHALL provide a `createPartyPersistence(config)` factory in `src/services/rosterPersistence.ts` that produces `loadParties`, `saveParty`, `deleteParty`, and `toggleFavoriteParty` for a game's party tables from a per-game config: parties table, members table, default party name, member row mappers (`memberFromRow` / `memberToRow`), and optional extras (`extraSelect` / `extraFromRow` / `extraToRow`) for game-specific party columns such as `tier` and `is_favorited`.

#### Scenario: Load returns parties with sorted members

- **WHEN** `loadParties(userId)` is called with Supabase configured
- **THEN** the parties table is queried with the base columns, any extras select, and a members join, filtered by `profile_id = userId` and ordered by `created_at` descending, and each party's members are sorted by `slot_index` and mapped through `memberFromRow`

#### Scenario: Save creates a new party

- **WHEN** `saveParty(userId, party)` is called without a party `id`
- **THEN** a party row is inserted with `profile_id`, `name` (falling back to the configured default), `notes` (defaulting to null), and any extras columns, then the members are inserted with the new party's id, which is returned

#### Scenario: Save updates an existing party

- **WHEN** `saveParty(userId, party)` is called with a party `id`
- **THEN** the party row is updated with the same row shape, all existing member rows are deleted, and the new members are inserted

#### Scenario: Favorite toggle updates the party row

- **WHEN** `toggleFavoriteParty(partyId, value)` is called
- **THEN** the party row's `is_favorited` column is updated and `true` is returned on success

#### Scenario: DB disabled

- **WHEN** Supabase is not configured
- **THEN** `loadParties` returns an empty array, `saveParty` returns `null`, and `deleteParty` / `toggleFavoriteParty` return `false`, without touching Supabase

### Requirement: Unified party error semantics

Party persistence errors SHALL be handled uniformly across all games: `loadParties` logs and throws (the shared party hook catches); `saveParty` logs and returns `null` when the party row insert/update fails, and logs but still returns the party id when only the member insert fails (the row is already persisted, and the returned id triggers the hook's reload so local state reflects true DB state); `deleteParty` and `toggleFavoriteParty` log and return `false`. `saveParty` SHALL NOT throw — nothing in the save call chain catches, so a thrown save error would surface as an unhandled promise rejection.

#### Scenario: Party-row save failure

- **WHEN** the party insert or update returns a DB error
- **THEN** the error is logged and `saveParty` resolves to `null` (no rejection)

#### Scenario: Member insert failure after party row persisted

- **WHEN** the party row write succeeds but the member insert returns a DB error
- **THEN** the error is logged and the party id is still returned

#### Scenario: Load failure propagates

- **WHEN** the parties query returns a DB error
- **THEN** the error is logged and thrown to the caller

### Requirement: Per-game party adapters preserve public service interface

Each game's `partyService.ts` SHALL be a thin config adapter that calls `createPartyPersistence` and re-exports the produced functions under the pre-existing names (`loadParties`, `saveParty`, `deleteParty`; R1999 and N2E additionally `toggleFavoriteParty`). Per-game party test files SHALL cover only config wiring — tables queried, member column mapping in both directions, extras columns, default party name — using the shared `createBuilder` mock from `src/test/mocks/supabase.ts`, while generic party CRUD behaviour is covered once by the core `rosterPersistence.test.ts` suite.

#### Scenario: Existing hooks unaffected

- **WHEN** the refactor lands
- **THEN** no hook, page, or component import changes

#### Scenario: Per-game suites assert config wiring

- **WHEN** a per-game party test suite runs
- **THEN** it asserts the game's table names, the member FK column ↔ camelCase key mapping on load and save, any extras columns (tier / is_favorited), and the default party name — without duplicating the core suite's DB-disabled, error-path, or flow tests

### Requirement: Per-game adapters preserve public service interface

Each game's service file SHALL be a thin config adapter that calls the factory and re-exports the produced functions under the pre-existing names (`loadCharactersFromDB`, `insertArcanist`, `deleteOperator`, …). Game-specific write functions (`upsertRelic`, `deleteRelic`, `saveBuildPrefs`, `saveCartridgePreferences`) remain per-game exports. Per-game service test files SHALL cover only what the adapter owns — config wiring (load mapping through `fromRow`/extras, patch-key→column map, insert FK column + defaults payload) and game-specific write functions — while generic CRUD behaviour is covered once by the core `rosterPersistence.test.ts` suite. The shared chainable Supabase query-builder mock SHALL live in `src/test/mocks/supabase.ts` as `createBuilder`.

#### Scenario: Existing hooks unaffected

- **WHEN** the refactor lands
- **THEN** no hook, page, or component import changes

#### Scenario: Per-game suites assert config wiring

- **WHEN** a per-game service test suite runs
- **THEN** it asserts load mapping against the real catalog (including extras reconstruction where configured), the full patch-key→column translation, and the insert payload's entity FK column and defaults — without duplicating the core suite's generic DB-disabled, error-path, or catalog-merge tests

#### Scenario: Game-specific writes stay tested per game

- **WHEN** a game owns write functions outside the factory (HSR relics and build prefs, N2E cartridge prefs)
- **THEN** its suite keeps payload and gating tests for those functions, except behaviour delegated to `savePreferenceRows` (DB-disabled early return, insert-failure propagation), which the core suite covers
