## REMOVED Requirements

### Requirement: Config-driven roster CRUD factory

**Reason**: Superseded by "Roster CRUD factory" below — the insert path no longer upserts `user_profiles` (that row is provisioned by the `on_auth_user_created` trigger), so the "Insert upserts profile then inserts row" scenario is no longer true.

**Migration**: None for callers — `load` / `insert` / `remove` / `update` keep their signatures.

### Requirement: Shared preference-rows save

**Reason**: Superseded by "Atomic preference-rows save" below — the delete / parent-update / insert steps run inside one `replace_preference_rows` RPC, so the per-step failure scenarios no longer describe distinct outcomes.

**Migration**: None for callers — `savePreferenceRows` keeps its options shape.

### Requirement: Unified party error semantics

**Reason**: Superseded by "Party error semantics" below — an atomic `save_party` RPC has no "row persisted, members did not" outcome, so `PartySaveResult` drops `membersSaved`.

**Migration**: Callers reading `membersSaved` read `partyId` only; a non-null id means the whole party persisted.

## ADDED Requirements

### Requirement: Roster CRUD factory

The system SHALL provide a `createRosterPersistence(config)` factory that produces `load`, `insert`, `remove`, and `update` functions for a game's tracked-entity table from a per-game config: table name, entity FK column, static catalog array, patch-key-to-column map, insert defaults, own-table select string, and an explicit `fromRow(row, baseEntity)` mapper. The `user_profiles` row each insert's FK references SHALL be provisioned by the `on_auth_user_created` trigger on `auth.users` (with a one-time backfill), never by the client.

#### Scenario: Load merges DB rows with catalog

- **WHEN** `load(userId)` is called with Supabase configured
- **THEN** the configured table is queried filtered by `profile_id = userId`, each row is matched to its catalog entry by the entity FK column, `fromRow` builds the tracked entity, and rows without a catalog match are dropped

#### Scenario: Insert is a single call

- **WHEN** `insert(userId, entityId)` is called
- **THEN** exactly one request is issued — a row with the configured insert defaults is inserted into the tracked table and the new row's `id` is returned — and `user_profiles` is not touched

#### Scenario: Update maps patch keys to columns

- **WHEN** `update(dbId, patch)` is called
- **THEN** each camelCase patch key is translated through the configured column map and a single UPDATE is issued against the row matching `dbId`

#### Scenario: Remove deletes by dbId

- **WHEN** `remove(dbId)` is called
- **THEN** the row matching `dbId` is deleted from the configured table

### Requirement: Atomic preference-rows save

