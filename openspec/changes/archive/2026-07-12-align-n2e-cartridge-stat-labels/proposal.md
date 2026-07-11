## Why

N2E cartridge stat labels are echoed verbatim from the everness.info GraphQL API, which uses a fan-DB naming convention that does **not** match the in-game display text. In game the stat panel shows `Cosmos DMG Bonus`, `ATK%`, `CRIT Rate`, `Healing Bonus`; our data carries `Cosmos DMG Bonus %`, `ATK %`, `CRIT Rate %`, `Healing Bonus %`. HSR already uses the tight in-game convention (`ATK%`, `CRIT Rate`, `CRIT DMG`, `Physical DMG Boost`) — N2E is the lone outlier. The mismatch is user-visible in the cartridge editor dropdowns, the preference chain, and the Target Build readout.

In-game display was confirmed by the player (game owner):

- Percentage of a flat stat keeps a tight `%`: `ATK%`, `HP%`, `DEF%`.
- Every other stat drops the trailing `%` entirely: `CRIT Rate`, `CRIT DMG`, `Healing Bonus`, all `… DMG Bonus`.
- `Break Intensity`, `Cycle Intensity`, and flat `ATK` / `HP` / `DEF` are already correct.
- The main-stat-only / substat-only split is already correct (element DMG bonuses main-only, the universal DMG substat substat-only — the game labels it plainly `DMG%`). Not touched.

## What Changes

- Rename the 14 mismatched N2E stat labels to their in-game form via an explicit `N2E_STAT_RENAME` map (no blanket rule — the flat-percent trio keeps a tight `%`, everything else drops ` %`). 6 labels are unchanged.
- Regenerate `cartridge-stats.ts` so `CARTRIDGE_MAIN_STATS` / `CARTRIDGE_SUB_STATS` carry the in-game labels.
- Update the scorer's `N2E_STAT_SHAPES` vocabulary keys and `N2E_STAT_ORDER` to the new labels.
- **Back-compat (read-time remap):** DB rows persisted under the old labels (`cartridge_main_stat`, `cartridge_sub_stats[]`, and the two preference-chain child tables) are remapped old→new when loaded, so existing saved builds keep matching option lists, the scorer, and the readout. No DB migration, no data loss, reversible.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `n2e-cartridge-catalog`: gains a requirement that generated stat labels match in-game display text via an explicit rename applied in the update pipeline, plus a read-time back-compat remap of legacy-labelled DB rows.
- `n2e-cartridge-scoring`: the "Stat match scoring rules" scenarios are restated in the in-game label vocabulary (`HP%`/`ATK%`/`DEF%`, `CRIT Rate`/`CRIT DMG`) — the match behaviour is unchanged, only the stat-id strings the shape map keys off.

## Impact

- **Code:** `scripts/lib/statOrder.mjs` (rename map + reordered `N2E_STAT_ORDER`), `scripts/update-n2e-data.mjs` (apply rename before ordering), `src/data/neverness-to-everness/cartridge-stats.ts` (regenerated), `src/utils/cartridgeScoring.ts` (`N2E_STAT_SHAPES` keys), `src/services/neverness-to-everness/characterService.ts` (read-time remap in `fromRow` + preference-chain mapping).
- **Tests:** `src/data/statOrder.test.ts` (N2E pins), `src/utils/cartridgeScoring.test.ts`, `src/services/neverness-to-everness/characterService.test.ts` (remap), `CartridgeEditorModal.test.tsx` / `CharacterCard.test.tsx` / `useCharacters.test.ts` where they assert N2E label strings.
- **DB:** none — back-compat is read-time, no migration.
- **Data / scripts:** `cartridge-stats.ts` regenerated; the same run refreshes `characters.ts` / `arcs.ts` / `cartridges.ts` from live API (keep only the stat-label diff unless the catalog legitimately changed).
- **Backwards compatibility:** existing saved N2E cartridge builds and preferences remain fully functional via the read-time remap; new saves write in-game labels.
