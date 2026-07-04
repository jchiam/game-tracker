## MODIFIED Requirements

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
