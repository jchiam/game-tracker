## Why

The four per-game service test files (`operatorService.test.ts`, `arcanistService.test.ts`, `characterService.test.ts` ×2 — 1,318 LOC) predate the `rosterPersistence` extraction and still test the generic CRUD mechanics (DB-disabled early returns, null-data handling, catalog-skip, error rethrow, delete-by-id, profile upsert) four times over. Those mechanics now live in one place — `src/services/rosterPersistence.ts` — and are proven once by `rosterPersistence.test.ts` (19 tests). The per-game copies are pure duplication: each also re-declares its own `createBuilder` Supabase mock (5 copies total including the core suite). This was identified as candidate 2 in the 2026-07-04 architecture review and deliberately deferred out of the extraction change so the old tests could serve as the regression gate.

## What Changes

- `createBuilder` (chainable Supabase query-builder mock) moves to `src/test/mocks/supabase.ts` as a shared exported helper — the superset method list (`select, eq, insert, update, delete, upsert, match, order, filter, gte, lte`) so all suites can use it. The 5 local copies are deleted.
- Each per-game service test file collapses to what its adapter actually owns:
  - **Config wiring** — one full load-mapping test (select string + `fromRow` + extras reconstruction against the real catalog), one update test asserting the full patch-key→column map, one insert test asserting the entity FK column and insert defaults payload (a wiring gap the old suites never asserted).
  - **Game-specific writes** — HSR keeps `upsertRelic` / `deleteRelic` / `saveBuildPrefs` tests (including the DB-disabled tests for the two functions that own their own `DB_ENABLED` gate); N2E keeps `saveCartridgePreferences` payload tests.
- Deleted from per-game files: generic DB-disabled CRUD tests, null-data / catalog-skip / error-rethrow / delete-by-id / profile-upsert tests — all covered verbatim by `rosterPersistence.test.ts` against the factory the adapters re-export.
- `rosterPersistence.test.ts` switches to the shared `createBuilder` import.
- CLAUDE.md Testing Conventions gains one line pointing at the shared helper.
- Pure test refactor — no production code change, no behaviour change, no schema change.

## Capabilities

### New Capabilities

<!-- None. -->

### Modified Capabilities

- `shared-roster-persistence`: the "adapters preserve public service interface" requirement's regression scenario is updated — per-game test files now cover config wiring and game-specific writes only; generic CRUD behaviour is covered once by the core suite.

## Impact

- **Modified:** `src/test/mocks/supabase.ts` (+`createBuilder`), `src/services/rosterPersistence.test.ts`, the four per-game service test files (each shrinks ~60–80%), CLAUDE.md Testing Conventions.
- **Unchanged:** all production code, hooks, pages, DB schema, e2e tests.
- **Risk:** low — test-only change; the full unit suite plus lint/build/e2e pre-push gate stays green. The one real risk is silently losing coverage; mitigated by keeping one end-to-end wiring test per adapter concern and adding the previously missing insert-defaults assertion.
