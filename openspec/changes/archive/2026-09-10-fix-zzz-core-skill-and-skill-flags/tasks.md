## 1. Shared gradient + control styles

- [x] 1.1 Add the reduced-strength preview variant to `src/utils/progressGradient.ts`, derived from the same interpolated hue as `getProgressStyle`; verify a unit test asserts identical `r,g,b` and strictly lower border/active-bg opacities for the same value, plus matching clamp and `min === max` behaviour
- [x] 1.2 Enumerate every `.toggle-btn` render site in the codebase and record which ones sit outside a `.segmented-buttons` container; verify the list is captured in the PR description so the hover-scoping change in 1.3 can be checked against it
- [x] 1.3 Scope the base `.toggle-btn:hover` rule in `src/styles/controls.css` so it does not apply to cumulative rows, without adding any property-reset override; verify every call site from 1.2 still takes the base hover
- [x] 1.4 Add the canonical attained / added-preview / dropped-preview rung treatments to `src/styles/controls.css` using design tokens and the gradient utility only, with each `transition` enumerating exactly the properties its variants change; verify no hardcoded colour literals and no `transition: all` are introduced

## 2. SegmentedButtons cumulative mode

- [x] 2.1 Add the `fill?: 'exact' | 'cumulative'` prop (default `'exact'`) and cumulative attained-run rendering to `src/components/SegmentedButtons.tsx`, colouring each attained rung by its own gradient position; verify tests cover exact mode leaving earlier rungs uncoloured and cumulative mode filling rungs 1..selected
- [x] 2.2 Add `aria-pressed` to every pill reflecting whether it renders as attained; verify a test asserts the whole attained run is pressed in cumulative mode and exactly one is pressed in exact mode
- [x] 2.3 Add internal `hoverIdx`/`focusIdx` state and the derived per-button rung state, with row-level mouse-leave and blur resets; verify tests cover upgrade preview, downgrade preview, hovering the selected rung under `allowDeselect`, leaving the row, and focus producing the same preview as hover
- [x] 2.4 Confirm the eight existing `SegmentedButtons` call sites are unchanged in behaviour and appearance; verify the full unit suite passes with no snapshot or assertion updates in HSR, R1999, N2E, AE, or P5X tests
- [x] 2.5 Add a cumulative story to `SegmentedButtons.stories.tsx` showing all four rung states side by side plus a Controls-driven `fill` toggle; verify `npm run build:storybook` succeeds

## 3. ToggleChips primitive

- [x] 3.1 Create `src/components/ToggleChips.tsx` with `options` / `values` / `onToggle` plus `name`, `disabled`, `size`, `className`, emitting `aria-pressed` per button and a `modifier` class hook; verify tests cover independent toggling, turning an on option off, and the empty and all-on states
- [x] 3.2 Add `ToggleChips.stories.tsx` covering empty, partial, and full states with interactive Controls and an `fn()` action; verify the story renders in `npm run storybook`

## 4. Core Skill correction

- [x] 4.1 Reverse `CORE_SKILL_LETTERS` in `src/pages/zenless-zone-zero/components/agentBadges.ts` to `['—','A','B','C','D','E','F']`; verify a unit test asserts 1 → `A`, 6 → `F`, and 0 and out-of-range → `—`
- [x] 4.2 Update the Core Skill section in `AgentCard.tsx` to pass `fill="cumulative"` and correct the F→A comment on `CORE_SKILL_OPTIONS`; verify a test asserts clicking the `A` pill emits 1 and clicking `F` emits 6
- [x] 4.3 Update the existing `AgentCard.test.tsx` core-skill assertions to the corrected letters and add a test that an agent at Core Skill 3 renders rungs A–C attained and D–F unattained; verify `npm test` passes
- [x] 4.4 Update the `coreSkill` comment in `src/types.ts` and the ZZZ row in `CONTEXT.md` to say A→F and describe rung 0 as unenhanced rather than locked; verify no remaining `F→A` or "locked" wording for Core Skill anywhere outside `openspec/changes/archive/`

## 5. Combat skill maxed flags — persistence

- [x] 5.1 Add `supabase/migrations/20260830000000_add_zzz_skill_maxed.sql` with five `BOOLEAN NOT NULL DEFAULT false` columns on `zzz_tracked_agents`; verify the file follows the existing migration naming and adds no RLS gaps
- [x] 5.2 Add the five `skill*Maxed` keys to `ZzzTrackedAgent` and `ZzzAgentPatch` in `src/types.ts`; verify `npm run build` type-checks clean
- [x] 5.3 Extend `agentService.ts` with the five column-map entries, select-list columns, insert defaults, and load mapping; verify the service test covers the new config wiring (load mapping and insert defaults) per the per-game service test convention
- [x] 5.4 Add five `makeFieldUpdater` declarations to `useAgents.ts` and expose them from the hook; verify a hook test asserts toggling one flag leaves the other four unchanged and queues a save

## 6. Combat skill maxed flags — card UI

- [x] 6.1 Add the skills row to `AgentCard.tsx` using `ToggleChips` inside a `ProgressSection` labeled with the maxed count, placed after Core Skill and before the W-Engine group, in the order Basic Attack, Dodge, Assist, Special Attack, Chain Attack; verify a test asserts the row position and option order
- [x] 6.2 Wire the single `onToggleSkillMaxed(id, key)` prop through `ZzzPage.tsx` to the five hook updaters via a lookup map; verify a page test asserts the correct updater fires for each key
- [x] 6.3 Add the maxed-count `StatChip` to the collapsed summary chip row; verify a test asserts the chip reads `3 / 5` for three flags and that the number of summary lines is unchanged
- [x] 6.4 Add any needed row override to `AgentCard.css` using tokens only, or confirm none is needed; verify no rule re-declares anything already in `card.css` or `controls.css`

## 7. Verification

- [x] 7.1 Run `npm run lint && npm run format:check && npm test && npm run build`; verify all four pass clean
- [x] 7.2 Run `npm run test:e2e`; verify the ZZZ roster e2e flows still pass
- [x] 7.3 Run `./node_modules/.bin/openspec validate --all`; verify the change and all specs validate
- [x] 7.4 Update the `## Purpose` line of `openspec/specs/zzz-agent-detail/spec.md` to say A→F and mention the combat-skill flags — delta specs do not carry Purpose, so this is edited directly; verify no `F→A` wording survives outside `openspec/changes/archive/`
- [ ] 7.5 Manually exercise a ZZZ agent card in `npm run dev`: confirm the Core Skill row reads A→F, fills cumulatively, previews the added range on hover above the selection, previews the dropped range on hover below it and on the selected rung, restores on mouse-leave, mirrors on keyboard focus, and that the five skill chips toggle independently
