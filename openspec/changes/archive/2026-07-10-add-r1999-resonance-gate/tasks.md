## 1. Hook: predicate seam

- [x] 1.1 Verify `filterRoster` from `useRoster` accepts an optional predicate the same way P5X's `useThieves` uses it (read `src/hooks/useRoster.ts` + `src/hooks/persona-5-phantom-x/useThieves.ts`)
- [x] 1.2 Widen `getFilteredRoster` in `src/hooks/reverse1999/useArcanists.ts` to accept an optional `filterFn?: (a: R1999TrackedArcanist) => boolean`, passed through to `filterRoster` before search/sort
- [x] 1.3 Add hook tests in `useArcanists.test.ts`: predicate excludes 0, excludes 15, includes 1–14, and no-predicate passes all (mirror P5X `useThieves.test.ts` gate cases)

## 2. Page: gate state + chip

- [x] 2.1 Add page-local `resonanceGateFilter` `useState` + `useCallback`-wrapped `getFilteredRoster` in `src/pages/reverse1999/Reverse1999Page.tsx`, injecting `(a) => a.resonanceLevel > 0 && a.resonanceLevel < 15` when active
- [x] 2.2 Render a `filterRow` with a togglable `.filter-chip` (R1999-flavoured emoji + "Gated"/"In progress" label) wired to the state
- [x] 2.3 Pass gate-aware `noMatchMessage` (gate-specific empty text when the chip is active)
- [x] 2.4 Styles NOT shared (P5X-local); created page-local `Reverse1999Page.css` with dedicated `--color-r1999-accent` token. Follow-up: promote base `.filter-row`/`.filter-chip` to `controls.css` with per-game accent var.

## 3. Page tests

- [x] 3.1 Add tests in `Reverse1999Page.test.tsx`: chip toggles gate on/off, gate narrows to in-progress arcanists, gate composes with search (intersection), gate-specific empty message shows
- [x] 3.2 Confirm chip is off by default (navigation resets — page-local state)

## 4. Validate

- [x] 4.1 `npm run lint && npm run format:check`
- [x] 4.2 `npm test` (945 pass; hook + page suites green) + `npm run build` (tsc clean)
- [x] 4.3 `npx openspec validate --all` (38/38)
