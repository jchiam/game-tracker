## Why

The four per-game tracked-entity services (`characterService.ts` ×2, `arcanistService.ts`, `operatorService.ts` — 619 LOC) are ~99% structurally identical CRUD copies whose variance is data only (table name, entity FK column, column map, insert defaults, row mapping). Every new game copy-pastes ~100–230 LOC, and cross-cutting fixes (error handling, the documented non-atomic preference-save limitation) need four synchronized edits. A 2026-07-04 architecture review identified this as the highest-leverage deepening opportunity in the codebase.

## What Changes

- New shared module `src/services/rosterPersistence.ts` exposing `createRosterPersistence(config)` — a factory producing `load` / `insert` / `remove` / `update` functions from per-game config (table, entity FK column, catalog, patch-column map, insert defaults, own-table select string, explicit `fromRow(row, base)` mapper).
- Optional `extras` seam in the config (`{ selectFragment, mapRow }`) for game-specific load-time reconstruction. Two adapters prove the seam: HSR relics + build preferences, N2E cartridge preferences.
- Shared `savePreferenceRows` helper in the same module, extracted from the delete-all-then-reinsert pattern duplicated in HSR `saveBuildPrefs` and N2E `saveCartridgePreferences` — concentrating the documented non-atomic-save limitation into a single future RPC fix site.
- The four per-game service files become thin config adapters (~20–40 LOC each) that call the factory and re-export the existing function names (`loadCharactersFromDB`, `insertArcanist`, …). Hooks, pages, and existing tests are untouched.
- Game-specific write functions (`upsertRelic`, `deleteRelic`, `saveBuildPrefs`, `saveCartridgePreferences`) remain per-game exports; the two preference savers delegate row building to themselves and persistence to `savePreferenceRows`.
- New `rosterPersistence.test.ts` covering the core through its config interface (hoisted-mock pattern).
- CLAUDE.md updated: Layer Responsibilities service-layer description + "Wiring a New Game" checklist reflect the factory.
- No behaviour change, no schema change, no migration. Existing four service test files stay green as regression proof; collapsing them onto the core suite is a separate follow-up change.

## Capabilities

### New Capabilities

- `shared-roster-persistence`: Service-layer persistence core shared by all game modules — config-driven CRUD (load/insert/delete/update) against per-game Supabase tables, DB-disabled early-return semantics, catalog merge on load, profile upsert on insert, patch-to-column mapping, extras seam for game-specific joined-table reconstruction, and the shared preference-rows save pattern.

### Modified Capabilities

<!-- None. Pure refactor: shared-roster (hook layer) and shared-save-behaviour (write queue) requirements are unchanged; per-game service behaviour is preserved verbatim behind existing export names. -->

## Impact

- **New:** `src/services/rosterPersistence.ts`, `src/services/rosterPersistence.test.ts`.
- **Rewritten as adapters:** `src/services/honkai-star-rail/characterService.ts`, `src/services/reverse1999/arcanistService.ts`, `src/services/neverness-to-everness/characterService.ts`, `src/services/arknights-endfield/operatorService.ts` (public exports unchanged).
- **Unchanged:** all hooks, pages, components, DB schema, RLS, existing service tests (regression gate).
- **Docs:** CLAUDE.md service-layer section and new-game checklist.
- **Risk:** low — behaviour-preserving refactor gated by 1,314 LOC of existing service tests plus full pre-push suite (lint, unit, build, e2e).
