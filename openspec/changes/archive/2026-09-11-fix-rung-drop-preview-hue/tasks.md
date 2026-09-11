## 1. Component — SegmentedButtons (already implemented)

- [x] 1.1 Pass the attained inline gradient (`getProgressStyle`) to dropped-preview rungs so every non-empty rung carries its own ramp hue (`src/components/SegmentedButtons.tsx`)
- [x] 1.2 Clear hover and focus preview indices on click in cumulative mode so the committed result renders immediately

## 2. Styles — controls.css (already implemented)

- [x] 2.1 Reduce `.toggle-btn.is-rung.rung-drop` to the structural treatment only (`border-style: dashed; opacity: 0.55`), removing the neutral background/border/colour overrides
- [x] 2.2 Update the cumulative-rung comment block to state that every non-empty state keeps its inline hue

## 3. Tests & Storybook (already implemented)

- [x] 3.1 Add test: dropped-preview rungs keep their inline gradient style (`src/components/SegmentedButtons.test.tsx`)
- [x] 3.2 Add test: click clears the preview so the new selection renders committed at once
- [x] 3.3 Update the `Cumulative` story doc for the new drop treatment (`src/components/SegmentedButtons.stories.tsx`)

## 4. Verification

- [x] 4.1 `npm test` — full unit suite green
- [x] 4.2 `npm run lint && npm run format:check` — clean
- [x] 4.3 `npx openspec validate --all` — change and delta specs validate
