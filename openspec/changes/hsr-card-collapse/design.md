## Context

HSR `CharacterCard` (`src/pages/honkai-star-rail/components/CharacterCard.tsx`) renders everything inline in `.game-card-body`: `<h3>` name, then four `ProgressSection`s — Level (slider), Traces (`ConfirmCheckbox`), Relic Sets (6-slot `.relics-grid`), and a conditional Target Build (`.build-prefs-display`). There is no `isEditing` state and no edit toggle; the header overlay's bottom row holds the badges and, when `hasPreferences`, a `.score-badge`. The level slider uses a flat `var(--color-brand-primary)` fill rather than the shared gradient.

The two foundations are now available: `getProgressStyle` from `@/utils/progressGradient` (Change A) and the canonical `.game-card-static-summary` / `.game-card-edit-body` classes plus the `--game-card-summary-max-height` / `--game-card-edit-max-height` custom properties (Change B). HSR tracks only `level` (1–80), `tracesAttained` (boolean), the six `relics` slots, and `buildPreferences` — no eidolon/light cone — so the investment summary is intentionally small.

## Goals / Non-Goals

**Goals:**

- Bring HSR to the shared collapse pattern: read-only summary by default, editing controls behind the ✎ toggle, uniform collapsed height across all HSR cards.
- Compose the collapsed summary from three gradient chips: `Lv`, traces, `Relics n/6` (the chosen slot-fill digest).
- Adopt the shared gradient for the chips and the level slider.

**Non-Goals:**

- No change to relic scoring, the score badge's tier logic, or its overlay placement.
- No change to HSR data fields, services, or hooks.
- Not adding the image-loading spinner / `game-card-image-wrapper` that the other three cards have (separate consistency gap, called out in the proposal).
- Not slimming or relocating the Target Build beyond moving it into the edit body — it keeps its current `.build-prefs-display` markup.

## Decisions

**Decision: Gear digest = relic slot-fill chip `Relics n/6`, not set names or an icon row.**
Chosen with the user. `n` = count of slots where `relics[slot]?.setId` is non-null. Colored by `getProgressStyle(n, 0, 6)`. Rationale: tightest and most consistent with the StatChip language; the score badge (overlay) already carries "quality vs target," and which-sets detail lives in the edit-body relic grid. _Alternatives considered:_ dominant-set one-liner (can overflow, variable height) and a mini relic-icon row (taller, own row). Both rejected for the fixed-height, chip-consistent goal.

**Decision: Traces as a gradient chip, not a checkmark glyph alone.**
Render a `StatChip` labeled `Traces ✓` / `Traces ✗`, colored teal when `tracesAttained` else rust (`getProgressStyle(tracesAttained ? 1 : 0, 0, 1)`). Keeps the summary in one visual language (gradient chips) rather than mixing a raw checkbox/glyph.

**Decision: Edit toggle grouped with the score badge in an overlay-right container.**
Add `.edit-toggle-btn` to `.game-card-controls-bottom`, wrapping it (and the existing score badge) in a right-aligned container — the same arrangement N2E uses (`.character-overlay-right`). This reuses the canonical `.edit-toggle-btn` styles already in `card.css`.

**Decision: Move all four ProgressSections into `.game-card-edit-body-inner`; summary holds only chips.**
The summary is purely read-only chips; every interactive control (slider, checkbox, relic grid, Target Build) goes in the edit body. The relic grid and Target Build keep their existing class names and markup — only their container changes.

**Decision: Height budgets — summary ~100px, edit ~900px.**
Summary is a single (occasionally wrapping) chip row. Realistic edit-body content (Level ~70px + Traces ~60px + 6-slot grid ~90px + a full multi-row Target Build ~280px, plus section gaps/padding) is ~600–650px (measured 554px); the budget is set to 900px for headroom without gross oversizing. Avoid the temptation to over-pad (e.g. 1400px): because `max-height` transitions linearly, an N px budget over ~M px of real content wastes `(N−M)/N` of the 0.4s collapse as dead time before the card visibly moves. 900 vs ~650 keeps that papercut small.

**Decision: Set per-game budgets as INLINE custom properties on the card root — not via a `.game-card {}` rule (corrects a Change B defect).**
Change B set each game's budgets via `.game-card { --game-card-…-max-height: … }` in route-split CSS, assuming a route's CSS only applies on its own route. That assumption is false: in a SPA, **CSS chunks persist after navigation**, so once two games have been visited, both `.game-card {}` rules coexist at identical specificity and the cascade winner (by load order) applies to _every_ card — clamping, e.g., N2E's 400px summary to HSR's 100px after an HSR→N2E navigation (build prefs clip). Confirmed in the built chunks: `HsrPage.css`, `N2ePage.css`, `Reverse1999Page.css` each emit a colliding `.game-card{--game-card-summary-max-height:…}`. The fix is to set the two custom properties **inline on each card's root element** (`style={{ '--game-card-summary-max-height': …, '--game-card-edit-max-height': … }}`), which is element-scoped and collision-proof regardless of navigation order. This matches the existing inline-custom-property pattern the cards already use for `--slider-fill-color`. The `.game-card { --vars }` rules are deleted from all three game CSS files; AE keeps no override and correctly falls back to the `card.css` defaults (200px / 1200px). `card.css` structural rules are not re-declared.

## Risks / Trade-offs

- **[Test breakage — the relic grid and Target Build move into the edit body]** → `CharacterCard.test.tsx` currently asserts against the always-rendered grid/prefs. Elements remain in the DOM (the edit body is `max-height: 0`, not unmounted), so `getBy*`/`querySelector` still resolve, but any assertion tied to the old structure or to summary content needs updating. Update the test alongside the component; run `npm test`.
- **[Visual parity needs eyes, like Change B]** → This restructures the most-used card. Unit tests can't prove the collapsed layout looks right. Verify via the Storybook collapse story plus, where reachable, the live HSR route; at minimum confirm collapsed chip row and expanded controls render and the toggle animates.
- **[e2e: HSR goes from always-expanded to collapsed-by-default]** → Unlike r1999/N2E/AE (already collapsed when their e2e was written), HSR's relic grid / traces / target build move behind `max-height: 0; overflow: hidden`. A real-browser Playwright test that clicked those without first opening the ✎ toggle would break — while jsdom `npm test` would pass (jsdom ignores CSS). Checked before scoping: `tests/` HSR specs are navigation-only (goto `/honkai-star-rail`, assert h1/URL/switcher); none interact with card internals, so no e2e change is needed. `npm run test:e2e` is still run as a verification gate (and by the pre-push hook).
- **[Score badge interaction with the new toggle]** → Both now sit in the overlay-bottom-right; ensure the toggle is always present but the score badge stays conditional on `hasPreferences`, and that they don't overlap. Covered by the overlay-right container layout.
