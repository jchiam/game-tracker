## 1. Component structure — collapse skeleton

- [x] 1.1 In `CharacterCard.tsx`, add `const [isEditing, setIsEditing] = useState(false)` and apply `is-editing` to `.game-card-body` (`className={\`game-card-body ${isEditing ? 'is-editing' : ''}\`}`).
- [x] 1.2 Add an `.edit-toggle-btn` to `.game-card-controls-bottom`, wrapping it and the existing `.score-badge` in a right-aligned container (mirror N2E's `.character-overlay-right`). Toggle `isEditing` on click; show `✓` when editing else `✎`.

## 2. Collapsed summary (gradient chips)

- [x] 2.1 Import `getProgressStyle` from `@/utils/progressGradient` and `StatChip` from `@/components/StatChip`.
- [x] 2.2 Compute `relicCount = number of slots where char.relics[slot]?.setId is non-null` (head/hands/body/feet/sphere/rope).
- [x] 2.3 Add `.game-card-static-summary` > `.game-card-static-stats` with three chips: `Lv {level}` (`getProgressStyle(level,1,80)`), `Traces ✓|✗` (`getProgressStyle(tracesAttained?1:0,0,1)`), `Relics {relicCount}/6` (`getProgressStyle(relicCount,0,6)`). Pass `{ color, borderColor }` to each `StatChip`.

## 3. Edit body — move controls

- [x] 3.1 Wrap the existing Level, Traces, Relic Sets, and Target Build `ProgressSection`s in `.game-card-edit-body` > `.game-card-edit-body-inner` (with `aria-hidden={!isEditing}` on the edit body). Keep the relic grid and `.build-prefs-display` markup unchanged.
- [x] 3.2 Convert the level slider fill to the shared gradient: use `getProgressStyle(char.level,1,80)` for the fill color and `--slider-fill-color` / `--slider-fill-glow` (match the r1999/N2E slider style object).

## 4. CSS — height budgets + overlay-right

- [x] 4.1 In `CharacterCard.css`, add the HSR-local `.hsr-overlay-right` rule. Do not re-declare the canonical collapse rules. (Height budgets now set inline on the card root — see task group 7, which corrects a cross-game leak.)

## 7. Fix per-game budget scoping (cross-game leak — corrects Change B)

- [x] 7.1 HSR `CharacterCard.tsx`: set `--game-card-summary-max-height: 100px` / `--game-card-edit-max-height: 900px` as inline custom properties on the `.game-card` root; removed the `.game-card { --vars }` rule from `CharacterCard.css`.
- [x] 7.2 r1999 `ArcanistCard.tsx`: set `80px` / `700px` inline on the card root; removed the `.game-card { --vars }` rule from `ArcanistCard.css`.
- [x] 7.3 N2E `CharacterCard.tsx`: set `400px` / `1200px` inline on the card root; removed the `.game-card { --vars }` rule from `CharacterCard.css`.
- [x] 7.4 AE: confirmed no inline override needed — uses `card.css` defaults (200/1200); no change.
- [x] 7.5 Build + grep `dist/assets/*Page-*.css` — **no** `.game-card{--game-card-…-max-height}` global rule remains in any chunk (collision eliminated); inline custom-prop names present in all three game JS chunks. Definitive: with no shared setter rule, no card can inherit another game's budget. (Cross-game nav repro requires auth'd cards; the build-level absence of the setter is the structural proof.) `npm test` 348 passed, `test:e2e` 57 passed.

## 5. Tests

- [x] 5.1 Update `CharacterCard.test.tsx`: assert the collapsed summary renders the three chips (`Lv`, `Traces`, `Relics n/6`) with a representative `relicCount`; assert the relic grid / Target Build are present in the edit body; assert the score badge still renders in the overlay when `hasPreferences`. Keep the existing imagekit mock. Note: level/traces now appear twice (summary chip + edit body) — scope queries with `within(...)` or use the exact chip strings (`Lv 80`, `Traces ✓`) so no `getByText` throws on ambiguous matches.

## 6. Verify

- [x] 6.1 Run `npm test` — HSR card + page suites green. — 143 passed across 7 files. (One existing test, `onUpdateLevel`, was updated: the slider is now in the `aria-hidden` edit body when collapsed, so `getByRole('slider')` correctly skips it — the test now opens the ✎ toggle first, reflecting real behavior.)
- [x] 6.2 Run `npm run lint && npm run format:check && npm run build` — clean.
- [x] 6.3 Run `npm run test:e2e` — **57 passed**. HSR e2e is navigation-only, unchanged as predicted.
- [x] 6.4 Visual check — drove a temporary HSR card story (mock data) via Playwright, screenshotted both states, then deleted the harness (CLAUDE.md: no committed L4 stories). **Collapsed:** summary 38px, chips `['Lv 80','Traces ✓','Relics 4/6']`, overlay-right = score badge + ✎ toggle (no overlap). **Expanded:** edit body content 554px (well under the 900px budget — no clipping), level slider gradient-filled, relic grid 4/2, full Target Build visible, score badge stays in overlay. Gradient colors correct (Lv/Traces teal at max, Relics 4/6 gold).
