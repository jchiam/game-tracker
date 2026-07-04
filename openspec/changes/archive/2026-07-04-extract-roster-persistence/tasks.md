## 1. Core module

- [x] 1.1 Create `src/services/rosterPersistence.ts`: `RosterPersistenceConfig<TTracked, TPatch>` type (table, entityIdColumn, catalog, columns, insertDefaults, select, fromRow, optional extras) and `createRosterPersistence` factory returning `load` / `insert` / `remove` / `update` with DB-disabled guards, profile upsert on insert, patch-column mapping, catalog merge, extras hook, standardized log-and-rethrow error handling
- [x] 1.2 Add `savePreferenceRows` helper to the same file (delete targets by FK, optional parent-row update, ordered non-empty inserts, log-and-rethrow)
- [x] 1.3 Create `src/services/rosterPersistence.test.ts` using the repo's service-test convention (`vi.doMock` + `vi.resetModules` + `vi.stubEnv` — required because `DB_ENABLED` is captured at module scope): DB-disabled paths, load/catalog-merge/drop-unmatched, insert profile-upsert-then-insert, update column mapping, remove, error propagation, extras invocation, `savePreferenceRows` replace + insert-failure cases

## 2. Adapters (simplest first; existing test file must stay green after each)

- [x] 2.1 Rewrite `src/services/arknights-endfield/operatorService.ts` as config adapter (no extras); run `operatorService.test.ts`
- [x] 2.2 Rewrite `src/services/reverse1999/arcanistService.ts` as config adapter (no extras); run `arcanistService.test.ts`
- [x] 2.3 Rewrite `src/services/neverness-to-everness/characterService.ts` as config adapter with cartridge-preference extras; `saveCartridgePreferences` delegates to `savePreferenceRows`; run `characterService.test.ts` (n2e)
- [x] 2.4 Rewrite `src/services/honkai-star-rail/characterService.ts` as config adapter with relic + build-preference extras; keep `upsertRelic` / `deleteRelic` per-game; `saveBuildPrefs` delegates to `savePreferenceRows`; run `characterService.test.ts` (hsr)

## 3. Verification & docs

- [x] 3.1 Full gate: `npm test`, `npm run lint`, `npm run format:check`, `npm run build`
- [x] 3.2 Update CLAUDE.md: service-layer description in Layer Responsibilities, Known Limitations pointer to single `savePreferenceRows` site, "Wiring a New Game" checklist step for the config adapter
- [x] 3.3 `npx openspec validate --all`
