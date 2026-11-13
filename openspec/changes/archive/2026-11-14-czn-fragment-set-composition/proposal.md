# Proposal

## Why

The CZN Memory Fragment Target Build holds exactly one 4-piece Set pick and one 2-piece Set pick, so a triple-2-piece target (2 + 2 + 2 across the six slots) — a legal and common composition in the game — cannot be expressed, and `CONTEXT.md` already records that gap. The 4 + 2 shape was inherited from the ZZZ Drive Disc clone (Phase 3 D10), not from the game.

## What Changes

- **BREAKING (data model)**: replace the two Set picks (`set4Id`, `set2Id` / parent columns `fragment_set_4_id`, `fragment_set_2_id`) with one ordered **target-set composition** — a list of Set ids whose `pieces` sum to at most 6, no duplicates. Order is display order only.
- Persist the composition as Preference Rows in `czn_fragment_preferences` under a new `target_set` category (one row per Set, `stat` = Set id, `order_index` = position, no operator), replacing the two parent columns. A migration widens the category check, copies existing picks into rows (4-piece first, then 2-piece), and drops the columns.
- Generalise the fragment set term to `Σ min(count_i, pieces_i) / 6` over the targeted Sets. Every existing numeric scenario (4 + 2 = 1.0, 4-only = 0.67, partial 2-piece = 0.165) keeps its value.
- Build Preferences tab: the two scoped picks become three budget-aware Set selects — each offers only Sets whose `pieces` fit the remaining budget, and a select is disabled once the budget is spent.
- Card Target Build readout: one Set badge per targeted Set, in composition order.
- `CONTEXT.md` Memory Fragment definition and the CZN row drop the "4-piece/2-piece Set target" wording and the "not expressible" note.
- ZZZ Drive Discs keep their 4 + 2 model (explicitly out of scope).

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `czn-fragment-tracking`: the build-preferences requirement (set picks → target-set composition, parent columns → preference rows), the editor requirement (two scoped picks → budget-aware composition selects), and the card-section readout wording.
- `czn-fragment-scoring`: the set-term requirement (two fixed sub-weights → piece-weighted sum over the composition), plus the Perfect-match and No-preferences scenarios that name the picks.

## Impact

- `src/types.ts` — `CznFragmentBuildPreferences` gains `targetSetIds: string[]`, loses `set4Id` / `set2Id`.
- `supabase/migrations/` — new migration: widen `czn_fragment_preferences.category` CHECK, data copy, drop two columns. Touches a table the `replace_preference_rows` RPC writes; re-run the throwaway `postgres:16` harness.
- `src/services/chaos-zero-nightmare/combatantService.ts` — `mapRow` reconstructs the composition from `target_set` rows; `saveFragmentPreferences` emits those rows and keeps only `fragment_comments` in the parent update.
- `src/utils/fragmentScoring.ts` — set term and `hasPreferences`.
- `src/pages/chaos-zero-nightmare/components/FragmentEditorModal.tsx`, `CombatantCard.tsx` — composition selects and readout.
- `src/hooks/chaos-zero-nightmare/useCombatants.ts` — default preferences shape.
- Tests across the above (service, hook, scoring, build score, editor, card, page).
- `CONTEXT.md`.
- No new RPC, no new shared component, no catalog or pipeline change.
