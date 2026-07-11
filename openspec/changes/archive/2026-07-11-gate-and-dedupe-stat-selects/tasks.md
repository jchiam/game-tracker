## 1. SubStatList sibling dedupe

- [x] 1.1 In `SubStatList.tsx`, compute per-row exclusions as `excludeValues` ∪ other rows'
      current values; keep the row's own value visible. Update `rowOptions(current)` accordingly.
- [x] 1.2 Change `firstAllowed` to the first option that is neither in `excludeValues` nor already
      present in `values`; suppress the add button when no such option remains (alongside `atCap` /
      `disabled`).
- [x] 1.3 Add unit tests: sibling rows exclude each other's stats (own value kept); add appends the
      first unchosen option; add button hidden when options exhausted; dedupe by value with
      `{ value, label }` options; existing `excludeValues` + disabled + cap behavior still pass.

## 2. PreferenceChain stat-chain dedupe

- [x] 2.1 In `PreferenceChain.tsx` `StatChain`, exclude other rows' stats from each row's
      `<option>` list (own value kept); change `add()` to push the first option not already in
      `values`; disable the add button when every option is taken.
- [x] 2.2 Add unit tests: stat-chain rows exclude sibling stats; append picks first unchosen;
      add button disables when exhausted; operator-fixup on append/remove unchanged; ranked-list
      mode unaffected.

## 3. N2E cartridge editor parity

- [x] 3.1 In `CartridgeEditorModal.tsx`, pass `excludeValues={currentMainStat ? [currentMainStat] : []}`
      to the equip-tab `SubStatList`.
- [x] 3.2 In the `cartridgeMainStat` onChange handler, prune any substat equal to the new main:
      save `cartridgeSubStats` filtered by the chosen main alongside `cartridgeMainStat`.
- [x] 3.3 Gate the equip-tab `SubStatList` behind the main: `disabled={!hasCartridge || !currentMainStat}`
      and extend the `is-gated` wrapper to the same condition.

## 4. HSR + P5X main-gate on variable slots

- [x] 4.1 In `RelicEditorModal.tsx` `EquipTab`, for non-fixed slots gate the `SubStatList` and its
      `is-gated` wrapper on `!hasSet || !currentRelic.mainStat`; fixed head/hands stay set-gated only.
- [x] 4.2 In `RevelationEditorModal.tsx` `EquipTab`, gate the `SubStatList` and wrapper on
      `!hasSet || (!isFixed && !mainStat)`; keep fixed Sun/Space set-gated only (verify Space, whose
      derived dual main leaves `card.mainStat` empty, is NOT locked out).

## 5. Editor tests

- [x] 5.1 N2E editor test: substats gated until a main is chosen; equipped main absent from substat
      options; choosing a main equal to an existing substat prunes it.
- [x] 5.2 HSR + P5X editor tests: variable-main slot substats gated until main chosen; P5X Space
      substats enabled on set selection without a stored main (regression guard).

## 6. Verify

- [x] 6.1 `npm test` (1153 pass), `npm run lint`, `npm run build` all clean; `format:check` clean
      for every file this change touches. Repo-wide `format:check` still flags 2 PRE-EXISTING,
      out-of-scope `.md` files (`openspec/specs/p5x-thief-detail/spec.md`,
      `openspec/changes/archive/2026-07-11-p5x-revelation-summary-count/design.md`) left by another
      session — not formatted here to avoid unrelated churn; they will block a push until fixed
      separately.
- [x] 6.2 Storybook: no `.storybook` config or `*.stories.*` files exist in the repo, so the
      design-system story mandate has no target — record N/A, add nothing.
