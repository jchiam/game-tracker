## 1. Foundation — shared CSS, types, migration, service

- [x] 1.1 Add `.equip-slot-grid` / `.equip-slot-cell` to `src/styles/card.css` (generalized from HSR's `.relics-grid`/`.relic-slot`) and `.equip-slot-card` / `.equip-slot-header` to `src/styles/controls.css` (generalized from P5X's `.rev-slot-card`/`.rev-slot-header`); remove the originals from `CharacterCard.css` (HSR) and `RevelationEditorModal.css` in the same pass as their consumers migrate (tasks 2.x/3.x)
- [x] 1.2 Update `CardPatterns` / `ControlPatterns` Storybook stories with the new shared slot-grid and slot-card patterns
- [x] 1.3 Add `comments: string` to `P5xRevelationPreferences` in `src/types.ts`
- [x] 1.4 Create migration `20260710000007_p5x_add_build_comments.sql` adding `build_comments TEXT` to `p5x_tracked_thieves`
- [x] 1.5 Wire `build_comments` through `thiefService`: select column, fromRow default `''`, `saveRevelationPreferences` parentUpdate; update `thiefService.test.ts` (load mapping + save round-trip)

## 2. HSR — unified relic editor modal

- [x] 2.1 Rework `RelicEditorModal.tsx`: Equip tab renders six `.equip-slot-card`s (set Select with slot-family filter, fixed/variable main, SubStatList, set-gating per slot); accept `anchorSlot` and scroll it into view on mount (`scrollIntoView?.()`); set "None" triggers the slot's remove path; footer reduced to "Done"
- [x] 2.2 Rework the modal's Build Preferences tab: all four variable-slot main-stat `PreferenceChain`s together, then substat chain, preferred relic/planar set `Select`s, `BuildComments`
- [x] 2.3 Update `HsrPage.tsx`: editing state `{ charId, slot }` → `{ charId, anchorSlot }`; pass per-slot save/remove callbacks (`saveRelicData`/`removeRelicData` signatures unchanged)
- [x] 2.4 Migrate HSR `CharacterCard.tsx` relic grid to `.equip-slot-grid`/`.equip-slot-cell` classes; convert the card level slider to `LevelSlider`; trim migrated rules from `CharacterCard.css` and slot-card rules from `RelicEditorModal.css`
- [x] 2.5 Rewrite `RelicEditorModal.test.tsx` for the all-slots modal (all six slot cards render, family filtering, set-None removes, prefs tab shows four chains + comments, anchor scroll via `scrollIntoView` spy); update `CharacterCard.test.tsx` for class migration + LevelSlider
- [x] 2.6 Gate: `npm test` + `npx tsc --noEmit` green

## 3. P5X — slot grid, anchor, comments, Target Build

- [x] 3.1 Replace ThiefCard Revelations section readout + "Edit Revelations" button with a five-cell `.equip-slot-grid` (glyphs ☀ ☽ ★ ☁ ◈, active on non-null `setId`, click opens modal anchored); section value `—` only when no card equipped
- [x] 3.2 Add `anchorSlot` prop to `RevelationEditorModal` (scroll into view on mount); migrate `.rev-slot-card`/`.rev-slot-header` usages to the shared classes; add `BuildComments` to the Preferences tab wired to `revelationPreferences.comments`
- [x] 3.3 Add Target Build read-only `ProgressSection` to ThiefCard edit body (sets, moon/star/sky chains, substat chain, comments; hidden when no preference set)
- [x] 3.4 Update `P5xPage.tsx` editing state to carry the anchor slot
- [x] 3.5 Update `ThiefCard.test.tsx` (grid cells, active states, anchored open, Target Build render/hide) and `RevelationEditorModal.test.tsx` (anchor, comments field)
- [x] 3.6 Gate: `npm test` + `npx tsc --noEmit` green

## 4. N2E — summary chip, ProgressSection, primitive riders

- [x] 4.1 Remove the `Cart {score}%` summary chip and the redundant `hasCartridgePrefs` gate (call `calculateCartridgeScore` directly; badge owns display)
- [x] 4.2 Convert cartridge slot section and Target Build readout to `ProgressSection` wrappers ("Cartridge", "Target Build"); trim replaced section-wrapper rules from `CharacterCard.css`
- [x] 4.3 Convert character + arc level sliders to `LevelSlider` and the arc picker to `Select`
- [x] 4.4 Update N2E `CharacterCard.test.tsx` for chip removal, ProgressSection wrappers, and primitives
- [x] 4.5 Gate: `npm test` + `npx tsc --noEmit` green

## 5. Docs and final gates

- [x] 5.1 Update `src/styles/components.md` for the shared slot-grid/slot-card patterns and the modal-pattern reclassification (HSR multi-slot)
- [x] 5.2 Update CLAUDE.md L2 shared-styles table entries if the new class groups warrant a mention
- [x] 5.3 Full gates: `npm run lint`, `npm run format:check`, `npm test`, `npm run build`, `npm run test:e2e`
