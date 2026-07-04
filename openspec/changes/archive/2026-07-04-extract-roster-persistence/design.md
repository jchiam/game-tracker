## Context

Four per-game tracked-entity services share one implementation shape — `load` / `insert` / `delete` / `update` against Supabase with a DB-disabled guard, profile upsert, patch-column map, and catalog merge. Variance is almost entirely data (table/column names, defaults, row mapping). Two services additionally embed genuine behaviour: HSR reconstructs equipped relics and build-preference chains from joined tables; N2E reconstructs cartridge-preference chains. Both also implement the same non-atomic delete-then-reinsert preference save documented in CLAUDE.md's Known Limitations.

Design decisions below were settled in an interactive grilling session on 2026-07-04 (architecture review, candidate 1).

## Goals / Non-Goals

**Goals:**

- One deep roster-persistence module; per-game services become ~20–40 LOC config adapters.
- Public per-game service exports unchanged — hooks and existing tests untouched.
- Equipment/preference load reconstruction behind a named `extras` seam with two real adapters (HSR, N2E).
- One implementation of the delete-then-reinsert preference-save pattern (`savePreferenceRows`).
- Core covered by its own test file through the config interface.

**Non-Goals:**

- No behaviour change, no DB schema change, no RLS change.
- No fix for the non-atomic preference save (still deferred to a future plpgsql RPC; this change only concentrates it).
- No collapse of the four existing service test files (follow-up change — they serve as the regression gate here).
- No changes to party services, hooks, modals, or update scripts (separate review candidates).

## Decisions

1. **Thin config adapters, not direct factory use from hooks.** Per-game service files stay and re-export factory output under existing names. Rationale: zero churn in hooks/pages/tests; the service file remains the single place a game's persistence is declared. Alternative (hooks call factory directly) rejected — moves DB config into the hook layer and forces test rewiring.

2. **Explicit `fromRow(row, base)` per game, not derivation from the column map.** ~15 lines of plain, type-checked mapping per game beats reflective magic. Derivation was rejected because select strings and defaults can't be fully inferred (non-patch columns like `build_comments`; non-1:1 mappings like N2E `awakening_slots`).

3. **Config supplies the own-table select string.** Cannot be derived from the column map (see above). Core appends `extras.selectFragment` when present.

4. **`extras` = `{ selectFragment, mapRow }`, load-side only.** Write-side equipment functions (`upsertRelic`, `deleteRelic`, `saveBuildPrefs`, `saveCartridgePreferences`) stay as plain per-game exports — they are game behaviour, not CRUD. Folding extras into `fromRow` was rejected: it erases the named seam and forces every game to own the full select string.

5. **`savePreferenceRows` lives in `rosterPersistence.ts`.** Signature: delete targets (table + FK column), optional parent-row update, insert sets. Both preference savers keep their row-building locally and delegate persistence. This makes the non-atomic pattern single-sited for the eventual RPC fix.

6. **Core standardizes error handling**: log via `console.error` with one message set, rethrow. Minor message-string drift across the four services is acceptable to lose (nothing asserts on the strings).

7. **Typing**: `createRosterPersistence<TTracked, TPatch>` generic over the tracked entity and patch types; `columns: Record<keyof TPatch, string>`; `fromRow` returns `TTracked`. Catalog entries typed via the base-entity type parameter inferred from the catalog array.

## Risks / Trade-offs

- [Subtle per-game divergence hides in the copies — e.g. R1999 inserts full default column set, AE inserts a partial one] → Insert defaults are per-game config verbatim; no normalization during extraction. Existing tests assert insert payloads and catch drift.
- [Generic typing turns opaque (`any` leakage) and hurts editor UX] → Keep generics to two parameters; adapters annotate `fromRow` return types explicitly; strict mode is already on.
- [Config surface grows until it is as complex as the code it replaced (shallow in the other direction)] → Config is data + two small functions max (`fromRow`, `extras.mapRow`). Anything needing a third function goes per-game, outside the factory.
- [Regression risk in HSR/N2E load reconstruction (most intricate code being moved)] → Implementation order stresses the core with simple adapters first (AE → R1999 → N2E → HSR); existing test files run unmodified after each adapter.

## Migration Plan

Single PR, ordered commits or ordered work within one commit:

1. Core `rosterPersistence.ts` + `rosterPersistence.test.ts`.
2. AE adapter (simplest, no extras) — `operatorService.test.ts` green.
3. R1999 adapter — `arcanistService.test.ts` green.
4. N2E adapter (cartridge extras + `savePreferenceRows`) — tests green.
5. HSR adapter (relic extras + build-pref saver) — tests green.
6. CLAUDE.md updates.

Rollback: revert the PR — public interfaces unchanged, so revert is clean.

## Open Questions

None — design settled in grilling session.
