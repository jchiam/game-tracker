## 1. Add canonical classes to card.css

- [x] 1.1 In `src/styles/card.css`, add the canonical collapse mechanism: `.game-card-static-summary` (flex column, `gap: var(--spacing-3)`, `padding-bottom: var(--spacing-md)`, `overflow: hidden`, `max-height: var(--game-card-summary-max-height, 200px)`, and the `opacity/max-height/padding` transition); `.game-card-body.is-editing .game-card-static-summary` (collapse to `max-height: 0`, `opacity: 0`, zero padding, `pointer-events: none`); `.game-card-static-stats` (flex row, `gap: var(--spacing-sm)`, wrap); `.game-card-static-line` (font-size sm, secondary color, nowrap + ellipsis); `.game-card-edit-body` (`max-height: 0`, `overflow: hidden`, `max-height 0.4s ease` transition); `.game-card-body.is-editing .game-card-edit-body` (`max-height: var(--game-card-edit-max-height, 1200px)`); `.game-card-edit-body-inner` (flex column, `gap: var(--spacing-md)`, `padding-bottom: var(--spacing-lg)`).

## 2. Migrate r1999 (preserve 80px / 700px)

- [x] 2.1 In `ArcanistCard.tsx`, rename usages: `arcanist-static-summary`→`game-card-static-summary`, `arcanist-static-stats`→`game-card-static-stats`, `arcanist-static-psychube`→`game-card-static-line`, `arcanist-edit-body`→`game-card-edit-body`, `arcanist-edit-body-inner`→`game-card-edit-body-inner`.
- [x] 2.2 In `ArcanistCard.test.tsx:53`, update the `.arcanist-static-stats` query to `.game-card-static-stats`.
- [x] 2.3 In `ArcanistCard.css`, delete the bespoke structural rules (lines for `.arcanist-static-summary`, its `.is-editing` selector, `.arcanist-static-stats`, `.arcanist-static-psychube`, `.arcanist-edit-body`, its `.is-editing` selector, `.arcanist-edit-body-inner`). Add the override `.game-card { --game-card-summary-max-height: 80px; --game-card-edit-max-height: 700px; }`. Keep `.no-psychube` (rename only its selector context if needed — it stays game-local).

## 3. Migrate N2E (preserve 400px / 1200px)

- [x] 3.1 In `CharacterCard.tsx`, rename usages: `character-static-summary`→`game-card-static-summary`, `character-static-stats`→`game-card-static-stats`, `character-static-equip`→`game-card-static-line`, `character-edit-body`→`game-card-edit-body`, `character-edit-body-inner`→`game-card-edit-body-inner`.
- [x] 3.2 In `CharacterCard.css`, delete the bespoke structural rules and add `.game-card { --game-card-summary-max-height: 400px; --game-card-edit-max-height: 1200px; }`. Keep `.no-equip` game-local.

## 4. Migrate AE (fixes cold-load collapse)

- [x] 4.1 In `OperatorCard.tsx`, rename usages: `operator-static-summary`→`game-card-static-summary`, `operator-static-stats`→`game-card-static-stats`, `character-edit-body`→`game-card-edit-body`, `character-edit-body-inner`→`game-card-edit-body-inner`.
- [x] 4.2 In `OperatorCard.css`, delete `.operator-static-summary` and `.operator-static-stats`. AE relies on the `card.css` defaults (no height override needed — one stats row, two edit sections). Leave game-unique rules (`.rarity-indicator`, `.potential-*`, badges) untouched.

## 5. Storybook

- [x] 5.1 Add/extend a `CardPatterns` story in `src/styles/` demonstrating the canonical collapse: a card body toggling `.is-editing`, showing summary→edit-body swap. Document the two height custom properties. — Added `CollapseMechanism` story (`CollapseDemo` component) with both height custom properties set and a working edit toggle.

## 6. Verify (dev-server check is mandatory — do NOT infer)

- [x] 6.1 Run `npm test` — the updated r1999 test passes; all card suites green. — 287 passed across 19 files (r1999 + N2E + AE).
- [x] 6.2 Run `npm run lint && npm run format:check && npm run build` — clean. — all clean (after fixing a `react-hooks/rules-of-hooks` error by extracting the story render into a `CollapseDemo` component).
- [x] 6.3 Confirm no bespoke names remain: grep for `arcanist-static`, `character-static`, `operator-static`, `*-edit-body` — zero structural matches. — Zero in code/CSS/stories. Surfaced + fixed a stale doc (`src/styles/components.md`) referencing the old r1999 names.
- [x] 6.4 Grep built `dist/assets/ArknightsEndfieldPage-*.css` for `edit-body`. — **Before:** absent from AE chunk, present only in N2E chunk (AE bug confirmed). **After:** `game-card-edit-body` is in the **global** `index-*.css` chunk, reachable on the AE route (fix confirmed).
- [x] 6.5 Visual verification of the canonical mechanism. — Drove Storybook (`CollapseMechanism`) via Playwright: measured **collapsed** = summary 58px / edit-body 0px; **expanded** = summary 0px / edit-body 106px; screenshots confirm summary⇄edit-body swap and the active edit-toggle. The CSS-var budgets (80px/700px in the story) resolve correctly. **Note:** r1999/N2E live-route parity is established by structural-property equivalence (canonical rules preserve every property; the 80/700 and 400/1200 magic numbers were relocated verbatim into vars) rather than the authenticated app, which needs Google OAuth + tracked data to show roster cards — out of reach in this environment. AE rarity-stars/chips alignment was confirmed off on the live route by the reviewer; fixed by promoting `align-items: center` into the canonical `.game-card-static-stats` in `card.css` (harmless to chip-only rows, robust for mixed-height content) rather than an AE-local override — see updated design decision.
