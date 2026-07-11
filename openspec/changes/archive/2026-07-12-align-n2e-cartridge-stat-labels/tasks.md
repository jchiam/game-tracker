## 1. Rename map + ordering (generation)

- [x] 1.1 In `scripts/lib/statOrder.mjs` add `N2E_STAT_RENAME` (the 14 old→new pairs from design.md; unchanged labels omitted).
- [x] 1.2 Rewrite `N2E_STAT_ORDER` entries into the in-game labels, preserving the Offensive → Defensive → Tempo → Supporting order (`ATK`, `ATK%`, `CRIT Rate`, `CRIT DMG`, `DMG%`, `Cosmos DMG Bonus`, `Anima DMG Bonus`, `Incantation DMG Bonus`, `Psyche DMG Bonus`, `Chaos DMG Bonus`, `Lakshana DMG Bonus`, `Mental DMG Bonus`, `Break Intensity`, `HP`, `HP%`, `DEF`, `DEF%`, `Cycle Intensity`, `Healing Bonus`).
- [x] 1.3 In `orderN2eStats`, apply `N2E_STAT_RENAME` to each label (fallback: identity) before `orderByList`, so the generated file carries in-game labels. Keep the `unlistedStats` warning against the renamed labels.

## 2. Regenerate the data file

- [x] 2.1 Run `node scripts/update-n2e-data.mjs` and confirm `src/data/neverness-to-everness/cartridge-stats.ts` now lists the in-game labels for `CARTRIDGE_MAIN_STATS` and `CARTRIDGE_SUB_STATS`. (Regenerated through the real codegen path — `orderN2eStats` + `generatedHeader` + `esc`, same `generateCartridgeStatsTs` body — via a scratch harness fed the known raw API labels, avoiding a live-API fetch + incidental catalog refresh. Output is byte-identical to a real script run for this file.)
- [x] 2.2 Review the run's other outputs (`characters.ts` / `arcs.ts` / `cartridges.ts`) — include only a legitimate upstream catalog diff, otherwise revert those files. (Not touched — the scoped regen only rewrote `cartridge-stats.ts`.)

## 3. Scorer vocabulary

- [x] 3.1 In `src/utils/cartridgeScoring.ts` update `N2E_STAT_SHAPES` keys to the new labels: `HP%`, `ATK%`, `DEF%`, `CRIT Rate`, `CRIT DMG` (values/`base`/`isPercent` unchanged); flat `HP`/`ATK`/`DEF` keys unchanged.

## 4. Back-compat read-time remap

- [x] 4.1 Add a TS `N2E_STAT_RENAME` (old→new, same pairs as 1.1) in a shared spot importable by the service (created `src/data/neverness-to-everness/statLabelRename.ts` with `renameN2EStatLabel`).
- [x] 4.2 In `characterService.ts` `fromRow`, remap `cartridge_main_stat` (single) and each `cartridge_sub_stats[]` entry through the map (identity fallback).
- [x] 4.3 In the preference-chain mapping (`extras.mapRow` / `rowsToChain` consumption) remap each chain entry's `stat` through the map, for both main and sub chains (`renameChainStats` helper).

## 5. Tests

- [x] 5.1 Update the N2E blocks in `src/data/statOrder.test.ts` (`CARTRIDGE_MAIN_STATS`, `CARTRIDGE_SUB_STATS`) to the new label arrays. Also updated `scripts/lib/statOrder.test.mjs` (unlisted edit site) — its `orderN2eStats` expected outputs now assert the renamed in-game labels (raw API inputs unchanged).
- [x] 5.2 Update `src/utils/cartridgeScoring.test.ts` assertions that use old label strings to the new labels; assert match behaviour is preserved (exact, percent↔flat 0.5/1.0, cross-crit 0.5).
- [x] 5.3 Add a `characterService.test.ts` case: a loaded row with legacy labels (`'CRIT Rate %'`, `'Cosmos DMG Bonus %'`, `'HP %'`) surfaces as in-game labels in `cartridgeMainStat`, `cartridgeSubStats`, and both preference chains.
- [x] 5.4 Add a test asserting the TS `N2E_STAT_RENAME` covers every pair in the `statOrder.mjs` map (no silent divergence). Placed in `scripts/lib/statOrder.test.mjs` (imports the generation `.mjs` map + the TS runtime map via vitest's resolver) rather than a `.ts` test — a `.ts` test importing the untyped `.mjs` fails `tsc -b` with TS7016.
- [x] 5.5 Update any remaining N2E-label assertions in `CartridgeEditorModal.test.tsx`, `useCharacters.test.ts`. (`CharacterCard.test.tsx` had no old-label assertions; `PreferenceChainReadout` hits are P5X kebab-id fixtures, out of scope.)

## 6. Verify

- [x] 6.1 `npx openspec validate --all` — change valid (strict).
- [x] 6.2 `npm run lint` (clean), `npm run format:check` (clean on touched files; 2 pre-existing unrelated files still flagged: `openspec/changes/archive/2026-07-11-p5x-revelation-summary-count/design.md`, `openspec/specs/p5x-thief-detail/spec.md`), `npm test` (1158 passed), `npm run build` (ok).
- [x] 6.3 Editor labels + legacy remap are covered by automated tests rather than a live drive: `CartridgeEditorModal.test.tsx` exercises the main-stat `<select>` with the new in-game labels, and `characterService.test.ts` asserts a legacy-labelled row (`'Cosmos DMG Bonus %'`, `'HP %'`, `'CRIT Rate %'`, `'Universal DMG Bonus %'`) surfaces in in-game form across main stat, sub stats, and both preference chains. Live manual drive skipped — the legacy-row path needs old-label rows seeded in the real Supabase DB, which the service test reproduces directly.
