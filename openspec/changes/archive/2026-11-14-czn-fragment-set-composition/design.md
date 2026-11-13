# Design

## Context

See `proposal.md` — Why. Phase 3 (`openspec/changes/archive/2026-11-10-add-czn-phase-3-memory-fragments/design.md`, D6, D10) stored the Target Build's Set picks as two parent columns on `czn_tracked_combatants` (`fragment_set_4_id`, `fragment_set_2_id`) and scored them with fixed sub-weights `0.67` / `0.33` — which are `4/6` and `2/6` in disguise. Chains already live as Preference Rows in `czn_fragment_preferences` (`category`, `stat`, `operator_to_next`, `order_index`) written atomically by `savePreferenceRows` → `replace_preference_rows`, whose `parentUpdate` carries the scalar columns. The catalog has 23 Sets (16 × 4-PC, 7 × 2-PC); a Set is one or the other, never both.

Legal six-slot compositions are any multiset of Sets whose `pieces` sum to ≤ 6: `4+2`, `2+2+2`, `4`, `2+2`, `2`, none. The current model expresses only those with at most one 2-PC Set.

Decisions locked in exploration: one composition per combatant (no alternates / OR); order is display only; ZZZ stays on its 4 + 2 model.

## Goals / Non-Goals

**Goals:**

- Express every legal composition with one data shape and one scoring rule.
- Keep every existing numeric scoring scenario byte-identical.
- Reuse the existing Preference Rows table and RPC — no new RPC, no new shared component.
- Carry existing picks forward without user action.

**Non-Goals:**

- Alternate compositions or OR semantics between Sets.
- Enforcing that equipped pieces match the composition (the score grades it; the editor does not block it).
- Changing ZZZ Drive Discs, the shared scoring core, or the `PreferenceChain` primitive.
- A new shared "composition picker" component — three `Select`s are enough for a maximum of three Sets.

## Decisions

**D1 — Model: `targetSetIds: string[]` replaces `set4Id` / `set2Id`.**
`CznFragmentBuildPreferences { mainStats; subStats; targetSetIds: string[]; comments? }`. Invariants (enforced by the editor, re-asserted defensively by the scorer which ignores ids not in the catalog): no duplicate ids, `Σ pieces ≤ 6`. Order is array order and means display order only. Alternatives: (a) add `fragment_set_2b_id` / `fragment_set_2c_id` columns — hardcodes the three-slot shape into the schema, three special-cased terms in the scorer, and still cannot say "2+2+2 vs 4+2" without branching; (b) keep `set4Id` and turn `set2Id` into `set2Ids: string[]` with "max 1 when set4Id is set, else 3" — a cross-field invariant in every consumer. A single list with a piece budget is the only shape where the editor, the scorer, and the readout share one rule.

**D2 — Persistence: `target_set` rows in `czn_fragment_preferences`; the two parent columns are dropped.**
One row per targeted Set: `category = 'target_set'`, `stat = <set id>`, `operator_to_next = NULL`, `order_index = position`. `saveFragmentPreferences` appends these rows to the chain rows it already emits and keeps only `fragment_comments` in `parentUpdate`; `mapRow` reads them back sorted by `order_index`. The codec comment in `rosterPersistence.ts` already names "single-row set categories" as per-game glue outside `rowsToChain` / `chainToRows`, so the rows are built inline (the chain codec would attach a meaningless `operator`). Alternative: a `TEXT[]` parent column — rejected because the Preference Rows pattern is the project's one home for ordered per-combatant lists and the atomic replace already covers this table. The column CHECK on `category` is widened to include `target_set`; `replace_preference_rows` and `assert_game_table` are untouched (the table name already passes the `czn_` allowlist).

