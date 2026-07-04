# Tasks

## 1. Shared builder mock

- [x] 1.1 Add `createBuilder` to `src/test/mocks/supabase.ts` with the superset method list (`select, eq, insert, update, delete, upsert, match, order, filter, gte, lte`), `.single()` resolver, and awaitable `.then`
- [x] 1.2 Switch `src/services/rosterPersistence.test.ts` to import the shared `createBuilder`; delete its local copy; suite stays green

## 2. Collapse per-game suites (simplest first)

- [x] 2.1 AE `operatorService.test.ts` — keep load mapping (+ `weaponPreferences` null default), update column map; add insert defaults/FK payload test; delete generic duplicates and local `createBuilder`
- [x] 2.2 R1999 `arcanistService.test.ts` — same treatment (load mapping, update column map, insert defaults)
- [x] 2.3 N2E `characterService.test.ts` — wiring tests + cartridge-preference extras mapping + `saveCartridgePreferences` payload tests; drop insert-failure tests (covered by core `savePreferenceRows` tests)
- [x] 2.4 HSR `characterService.test.ts` — wiring tests + relic/build-pref extras mapping + `upsertRelic`/`deleteRelic` suites (incl. their DB-disabled tests) + `saveBuildPrefs` payload tests; drop `saveBuildPrefs` DB-disabled test

## 3. Docs and verification

- [x] 3.1 Add one line to CLAUDE.md Testing Conventions pointing service tests at the shared `createBuilder`
- [x] 3.2 Run `npm test`, `npm run lint`, `npm run format:check` — all green; note LOC delta
