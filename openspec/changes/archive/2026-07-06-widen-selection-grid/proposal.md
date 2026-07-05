# Widen Selection Grid

## Why

The game selection page grid is capped at `max-width: 900px`, which fits at most 2 columns of `minmax(320px, 1fr)` tracks. With 5 games registered (HSR, R1999, N2E, AE, P5X) the desktop layout stacks 2+2+1, wasting horizontal space on wide screens.

## What Changes

- Selection page escapes the global 1200px `.main-content` shell via a page-scoped modifier class (`selection-content`, `max-width: 1400px`).
- `.selection-grid` max-width raised from 900px to 1400px; minimum track size raised from 320px to 360px so `auto-fit` caps at exactly 3 columns (4 columns would need `4×360px + 3 gaps ≈ 1536px` > 1400px).
- Resulting desktop layout: 3 columns (~424px cards, near-identical to today's ~434px 2-column card width), degrading to 2 then 1 column on narrower viewports via the existing `auto-fit` behaviour — no media queries.

## Capabilities

### New Capabilities

- `selection-page-layout`: responsive column behaviour of the game selection grid — desktop column cap, card minimum width, and graceful degradation to fewer columns on narrow viewports.

### Modified Capabilities

<!-- none — shared-game-registry covers registry data driving the page, not its layout -->

## Impact

- `src/pages/SelectionPage.css` — grid max-width, track minimum, new `selection-content` rule.
- `src/pages/SelectionPage.tsx` — add `selection-content` class to the page `<main>`.
- No changes to `.main-content` in `App.css`; roster pages keep the 1200px shell.
- No token changes: layout widths are literal in this codebase (`App.css` uses literal 1200px).
