## Context

Candidate 1 (extract-roster-persistence, archived 2026-07-04) turned the four per-game services into config adapters over `createRosterPersistence`. Their test files were deliberately left untouched as the regression gate. That gate has served its purpose — the extraction landed green — so the duplicated generic tests are now dead weight: four copies of tests whose subject is a single shared implementation, plus five copies of the `createBuilder` mock.

## Goals / Non-Goals

**Goals**

- One home for the chainable Supabase builder mock: `src/test/mocks/supabase.ts`.
- Per-game test files assert only what the adapter owns: config wiring and game-specific write functions.
- Close the insert-wiring gap: no suite currently asserts each game's entity FK column and insert defaults payload.

**Non-Goals**

- No production code changes.
- No parameterized "run the same suite against every config" harness — that would re-test core mechanics 4×, recreating the duplication in a different shape.
- Party service tests are out of scope (party persistence is candidate 4, not yet extracted).

## Decisions

### Decision 1: Delete duplicated generic tests rather than parameterize them

The architecture review sketched a "parameterized service-test suite". Grilling settled on the stronger move: the adapters re-export the factory's functions unchanged (`export const loadOperatorsFromDB = svc.load`), so re-running generic CRUD tests per game proves nothing the core suite doesn't already prove. The deletion test applies to tests too — deleting the duplicates loses no coverage because the subject under test is literally the same function object.

### Decision 2: What each per-game file keeps

Per adapter, three config-wiring tests plus game-specific writes:

| File                            | Keeps                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AE `operatorService.test.ts`    | load mapping (incl. `weaponPreferences` null→`[]`), update column map, insert defaults                                                                                                                                                                                                                                                                                          |
| R1999 `arcanistService.test.ts` | load mapping (incl. null-coalesced fields), update column map, insert defaults                                                                                                                                                                                                                                                                                                  |
| N2E `characterService.test.ts`  | load mapping, cartridge-preference extras mapping (sorting by `order_index`), update column map, insert defaults, `saveCartridgePreferences` payload tests (delete+parent update, main insert, sub insert)                                                                                                                                                                      |
| HSR `characterService.test.ts`  | load mapping, relic extras mapping, build-preference extras mapping (+ comments), update column map, insert defaults, `upsertRelic` suite (happy path, substat replace, empty skip, upsert-failure short-circuit, DB-disabled), `deleteRelic` (match + DB-disabled), `saveBuildPrefs` payload tests (delete+comments update, main insert across slots, sub insert, empty skips) |

Dropped everywhere: generic DB-disabled CRUD, null-data load, catalog-skip, error rethrow (load/insert/update/delete), delete-by-id, profile-upsert — all asserted in `rosterPersistence.test.ts`. N2E's `saveCartridgePreferences` insert-failure tests also drop: failure propagation is `savePreferenceRows` behaviour, covered by the core suite. HSR's `saveBuildPrefs` DB-disabled test drops for the same reason; `upsertRelic`/`deleteRelic` DB-disabled tests stay because those functions own their own `DB_ENABLED` gate.

### Decision 3: Insert tests gain a payload assertion

Old insert tests only asserted table names and returned id. New per-game insert tests assert `builder.insert` was called with `expect.objectContaining({ profile_id, [entityIdColumn]: <id>, ...insertDefaults })` — the only place each game's FK column name and defaults are wiring-tested.

### Decision 4: `createBuilder` superset lands in `src/test/mocks/supabase.ts`

The HSR copy has the largest method list (`match`, `filter`, `gte`, `lte` beyond the common set); the shared helper uses that superset so one helper serves every suite. It sits next to the existing `createMockSession` / `createMockSupabaseClient` helpers, which CLAUDE.md already names as the canonical mock home. Per-game files keep their `vi.doMock('@/lib/supabase')` + `vi.resetModules()` + `vi.stubEnv` scaffolding — that pattern is required by module-scope `DB_ENABLED` capture and is unaffected by importing a helper statically.

## Risks / Trade-offs

- **Silent coverage loss** — mitigated by mapping every deleted test to the core test that covers it (Decision 2 table) and by the pre-push gate (lint, unit, build, e2e).
- **Adapter drift undetected** — if someone edits an adapter to stop delegating to the factory, generic behaviour would no longer be tested for that game. Accepted: the adapter files are ~50 LOC of config; a non-delegating rewrite would be visible in review, and the wiring tests still exercise load/update/insert end-to-end through the real adapter exports.

## Migration Plan

Single change: move helper, rewrite four test files + core suite import, update CLAUDE.md, run full suite. Revert = git revert (test-only).

## Open Questions

None.
