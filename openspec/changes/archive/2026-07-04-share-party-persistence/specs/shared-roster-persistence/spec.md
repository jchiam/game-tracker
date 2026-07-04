## ADDED Requirements

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
