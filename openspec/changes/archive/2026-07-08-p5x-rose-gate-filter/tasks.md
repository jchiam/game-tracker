## Tasks

- [x] 1. Extend `getFilteredRoster` in `useThieves.ts` to accept optional filter predicate and apply `.filter()` before delegating to `filterRoster`
- [x] 2. Add `roseGateFilter` boolean state to `P5xPage.tsx`, pass predicate `(t) => t.skillsLeveled && !t.roseMaxed` when active
- [x] 3. Move filter chip from inline toolbar slot to a dedicated `.filter-row` rendered between toolbar and card grid via a `filterRow` ReactNode prop on `RosterPageLayout`
- [x] 4. Update contextual empty state message when filter active + no matches
- [x] 5. Add tests: hook filter predicate (useThieves.test.ts), page chip toggle + filtered rendering (P5xPage.test.tsx)
- [x] 6. Verify: lint, format, typecheck, full test suite pass
