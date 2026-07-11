## 1. ThiefCard chip → count

- [x] 1.1 In `ThiefCard.tsx`, compute `revCardCount = REVELATION_SLOTS.filter((s) => thief.revelations[s]?.setId).length` (reuse alongside the existing `hasAnyRevCard` predicate).
- [x] 1.2 Replace the `hasRevSets`-gated `.p5x-revelation-chip` `StatChip` with a `hasAnyRevCard`-gated chip labelled `Rev {revCardCount}/5`, keeping `style={{ color: revPs.color, borderColor: revPs.borderColor }}` and dropping the `className="p5x-revelation-chip"`.
- [x] 1.3 Confirm chip ordering is unchanged: Level → Awareness → Weapon → Mindscape → Revelations → Skills.

## 2. Set names → summaryLine

- [x] 2.1 In `ThiefCard.tsx`, change `summaryLine` to render, in order: the set summary (`revSummaryLabel`) as `<span className="rev-set-summary" style={{ color: revPs.color }}>` **only when `hasRevSets`**, then a `<span className="summary-divider">` divider (only when `hasRevSets`), then the existing `<span className="persona-line">{thief.personaName}</span>`.
- [x] 2.2 Verify no-bonus path: when `hasRevSets` is false, only the Persona name renders (no divider, no set text).

## 3. CSS

- [x] 3.1 In `ThiefCard.css`, delete the `.p5x-revelation-chip` base rule (max-width / white-space / overflow / text-overflow) and its `@media (max-width: 768px)` override.
- [x] 3.2 Add `.rev-set-summary` (non-italic; color supplied inline) and `.summary-divider` (dimmed via existing opacity/token, using the `|` glyph) rules; keep `.persona-line` unchanged.

## 4. Tests

- [x] 4.1 Update `ThiefCard.test.tsx`: replace assertions on the old set-name chip label with (a) a `Rev {n}/5` chip assertion and (b) a summaryLine set-text assertion (score-colored, distinct from the Persona line).
- [x] 4.2 Add/adjust a case: a Thief with cards but no active bonus shows the `Rev {n}/5` chip and a Persona-only summaryLine (no divider).
- [x] 4.3 Add/adjust a case: a Thief with no cards shows no revelation chip.

## 5. Verify

- [x] 5.1 Run `npm test` (P5X ThiefCard suite green — 43 passed; also `tsc --noEmit` clean).
- [x] 5.2 Run `npm run lint && npm run format:check` (ESLint + Prettier clean on touched files).
- [x] 5.3 Run `npx openspec validate --all` (42 passed, 0 failed).
- [x] 5.4 Visually confirm in dev: predictable chip width across Thieves; set text + Persona distinct on one line; no ellipsis truncation; uniform collapsed-card height across the grid.
