## Why

The Preference Rows seam (`savePreferenceRows`) concentrates the delete-then-reinsert transaction, but the chain↔rows codec on both sides of it leaked into every equipment game: `toStatPreferences` is byte-identical in HSR and N2E services, P5X reimplements the same reconstruction as an inline category-switch in its Extras Adapter, and all three hand-build `{fk, stat, operator, order_index}` insert rows (~80 LOC duplicated). Worse, the codecs disagree: HSR/N2E re-derive `order_index` from array position on write while P5X persists the UI's stored `orderIndex` — and the shared `PreferenceChain` UI never renumbers on delete, so P5X can persist duplicate `order_index` values whose reload order (and therefore operator-to-next semantics) is nondeterministic.

## What Changes

- Add a shared preference-chain codec beside `savePreferenceRows` in `src/services/rosterPersistence.ts`: `rowsToChain(raw)` (sort by `order_index`, map to `StatPreference`) and `chainToRows(chain, { dbId, fkColumn, extra })` (build insert rows, **re-deriving `order_index` from array position**).
- Replace the per-game codec bodies: HSR/N2E `toStatPreferences` + insert-row builders, P5X `mapRow` category-switch chain reconstruction + insert-row builders. Scalar values stay per-game glue (parent-column updates; P5X's single-row set categories) — the codec models chains only.
- **BREAKING (schema):** migrate `p5x_revelation_preferences.operator` → `operator_to_next`, aligning with the HSR/N2E column name so the codec has zero column-name knobs.
- Fix the latent P5X reload-reorder bug: writes now normalize `order_index` to `0..n-1` (existing degenerate rows self-heal on next save via delete-then-reinsert).
- Rider (same bug class as the archived P5X aliasing fix): `useCharacters.ts` (HSR) assigns `relics: defaultRelics` without a spread — one freshly-added character shares the module-level object identity. Add the spread to match the service path.
- Update the CONTEXT.md Preference Rows entry: the codec joins the transaction behind the same seam.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `shared-roster-persistence`: the **Shared preference-rows save** requirement is extended — a shared chain↔rows codec SHALL be the only implementation of chain serialization/reconstruction, and the requirement's user list gains P5X (stale text said HSR/N2E only).
- `p5x-revelation-preferences`: the **Preference persistence via savePreferenceRows** requirement changes — the operator column is renamed `operator_to_next`, and `order_index` SHALL be re-derived from array position on save (normalization scenario added).

## Impact

- **Code:** `src/services/rosterPersistence.ts` (+codec), `src/services/honkai-star-rail/characterService.ts`, `src/services/neverness-to-everness/characterService.ts`, `src/services/persona-5-phantom-x/thiefService.ts` (codec bodies deleted), `src/hooks/honkai-star-rail/useCharacters.ts` (1-line spread).
- **Schema:** one migration renaming `p5x_revelation_preferences.operator` to `operator_to_next`. Deploy-ordering hazard (code deployed before/after migration reads a missing column) accepted by decision — single-user window is small; migration + code land in one commit.
- **Tests:** codec round-trip tested once in `rosterPersistence.test.ts`; per-game service tests keep column-map/config wiring assertions and drop duplicated mapping-body coverage.
- **Behavioral delta:** none for well-formed chains (contiguous `orderIndex`); degenerate P5X chains (gap/duplicate after mid-chain delete) now persist normalized and reload deterministically — a bugfix.
