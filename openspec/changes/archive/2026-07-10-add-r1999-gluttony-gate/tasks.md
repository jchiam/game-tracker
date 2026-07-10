## 1. Page: gluttony gate state + predicate composition

- [x] 1.1 Add page-local `gluttonyGateFilter` `useState(false)` in `src/pages/reverse1999/Reverse1999Page.tsx`
- [x] 1.2 Refactor `filteredGetRoster` to compose all active gate predicates into one intersection predicate: collect the resonance predicate (`a.resonanceLevel > 0 && a.resonanceLevel < 15`) and the gluttony predicate (`a.psychubeName !== null && a.psychubeAmplification < 5`) for whichever gates are active, then pass `(a) => predicates.every((p) => p(a))` — or `undefined` when none active — to `getFilteredRoster`
- [x] 1.3 Confirm no hook change is needed — `getFilteredRoster` already accepts an optional predicate (seam added by the resonance gate)

## 2. Page: gluttony gate chip + empty message

- [x] 2.1 Render a second `.filter-chip` in the existing `filterRow`, wired to `gluttonyGateFilter` (gluttony-flavoured emoji + gerund label, e.g. `🍽️ Amplifying`) with a togglable title
- [x] 2.2 Update `noMatchMessage` to a per-gate multi-state form, **preserving** the resonance-only text: resonance-only → "No arcanists with resonance in progress." (unchanged); gluttony-only → a gluttony-specific message; both gates → generic "No arcanists match the active filters."; neither → default no-match message. Do NOT collapse the resonance-only case to the generic string (the resonance gate's spec + `Reverse1999Page.test.tsx` line ~440 pin its exact text)
- [x] 2.3 Confirm both chips inherit the single `--filter-chip-accent` already set on `.filter-row` (no per-chip accent)

## 3. Page tests

- [x] 3.1 In `Reverse1999Page.test.tsx`: gluttony chip toggles the gate on/off
- [x] 3.2 Gate narrows to arcanists with a psychube equipped and amplification < 5; excludes A5-maxed and no-psychube arcanists
- [x] 3.3 Gluttony gate composes with the resonance gate — both active yields the intersection (satisfies both predicates)
- [x] 3.4 Gluttony gate composes with search (intersection)
- [x] 3.5 Gate-specific empty message shows when a gate is active and nothing matches
- [x] 3.6 Both chips are off by default (page-local state resets on navigation)

## 4. Validate

- [x] 4.1 `npm run lint && npm run format:check`
- [x] 4.2 `npm test` (page suite green) + `npm run build` (tsc clean)
- [x] 4.3 `npx openspec validate --all`
