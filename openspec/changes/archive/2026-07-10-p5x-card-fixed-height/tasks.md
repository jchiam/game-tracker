## 1. StatChip className passthrough

- [x] 1.1 Add optional `className` prop to `StatChip` (`src/components/StatChip.tsx`); merge it after the base `stat-chip` class, leaving `label`/`style` unchanged.
- [x] 1.2 Update/extend `StatChip` tests (or `CardPatterns`/control stories) to cover the passthrough.

## 2. Revelations chip width cap

- [x] 2.1 In `ThiefCard.tsx`, pass `className="p5x-revelation-chip"` to the Revelations `StatChip` only.
- [x] 2.2 In `ThiefCard.css`, add `.p5x-revelation-chip` with a token-based `max-width` + `white-space: nowrap; overflow: hidden; text-overflow: ellipsis`.
- [x] 2.3 Verify the full Heavens + Space set names still render untruncated in `RevelationEditorModal`.

## 3. Summary chip reorder (Mindscape before Revelations)

- [x] 3.1 In `ThiefCard.tsx` `summaryStats`, move the `MS ✓` chip block above the Revelations chip block. Confirm edit-body section order is untouched (Level → Weapon → Revelations → Mindscape → Skills).
- [x] 3.2 Update `ThiefCard.test.tsx` to assert summary chip order: Level → Awareness → Weapon → Mindscape → Revelations → Skills.

## 4. GameCardShell fixed-height reserve opt-in

- [x] 4.1 Add an optional opt-in prop to `GameCardShell` (e.g. `reserveSummaryRows`/`fixedSummaryHeight`) that toggles a modifier class on the card root.
- [x] 4.2 In `src/styles/card.css`, add the reserve rule keyed off that modifier class: `min-height` on `.game-card-static-stats` sized to two chip rows via `calc()` from chip box tokens (no magic px). Comment the two-line assumption.
- [x] 4.3 In `ThiefCard.tsx`, opt into the reserve when composing `GameCardShell`.
- [x] 4.4 Add `GameCardShell` tests: modifier class present with the prop, absent without it (no regression for other games).

## 5. Storybook + verification

- [x] 5.1 Document the reserve modifier in `CardPatterns.stories.tsx` (per the design-system rule that shared-style changes update Storybook).
- [x] 5.2 Run `npm test`, `npm run lint`, `npm run format:check`, `npm run build`.
- [x] 5.3 Visually verify on the P5X route: one-line and two-line Thief cards share the same collapsed body height; long revelation labels ellipsize; no third chip line.
- [x] 5.4 Run `npx openspec validate --all`.
