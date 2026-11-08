## 0. Shared hook and layout — exclusive chips

- [x] 0.1 In `src/hooks/useRosterView.ts`, add `exclusive?: boolean` to `RosterFilterChip` (JSDoc: `any`-facet only, inert for bare chips and `one` members), make `toggleChip` clear every sibling for a `one` member or an exclusive `any` member and only the exclusive siblings otherwise, and expose `exclusive: boolean` on the descriptor chip (true only inside an `any` facet)
- [x] 0.2 Hook tests in `src/hooks/useRosterView.test.ts`: exclusive chip clears two active siblings in one update; a sibling clears the exclusive chip; two non-exclusive siblings still AND; descriptor `exclusive` is false for bare chips and `one` members even when flagged
- [x] 0.3 In `src/components/RosterPageLayout.tsx`, render a `.filter-facet-divider` (`role="separator"`, `aria-orientation="vertical"`) between consecutive chips whose `exclusive` differs; in `src/styles/controls.css` add the token-only divider rule (stretch, 1px, `--spacing-xs` block margin, `--color-ui-border`)
- [x] 0.4 Update `src/styles/ControlPatterns.stories.tsx`: replace the stale `💠 Resonating` bare row with a Psychube `any` row showing the divider, and keep one bare-chip row (ZZZ)
- [x] 0.5 `CONTEXT.md` Roster View entry: one sentence defining an exclusive chip

## 1. R1999 facets

- [x] 1.1 In `src/pages/reverse1999/Reverse1999Page.tsx`, replace `FILTER_CHIPS: RosterFilterChip<R1999TrackedArcanist>[]` with `FILTER_FACETS: RosterFilterEntry<R1999TrackedArcanist>[]` holding the three facets from design D1 — Resonance (`one`: `Not started`, `In progress`), Euphoria (`one`: `Not started`, `In progress`, both guarded by `hasEuphoria`), Psychube (`any`: `None equipped` with `exclusive: true`, `Under Lv 60`, `Under A5`) — with the D1 keys, `onTitle`, and `noMatch` copy; update the header comment and the `useRosterView` config

## 2. Page tests

- [x] 2.1 In `src/pages/reverse1999/Reverse1999Page.test.tsx`, move the existing resonance / gluttony chip tests to the new labels: select chips inside their `role="group"` row (`within(getByRole('group', { name: 'Resonance' }))`) because `Not started` / `In progress` repeat across facets; ghost-tag assertions become `no longer matches Resonance · In progress` and `no longer matches Psychube · Under A5`
- [x] 2.2 Add wiring tests: three group rows named Resonance / Euphoria / Psychube with their chips in order; joined pill (`.mode-one`) only on Resonance and Euphoria; predicate tests for all seven chips, including `hasEuphoria` false excluded from both Euphoria chips and no-psychube arcanists excluded from `Under Lv 60` / `Under A5`; `one` exclusivity through the UI for both pairs (swap, clear, `aria-pressed`); Psychube threshold pair both active ANDs; `None equipped` clears both threshold chips and either threshold chip clears it; the Psychube row renders the divider after `None equipped`; cross-facet AND; single-chip no-match copy per new chip; generic copy for two active chips
- [x] 2.3 Add collapsible wiring tests: `Filters` header renders with three rows; collapsing shows `Resonance · In progress` and `Psychube · Under A5` as removable pills; removing one clears only that chip

## 3. Verification

- [x] 3.1 Run `npm run lint && npm run format:check && npm test && npm run build`
- [x] 3.2 Run `npx openspec validate --all`
- [x] 3.3 Close verify findings: page test that chip state resets on remount; retire the `💠 Resonating` example from `CardPatterns.stories.tsx`, the `roster-projection-stability` held-card requirement, and the `roster-predicate-filter` collapsible scenario (example-only MODIFIED deltas); rewrap the facet JSDoc in `useRosterView.ts`
