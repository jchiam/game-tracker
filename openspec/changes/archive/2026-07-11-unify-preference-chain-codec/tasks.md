## 1. Schema migration

- [x] 1.1 Add migration `supabase/migrations/20260711000000_p5x_rename_operator_column.sql`: `ALTER TABLE p5x_revelation_preferences RENAME COLUMN operator TO operator_to_next;`

## 2. Shared codec

- [x] 2.1 Add `rowsToChain(raw)` and `chainToRows(chain, { dbId, fkColumn, extra })` to `src/services/rosterPersistence.ts`, beside `savePreferenceRows`, with doc comments stating they are the only chain codec and that `order_index` is re-derived from array position.
- [x] 2.2 Add codec tests to `rosterPersistence.test.ts`: round-trip preservation; degenerate `orderIndex` (gap + duplicate) normalized to `0..n-1` on write; `rowsToChain` sorts arbitrary row order by `order_index`; `extra` columns and `fkColumn` land on every row.

## 3. Game service adoption

- [x] 3.1 HSR `characterService.ts`: delete `toStatPreferences`, use `rowsToChain` in `extras.mapRow` (per-slot filter + substats); replace both insert-row builders in `saveBuildPrefs` with `chainToRows` (`extra: { slot }` for main stats).
- [x] 3.2 N2E `characterService.ts`: delete `toStatPreferences`, use `rowsToChain` in `extras.mapRow`; replace both insert-row builders in `saveCartridgePreferences` with `chainToRows`.
- [x] 3.3 P5X `thiefService.ts`: replace the `mapRow` category-switch chain reconstruction with per-category `filter` + `rowsToChain` (scalar categories `heavens_set`/`space_set` stay as-is); replace the chain row-building in `saveRevelationPreferences` with `chainToRows` (`extra: { category }`); update the select fragment and any column references from `operator` to `operator_to_next`.
- [x] 3.4 Update per-game service tests for the new column name (P5X) and keep config-wiring assertions; drop mapping-body coverage now owned by the codec tests.

## 4. Rider — HSR default aliasing hardening

- [x] 4.1 `src/hooks/honkai-star-rail/useCharacters.ts`: spread `defaultRelics` in `createTrackedCharacter` (`relics: { ...defaultRelics }`) to match the service path; add or extend a test asserting two freshly-added characters have distinct `relics` object references.

## 5. Docs

- [x] 5.1 Update CONTEXT.md "Preference Rows" entry: the chain↔rows codec (`chainToRows`/`rowsToChain`) lives behind the same seam as `savePreferenceRows` and is the only implementation of chain serialization/reconstruction.

## 6. Verify & finalize

- [x] 6.1 Run `npm test` — all suites green.
- [x] 6.2 Run `npm run lint && npm run format:check && npm run build`.
- [x] 6.3 `npx openspec validate --all`.
- [x] 6.4 Remind user to apply the migration to Supabase alongside the code deploy (deploy-ordering window documented in design.md).