The system SHALL provide a single `savePreferenceRows` helper for variable-length preference chains, used by HSR `saveBuildPrefs`, N2E `saveCartridgePreferences`, P5X `saveRevelationPreferences`, and ZZZ `saveDiscPreferences`. It SHALL send the delete targets, optional parent-row update, and ordered insert rows as one call to the `replace_preference_rows` plpgsql function (`SECURITY INVOKER`, so the caller's RLS applies), which performs delete-by-FK, parent update, and reinsert inside one statement — one round trip, committed or rolled back together. Empty insert sets SHALL be dropped from the payload. The helper SHALL be the only client-side implementation of the pattern and the function its only server-side one. A parent update that matches no visible row SHALL raise. Table names SHALL be validated server-side against the game-table allowlist.

#### Scenario: Preference rows replaced in one RPC

- **WHEN** `savePreferenceRows` is called with delete targets, an optional parent-row update, and ordered insert rows
- **THEN** a single `replace_preference_rows` RPC carries `p_parent_id`, the delete targets as `{ table, fk_column }`, the parent update (or `null`), and only the non-empty insert sets; no direct table request is issued

#### Scenario: RPC failure surfaces

- **WHEN** the RPC returns a DB error
- **THEN** the error is logged and rethrown so the caller's save queue surfaces it, and no partial write remains in the DB

#### Scenario: Parent row not visible

- **WHEN** the parent update targets a row the caller cannot see under RLS
- **THEN** the function raises and nothing is written

### Requirement: Shared equipment-slot save

The system SHALL provide a single `upsertEquipmentSlot` helper in `src/services/rosterPersistence.ts` for equipped items that occupy one named slot and carry substat child rows (HSR relics, ZZZ Drive Discs). It SHALL send the slot row, its conflict key, the substat table and FK, and the substat rows (without the FK) as one call to the `upsert_equipment_slot` plpgsql function (`SECURITY INVOKER`), which upserts the slot row on its unique key, deletes the old substat rows, and inserts the new ones with the slot id filled in — one round trip, atomic. Per-game `upsertRelic` / `upsertDisc` SHALL be config adapters over it.

#### Scenario: Slot upserted with substats replaced

- **WHEN** `upsertEquipmentSlot` is called for a slot with substat rows
- **THEN** a single `upsert_equipment_slot` RPC carries the table, row, conflict columns, substat table, substat FK column, and substat rows; the slot row is created or updated and its substats replaced

#### Scenario: Empty substat list

- **WHEN** the substat list is empty
- **THEN** the RPC still runs and the slot's existing substat rows are removed

#### Scenario: RPC failure surfaces

- **WHEN** the RPC returns a DB error
- **THEN** the error is logged and rethrown, and the slot's prior substats are intact

### Requirement: Party error semantics

Party persistence errors SHALL be handled uniformly across all games: `loadParties` logs and throws (the shared party hook catches); `saveParty` never rejects and resolves to a `PartySaveResult` `{ partyId: string | null }` — `partyId` is `null` when the atomic `save_party` RPC fails or returns no id, and a non-null id means the party row and its members both persisted; `deleteParty` and `toggleFavoriteParty` log and return `false`. `saveParty` SHALL NOT throw — nothing in the save call chain catches, so a thrown save error would surface as an unhandled promise rejection.

#### Scenario: Party save failure

- **WHEN** the `save_party` RPC returns a DB error (including a rejected member insert, which rolls back the party row write)
- **THEN** the error is logged and `saveParty` resolves to `{ partyId: null }` (no rejection)

#### Scenario: Full success

- **WHEN** the RPC returns the party id
- **THEN** `saveParty` resolves to `{ partyId: <id> }`

#### Scenario: Load failure propagates

- **WHEN** the parties query returns a DB error
- **THEN** the error is logged and thrown to the caller

#### Scenario: HTTP 500 surfaces as a thrown error

- **WHEN** the REST endpoint answers a roster or parties load with HTTP 500
- **THEN** the factory's load function rejects with the DB error rather than resolving to an empty list

## MODIFIED Requirements

### Requirement: Config-driven party persistence factory

The system SHALL provide a `createPartyPersistence(config)` factory in `src/services/rosterPersistence.ts` that produces `loadParties`, `saveParty`, `deleteParty`, and `toggleFavoriteParty` for a game's party tables from a per-game config: parties table, members table, default party name, member row mappers (`memberFromRow` / `memberToRow`), and optional extras (`extraSelect` / `extraFromRow` / `extraToRow`) for game-specific party columns such as `tier` and `is_favorited`. `saveParty` SHALL be one call to the `save_party` plpgsql function (`SECURITY INVOKER`), which inserts or updates the party row, replaces its members, and returns the party id inside one statement.

#### Scenario: Load returns parties with sorted members

- **WHEN** `loadParties(userId)` is called with Supabase configured
- **THEN** the parties table is queried with the base columns, any extras select, and a members join, filtered by `profile_id = userId` and ordered by `created_at` descending, and each party's members are sorted by `slot_index` and mapped through `memberFromRow`

#### Scenario: Save creates a new party

- **WHEN** `saveParty(userId, party)` is called without a party `id`
- **THEN** a single `save_party` RPC carries the parties and members tables, `profile_id`, a null party id, the party row (`name` falling back to the configured default, `notes` defaulting to null, plus any extras columns), and the members mapped through `memberToRow` without `party_id`; the new party's id is returned

#### Scenario: Save updates an existing party

- **WHEN** `saveParty(userId, party)` is called with a party `id`
- **THEN** the same RPC carries that id; the party row is updated with the same row shape, all existing member rows are deleted, and the new members are inserted, atomically

#### Scenario: Favorite toggle updates the party row

- **WHEN** `toggleFavoriteParty(partyId, value)` is called
- **THEN** the party row's `is_favorited` column is updated and `true` is returned on success

#### Scenario: DB disabled

- **WHEN** Supabase is not configured
- **THEN** `loadParties` returns an empty array, `saveParty` resolves `{ partyId: null }`, and `deleteParty` / `toggleFavoriteParty` return `false`, without touching Supabase
