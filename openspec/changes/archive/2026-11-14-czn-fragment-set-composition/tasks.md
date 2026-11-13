# Tasks

## 1. Model and migration

- [x] 1.1 Replace `set4Id` / `set2Id` on `CznFragmentBuildPreferences` in `src/types.ts` with `targetSetIds: string[]`; update the default-preferences literal in `src/hooks/chaos-zero-nightmare/useCombatants.ts` and `combatantService.ts` `toTracked`; verify `npx tsc --noEmit` lists only the consumers touched in later groups.
- [x] 1.2 Add `supabase/migrations/20261113000000_czn_fragment_set_composition.sql`: drop and re-add (named) the `czn_fragment_preferences` category CHECK including `target_set`, copy `fragment_set_4_id` (order 0) and `fragment_set_2_id` (order 0 or 1) into `target_set` rows, drop both columns; verify the file applies cleanly in the throwaway `postgres:16` harness (full migration history, stub auth schema).
- [x] 1.3 In the same harness run, seed one combatant with both picks and one with only a 2-piece pick, apply the migration, and verify two ordered rows (`0`, `1`) and one row at `0` respectively, that both columns are gone, and that `replace_preference_rows` accepts a `target_set` insert row under the caller's RLS.

## 2. Service and hook

- [x] 2.1 Update `combatantService.ts` `mapRow` to rebuild `targetSetIds` from `target_set` rows sorted by `order_index`, and `saveFragmentPreferences` to emit one `target_set` row per id (`stat` = id, `operator_to_next` null, `order_index` = position) with only `fragment_comments` in `parentUpdate`; verify `combatantService.test.ts` asserts the RPC payload shape for a `2+2+2` composition, an empty composition, and the load mapping order.
- [x] 2.2 Update `useCombatants.test.ts` fixtures and assertions from the two ids to `targetSetIds`; verify `npm test -- useCombatants` passes.

## 3. Scoring

- [x] 3.1 Rewrite `setTerm` in `src/utils/fragmentScoring.ts` as `Σ min(count_i, pieces_i) / 6` over `targetSetIds` (catalog lookup for `pieces`, unknown ids contribute 0) and `hasPreferences` to test `targetSetIds.length > 0`; verify `fragmentScoring.test.ts` keeps the existing 1.0 / 0.67 / 0.165 cases and adds `2+2+2` = 1.0, `2+2` = 0.67 cap, unknown id = 0, and order-independence.
- [x] 3.2 Update `cznBuildScore.test.ts` fixtures to `targetSetIds`; verify `npm test -- cznBuildScore` passes.

## 4. Editor and card

- [x] 4.1 Replace the two pick selects in `FragmentEditorModal.tsx` with three budget-aware `Select`s (`pref-set-1..3`; options = Sets with `pieces ≤ 6 − other chosen pieces`, excluding already-chosen ids; disabled when no option fits; change rebuilds `targetSetIds` without holes); verify `FragmentEditorModal.test.tsx` covers 4-PC-first limits the other rows to 2-PC sets, a full 4+2 disables the third row, three 2-PC picks allowed, and clearing a 4-PC frees the budget.
- [x] 4.2 Update `CombatantCard.tsx` Sets row to one badge per id in order and `hasAnyPreference` to the list length; verify `CombatantCard.test.tsx` asserts three badges in composition order and the readout stays hidden on an empty composition.
- [x] 4.3 Update `CznPage.test.tsx` fixtures to `targetSetIds`; verify `npm test -- CznPage` passes.

## 5. Docs and integration

- [x] 5.1 Update `CONTEXT.md` (Memory Fragment definition: composition as `target_set` Preference Rows, remove the "not expressible" note; CZN row: "Set composition target"); verify the file contains no remaining `4-piece/2-piece` wording for CZN.
- [x] 5.2 Run `npm run lint && npm run format:check && npm test && npm run build`; verify all pass with no `set4Id` / `set2Id` / `fragment_set_4_id` / `fragment_set_2_id` references left under `src/` (`grep` returns nothing).
- [x] 5.3 Run `npx openspec validate --all`; verify it passes.
