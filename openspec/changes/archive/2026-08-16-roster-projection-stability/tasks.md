## 1. Data-layer prerequisite

- [x] 1.1 Add optional `entities` override to `useRoster.filterRoster` (run over `entities ?? trackedRef.current`), drop `trackedEntities` from its deps so it is identity-stable across edits (design D2)
- [x] 1.2 Update `useRoster` tests: filterRoster referential stability across edits + entities-override projection

## 2. Basis-aware projection in useRosterView

- [x] 2.1 Extend `RosterViewConfig` with required `trackedEntities` (live array — design D9) + optional `describeHeld`; pass the tracked array from all six pages so the repo compiles (held/commit wiring stays per-game)
- [x] 2.2 Implement basis map: auto-enroll new ids as live, refresh-all on `[filterRoster identity, searchTerm, sortBy]` change (design D3/D4), drop removed ids
- [x] 2.3 Compute `filteredRoster` as basis-membership ids joined to live objects; expose `refreshBasis(id)` and `isHeld(id)` / held map (design D4/D5); skip the live held-detection pass when no `describeHeld` is configured
- [x] 2.4 Implement transient `exiting` set on evicting releases with `animationend` + timeout fallback removal (design D7)
- [x] 2.5 `useRosterView` tests: edit does not re-project (membership/order stable, live content yielded), refreshBasis re-projects one entity, refresh-all on term/sort/filter-identity change, add appears immediately, remove drops immediately, held diff, newly-qualifying deferred

## 3. Commit signal + shared styles

- [x] 3.1 Add optional `onEditCommit` to `GameCardShell`, fired on ✓ collapse (design D6); shell test (also added `heldReason`/`isExiting`/`onExitEnd` props — shell owns the card frame, keeps DOM flat)
- [x] 3.2 Add held-card styles to `card.css` (dim + ghost tag, `pointer-events: none` on `.is-exiting`) and exit keyframes to `animations.css` under the global reduced-motion kill switch; no new tokens needed (existing duration/spacing/z-index tokens cover it)
- [x] 3.3 Update Storybook: CardPatterns story for held/exiting card states; DesignTokens story if new tokens added

## 4. R1999 wiring (reference game)

- [x] 4.1 Pass `trackedArcanists` + `describeHeld` (chip labels: 💠 Resonating / 🍽️ Amplifying) into `useRosterView`; wire `onEditCommit` → `refreshBasis(id)` on `ArcanistCard`'s shell
- [x] 4.2 Wrap favorite toggle with `refreshBasis(id)` (instant, completed intent); render held dim + ghost tag on held cards
- [x] 4.3 R1999 page tests: resonance-max under 💠 filter holds card until ✓ commit, chip toggle evicts immediately, LEVEL sort stable mid-edit

## 5. P5X wiring

- [x] 5.1 Same wiring as R1999 for `P5xPage` (rose gate + weapon filter labels, favorite wrap, commit signal, held rendering)
- [x] 5.2 P5X page tests mirroring 4.3 for its filters

## 6. Order-stability wiring for remaining games

- [x] 6.1 HSR: pass tracked array, wire `onEditCommit`; relic-editor + light-cone modal close → `refreshBasis(id)`
- [x] 6.2 N2E: same, cartridge-editor modal close (card-local) → `onEditCommit`
- [x] 6.3 ZZZ: same, disc-editor modal close → `refreshBasis(id)`
- [x] 6.4 AE: same (weapon editing is inline in the card edit body — ✓ commit covers it)
- [x] 6.5 Per-game page test: LEVEL/SCORE sort does not reorder mid-edit, reorders on commit

## 7. Docs + verification

- [x] 7.1 Add CONTEXT.md glossary entries: Projection Stability, Basis Snapshot, Held Card, Release Point; note the pattern in CLAUDE.md design-system/roster sections if wording there now contradicts it
- [x] 7.2 Run `npm test`, `npm run lint`, `npm run format:check`, `npm run build`; `npx openspec validate --all`
