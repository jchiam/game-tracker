## 1. Shared hook — chip descriptors

- [x] 1.1 Add `RosterFilterChip<T>` and the `filterChips` / `filterAccent` / `nounPlural` config fields to `useRosterView`; change `filterRoster` to receive the composed predicate as its third argument. Verify `npm run build` typechecks with the three chip pages temporarily adapted.
- [x] 1.2 Implement chip state (`Set` of active keys), toggle, AND-composed predicate (`undefined` when none active), and include the active-key string in the projection key. Verify hook tests: toggling a chip refreshes all bases and narrows the roster; no predicate is passed when no chip is active.
- [x] 1.3 Derive `describeHeld` from the declared chips (first failing active chip, `no longer matches {label}`), gated on any chip active; remove the `describeHeld` config seam. Verify hook tests: held reason names the first failing chip in declaration order; no held detection with all chips off.
- [x] 1.4 Derive `noMatchMessage` (0 → config default, 1 → chip copy or generic, ≥2 → generic `No {nounPlural} match the active filters.`) and the `filters` descriptor (accent, chips with `active`/`title`/`toggle`; `offTitle` defaults to `Show all {nounPlural}`). Verify hook tests cover all three message branches and the tooltip default; `filters` is `undefined` when no chips are declared.

## 2. Layout — render the row

- [x] 2.1 Replace `RosterPageLayout`'s `filterRow` prop with `filters`; render `.filter-row` with `--filter-chip-accent` and one `.filter-chip` button per chip behind `hasTracked`. Verify layout tests/story: row renders chips in order with active class and titles, and is absent when `filters` is undefined or nothing is tracked.
- [x] 2.2 Add `flex-wrap: wrap` to `.filter-row` in `src/styles/controls.css`. Verify the `ControlPatterns` story still renders and a four-chip row wraps at a narrow viewport in Storybook.
- [x] 2.3 Update `RosterPageLayout.stories.tsx` with a `filters` control showing a multi-chip row. Verify `npm run build:storybook` succeeds.

## 3. Migrate existing chip pages

- [x] 3.1 Rewrite `ZzzPage.tsx` to declare its `🐹 Gated` chip as data (`noMatch: 'No Pass-gated agents found.'`), pass `nounPlural: 'agents'`, and keep the score function in its one-line `filterRoster` adapter. Verify `ZzzPage.test.tsx` passes unchanged except tests that covered now-shared mechanics.
- [x] 3.2 Rewrite `Reverse1999Page.tsx` to declare its `💠 Resonating` and `🍽️ Amplifying` chips as data with their existing single-chip copy, `nounPlural: 'arcanists'`. Verify `Reverse1999Page.test.tsx` passes; the both-active message is still `No arcanists match the active filters.`
- [x] 3.3 Grep `src/pages` for chip `useState`, `describeHeld`, `.filter-chip` markup, and no-match ternaries. Verify none remain outside the hook and layout.

## 4. P5X chips

- [x] 4.1 Add `countEquippedRevelations` to `src/data/persona-5-phantom-x/revelations.ts` (truthy-`setId` count over `REVELATION_SLOTS`) and use it in `ThiefCard.tsx` for `Rev n/5`. Verify `revelations.test.ts` covers 0, partial, null-set, and 5; `ThiefCard.test.tsx` passes.
- [x] 4.2 Rewrite `P5xPage.tsx` with the four-chip array (🌹 Gated · ⚔ <5★ · MS ✗ · ◈ Rev <5) per design D8, `nounPlural: 'thieves'`, accent `var(--color-p5x-element-fire)`. Verify existing rose/weapon tests in `P5xPage.test.tsx` pass.
- [x] 4.3 Add `P5xPage.test.tsx` cases: `MS ✗` keeps `mindscapeProgress === 0` and drops 1/2; `◈ Rev <5` keeps 0–4 equipped and drops 5, and treats a null-`setId` slot as empty; each chip's single-active empty copy; all four active compose as AND with the generic copy; held ghost tags `no longer matches MS ✗` (edit commit) and `no longer matches ◈ Rev <5` (editor close). Verify `npm test` passes.

## 5. Specs, docs, verification

- [x] 5.1 Update `CONTEXT.md` Roster View entry: filter chips are hook config; the layout renders the row. Verify the entry names `filterChips` and no longer mentions a page-supplied `describeHeld`.
- [x] 5.2 Run `npx openspec validate --all`, `npm run lint`, `npm run format:check`, `npm test`, `npm run build`. Verify all pass.
- [x] 5.3 Run `npm run dev` and check the P5X roster manually: four chips render, wrap on a narrow window, each narrows the grid, ghost tags appear on held cards, empty copy matches the spec. Verify with a screenshot or note in the PR. (Verified via the Storybook `FilterChips` story at 900px and 360px — the roster view needs Google OAuth, so the signed-in page was covered by the page tests instead.)
