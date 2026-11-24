# Tasks

## 1. Preference-presence helper

- [x] 1.1 Export `hasFragmentPreferences(prefs: CznFragmentBuildPreferences): boolean` from `src/utils/fragmentScoring.ts`. It returns true when there is any target set, any substat, or any slot IV–VI main-stat chain.
- [x] 1.2 Make `calculateFragmentScore`'s `hasPreferences` delegate to it. Existing scoring tests stay green unchanged.
- [x] 1.3 Unit-test the helper in `fragmentScoring.test.ts`: empty prefs give false; each of the three sources alone gives true.

## 2. Filter declaration

- [x] 2.1 Add a module-level `FILTER_FACETS: RosterFilterEntry<CznTrackedCombatant>[]` to `CznPage.tsx` with a doc comment, in Level → Potential → Partner → Fragments order. Use the predicates, labels, modes, exclusivity, `onTitle`, and `noMatch` copy from the spec delta and design.
- [x] 2.2 Pass `filterChips: FILTER_FACETS` to `useRosterView`. Keep `filterRoster` referentially stable, with no chip state in it.

## 3. Page tests

- [x] 3.1 `CznPage.test.tsx`: rows render in order with the expected labels; no filter block when nothing is tracked.
- [x] 3.2 Test each chip's predicate against fixtures at its boundaries:
  - Level: 59, 60, 61, 62.
  - Potential: attained and not attained.
  - Partner: none; Lv 59 and Lv 60; listed, unlisted, and empty list.
  - Fragments: 5 and 6 slots; prefs and no prefs.
- [x] 3.3 Exclusivity: Level `one` swap; Partner `None equipped` clears its siblings and is cleared by them.
- [x] 3.4 With two active chips and no match, the generic `No combatants match the active filters.` shows.

## 4. Verify

- [x] 4.1 `npm test`, `npm run lint`, `npm run format:check`, `npx openspec validate --all`.
- [ ] 4.2 Check the CZN roster in the dev server: the filter block renders and collapses below 600px.