**D3 — Migration = widen CHECK → copy picks to rows → drop columns, in one file.**
`ALTER TABLE czn_fragment_preferences DROP CONSTRAINT …category_check, ADD CONSTRAINT … CHECK (category IN ('slot4_main','slot5_main','slot6_main','sub_stats','target_set'))`; then `INSERT INTO czn_fragment_preferences (tracked_combatant_id, category, stat, operator_to_next, order_index) SELECT id, 'target_set', fragment_set_4_id, NULL, 0 FROM czn_tracked_combatants WHERE fragment_set_4_id IS NOT NULL` and the same for `fragment_set_2_id` with `order_index = CASE WHEN fragment_set_4_id IS NULL THEN 0 ELSE 1 END`; then `ALTER TABLE czn_tracked_combatants DROP COLUMN fragment_set_4_id, DROP COLUMN fragment_set_2_id`. Transactional by Supabase's migration runner. The constraint name is the Postgres default `czn_fragment_preferences_category_check`; the migration names it explicitly on re-add so later changes do not depend on the default. Verified by the throwaway `postgres:16` harness (full migration history + a seeded pair of picks → two ordered rows, columns gone, `replace_preference_rows` still succeeds with a `target_set` row).

**D4 — Set term `Σ min(count_i, pieces_i) / 6`.**
Each targeted Set is worth its share of the six slots. `4/6 = 0.667` and `2/6 = 0.333` reproduce the old `0.67` / `0.33` sub-weights, so the existing scenarios (1.0, 0.67, 0.165) hold; `2+2+2` fully worn scores 1.0; an under-filled composition (`2+2`) caps at `4/6`, consistent with how a lone 4-PC target already capped at `0.67`. Ids not found in the catalog contribute 0 (same visible-but-inert behaviour as the Phase 3 rename risk). Alternative: equal weight `1/n` per targeted Set — rejected because it changes the `4+2` ratio to `0.5 / 0.5` and breaks the existing scenarios. `hasPreferences` tests `targetSetIds.length > 0` instead of the two ids.

**D5 — Editor: three budget-aware `Select`s, no new component.**
The Preferred Sets group renders three `FormGroup` + `Select` rows (`name="pref-set-1..3"`, labels `Set 1` / `Set 2` / `Set 3`). Row _k_ shows `targetSetIds[k] ?? ''`. Its options are catalog Sets with `pieces ≤ 6 − Σ pieces of the other chosen Sets` and not already chosen elsewhere; a row whose option list is empty is disabled. Changing a row rebuilds the list from the three row values, dropping blanks, so clearing row 1 while row 2 is set yields a one-element composition (no holes; display order is the surviving row order). Three rows suffice because the budget admits at most three Sets. Alternatives: `SubStatList` in `stat-only` mode (its vocabulary is stats and it has no capacity rule); `PreferenceChain` (operators are meaningless here); a new `CompositionPicker` shared component (one consumer — premature).

**D6 — Readout: one `pref-stat-badge` per id in order.**
`CombatantCard`'s Sets row maps `targetSetIds` to badges via the existing `setName` lookup. `hasAnyPreference` tests `targetSetIds.length > 0`. No CSS change.

**D7 — Docs: `CONTEXT.md` Memory Fragment definition and the CZN row.**
Replace "one 4-piece Set pick and one 2-piece Set pick as parent columns" with "an ordered **target-set composition** (Set ids whose pieces sum to ≤ 6, e.g. 4+2 or 2+2+2) as `target_set` Preference Rows" and delete "a triple-2-piece target is not expressible"; the row's "4-piece/2-piece **Set** target" becomes "a **Set** composition target".

## Risks / Trade-offs

- [Dropping columns is irreversible for rows the data copy misses] → the copy runs in the same transaction before the drop; the harness run asserts row counts equal non-null pick counts before the migration is committed to the repo.
- [A stale in-flight client (old bundle) writes `fragment_set_4_id` after the migration deploys] → `replace_preference_rows` fails on the unknown column; the save queue surfaces the error toast and the local state rolls back. Window is the deploy minute; accepted.
- [A composition can hold ids the catalog later renames (Phase 3 Risks)] → scorer and readout tolerate unknown ids (0 contribution, raw id badge); the editor's `Select` keeps showing the stored value through its existing unknown-value handling.
- [Three fixed selects feel like "slots" rather than a list] → labels are ordinal (`Set 1–3`), the disabled third row makes the budget visible; acceptable for a max-three list.

## Migration Plan

1. Merge; Supabase applies the migration on deploy (widen CHECK → copy → drop) in one transaction.
2. App bundle deploys with the same commit; both halves change together.
3. Rollback = revert commit plus a reverse migration that re-adds the two columns and repopulates them from the first 4-PC / first 2-PC `target_set` row — lossy for `2+2+2` by definition; acceptable because the feature is new.
