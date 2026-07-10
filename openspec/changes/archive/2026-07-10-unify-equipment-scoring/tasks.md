## 1. Shared scoring core

- [x] 1.1 Create `src/utils/scoring/` with `StatShape` type + `matchStatShapes(a, b)` over normalized shapes (exact 1.0 / flat-met-by-percent 1.0 / percent-met-by-flat 0.5 / cross-crit 0.5 / else 0)
- [x] 1.2 Add shared `SCORE_WEIGHTS = { set: 0.35, main: 0.30, sub: 0.35 }` and `getScoreGrade` (S≥90/A≥70/B≥50/C≥30/D; `<0 → ''`)
- [x] 1.3 Add `createEquipmentScore(config)` factory: `-1` sentinel (no prefs / no equip), main-term averaged over slots, sub-term `min(4,Σ)/4` averaged over slots, weight application, floor/cap, `config.setTerm(entity)` plugin
- [x] 1.4 Unit-test the core: match rules, weights (82.5 / 65), sentinel, grade boundaries, term averaging

## 2. Migrate N2E and P5X (behavior frozen)

- [x] 2.1 Add N2E `toStatShape` map; re-express `cartridgeScoring.ts` as a `createEquipmentScore` adapter (set term = cartridge id + rarity penalty); delete duplicated match/grade logic
- [x] 2.2 Assert N2E scores unchanged against existing `cartridgeScoring.test.ts` expectations (24/24, zero assertion edits)
- [x] 2.3 Add P5X `toStatShape` map; re-express `revelationScoring.ts` as an adapter (set term = Heavens graded + Space gated); delete duplicated match/grade logic
- [x] 2.4 Assert P5X scores unchanged against existing `revelationScoring.test.ts` (zero assertion edits)

## 3. HSR set preference (types + persistence)

- [x] 3.1 Add `relicSetId: string | null` and `planarSetId: string | null` to `HsrTrackedCharacter['buildPreferences']` in `src/types.ts`
- [x] 3.2 Add a Supabase migration (additive nullable columns) + hand-authored column mapping in `hsrCharacterService`
- [x] 3.3 Add preferred-relic-set and preferred-planar-set `Select`s to the HSR Build Preferences editor; wire save
- [x] 3.4 Service/editor tests for the new set-preference round-trip

## 4. Migrate HSR scorer (score-changing)

- [x] 4.1 Add HSR `toStatShape` map; re-express `relicScoring.ts` over the shared core with uniform `.35/.30/.35` weights and the `-1` sentinel
- [x] 4.2 Implement the HSR set term: `relicMatch × 0.67 + planarMatch × 0.33` (relic 4-slot /4, planar 2-slot /2, preference-guarded first)
- [x] 4.3 Confirmed head/hands/body/feet = relic family (set id `1*`) and sphere/rope = planar family (set id `3*`) per the equip-tab filter in `RelicEditorModal.tsx`
- [x] 4.4 Update HSR scoring tests to new expected values (new set term + new weights); add set-term + sentinel cases

## 5. Shared score badge + tokens

- [x] 5.1 Add game-agnostic `color.score.grade-{s..d}` ramp to `design-tokens.json`; remove `color.{hsr,n2e,p5x}.score*`; run `npm run build:tokens`
- [x] 5.2 Create shared `<ScoreBadge score={number} />` (renders nothing when `< 0`; `.score-badge.grade-{s..d}` from the ramp) + `.css`
- [x] 5.3 Swap HSR/N2E/P5X cards to `<ScoreBadge>`; remove `hasPreferences`/`tierClass` logic from the HSR card
- [x] 5.4 Delete `.score-badge.tier-*` (HSR), `.cartridge-score-badge` (N2E), `.score-badge.grade-*` (P5X) badge CSS blocks
- [x] 5.5 Add `<ScoreBadge>` Storybook story (all grades + hidden) and update the design-tokens story for the new ramp
- [x] 5.6 Update the three card tests for the shared badge markup

## 6. Score sort in N2E and P5X

- [x] 6.1 Add a `SCORE` sort mode to the N2E roster view passing `calculateCartridgeScore`; insufficient-data last among non-favorites (generalized `useRosterView` to N-mode cycling)
- [x] 6.2 Add a `SCORE` sort mode to the P5X roster view passing `calculateRevelationScore`; insufficient-data last among non-favorites
- [x] 6.3 Sort tests for both games + a three-mode cycle test for `useRosterView`

## 7. Verify

- [x] 7.1 lint clean · full test suite 1069/1069 · build OK (format:check has one pre-existing unrelated warning: `openspec/specs/p5x-revelation-catalog/spec.md`, untouched by this change)
- [x] 7.2 `npx openspec validate unify-equipment-scoring --type change` — valid
