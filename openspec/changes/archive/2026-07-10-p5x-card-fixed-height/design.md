## Context

P5X Thief cards collapse to a read-only summary composed of a flex-wrap chip row
(`.game-card-static-stats`) plus a single-line static Persona line. `GameCardShell`
measures each card's summary inner-wrapper `scrollHeight` and writes it to
`--game-card-summary-max-height`, so **every card sizes to its own content**. The
only source of height variance is the chip row wrapping to 1, 2, or (worst case) 3
lines. The dominant driver is the variable-width Revelations chip — labels range
from short ("Strife 4pc") to long ("Meditation · Power 2pc · Peace 2pc").

Constraints:

- Card header is already a fixed 250px; the static Persona line is `white-space:
nowrap` + ellipsis (always one line). Neither contributes variance.
- `card.css` is shared by all five games; route-split CSS must stay leak-proof
  (per `shared-card-collapse`: structural rules live once in `card.css`, budgets
  are element-scoped inline props set by the shell).
- `StatChip` currently exposes only `label` + `style` (no `className`).
- No game currently carries a game-id class on `.game-card`, so there is no
  existing P5X-only ancestor selector to hang a rule on.

## Goals / Non-Goals

**Goals:**

- Uniform collapsed body height across the P5X roster grid.
- Bound the worst case to two chip lines regardless of Revelations label length.
- Keep the change P5X-scoped: no visual regression to HSR, R1999, N2E, AE.
- No information loss — full set names stay reachable in the Revelation editor.

**Non-Goals:**

- Changing the edit-body section order (stays Level → Weapon → Revelations →
  Mindscape → Skills).
- Applying the fixed-height reserve to other games (opt-in only).
- A cross-card JS height-equalizer (measuring the tallest card and stretching the
  rest) — heavier, and unnecessary once the worst case is bounded to two lines.

## Decisions

### D1 — Reorder summary chips: Mindscape before Revelations

Pure JSX reorder in `ThiefCard.tsx` `summaryStats` — move the `MS ✓` chip block
above the Revelations chip block. Reordering a flex-wrap row does not change total
content width, so it cannot by itself change the line count; its value is packing:
front-loading the short fixed-width chips fills line 1 densely and pushes the one
variable-width chip to start line 2 cleanly, avoiding a short chip being orphaned.
This is step 1 of 3, not a standalone fix.

### D2 — Bound the Revelations chip width (ellipsis)

Add an optional `className` passthrough to `StatChip` (`shared-ui-components`) —
backward-compatible, `label` + `style` unchanged. `ThiefCard` passes a
`p5x-revelation-chip` class to the Revelations chip only. `ThiefCard.css` gives
that class a `max-width` (in `ch`) plus `white-space: nowrap; overflow: hidden;
text-overflow: ellipsis`. This caps the single variable-width chip to ~one slot so
six chips never spill to a third line.

**Responsive cap (added during verification).** Pixel measurement of the real
shared CSS showed `18ch` holds six chips to two lines at the 280px default column,
but the ≤768px breakpoint (where `RosterPageLayout.css` drops the grid to 240px
columns) spills them to a third line, breaking the reserve. So the cap is
`18ch` by default and tightens to `12ch` under `@media (max-width: 768px)` —
measured as the widest cap that keeps six chips on two lines at a 240px card. The
768px value is duplicated from the grid breakpoint with a cross-reference comment.

_Alternative considered:_ wrap the chip in a P5X `<span>` and style the descendant
`.stat-chip`. Rejected — a `className` prop is cleaner, reusable, and matches how
`style` is already threaded through.

### D3 — Fixed two-line reserve via a `GameCardShell` opt-in class

`GameCardShell` gains an optional boolean prop (e.g. `reserveSummaryRows`/
`fixedSummaryHeight`). When set, the shell adds a modifier class to the card; the
`min-height` rule lives **once in `card.css`** keyed off that class, sized to two
chip rows. Because the reserve raises the `scrollHeight` of the never-clipped
`.game-card-static-summary-inner`, the existing measurement path picks it up
automatically and writes the reserved height to `--game-card-summary-max-height` —
no separate budget path, no per-game constant. P5X opts in; every other game omits
the prop and is byte-for-byte unaffected.

The reserve height is derived from chip box metrics (font size, vertical padding,
border, one row gap) via `calc()` referencing existing tokens — no magic px:
`calc(2 * (0.75rem * var(--typography-line-height-tight) + 4px + 2px) + var(--spacing-sm))`
(the `0.75rem`/`4px`/`2px` mirror `.stat-chip`'s own font-size, vertical padding,
and border).

**Chip line-height pin (added during verification).** The calc assumes the chip's
line box is `0.75rem × line-height-tight`, but `.stat-chip` set no `line-height`
and inherited `normal` — so a real two-line row was a few px shorter than the
reserve, making a one-line card slightly taller than a two-line card. Fix: pin
`.stat-chip { line-height: var(--typography-line-height-tight) }` (matching
`.game-badge`), making the calc input exact. This is a shared change to every
game's chip (~1px taller line box); the full test suite and a cross-game build
confirm no regression. Verified by measuring both cards' `.game-card-static-stats`
`getBoundingClientRect().height` in headless Chromium against the real CSS: equal
at 51.19px on both the 280px and 240px breakpoints.

_Alternatives considered:_

- **Global `min-height` on `.game-card-static-stats`** — simplest, but regresses
  every game by adding dead space under one-line cards. Rejected: blast radius.
- **Page-level scope** (`.roster-grid.is-p5x …`) — needs `RosterPageLayout` to
  emit a game-id class; spreads the seam across the layout and leaves the reserve
  rule reachable only through a descendant selector. Rejected in favor of the
  shell opt-in, which co-locates the mechanism with the measurement it feeds.
- **Inline `min-height` style from a numeric prop** — element-scoped and leak-safe,
  but puts a structural style inline instead of in `card.css`, against the
  `shared-card-collapse` convention that structural rules live in the stylesheet.

## Risks / Trade-offs

- **Dead space under sparse cards** → Accepted. One-line cards reserve a second
  line's height; the uniformity is the point. It is bounded (one extra line).
- **A future 7th summary chip could exceed two lines**, making the reserve wrong →
  Mitigation: the Revelations cap holds the current six-chip set to two lines;
  the two-line count is documented at the reserve rule so a future chip addition
  triggers a re-evaluation.
- **Ellipsis hides part of a long set name** → Mitigation: full Heavens + Space
  names remain in the Revelation editor modal (asserted by spec scenario).
- **Reserve rule leaking to other games** → Mitigation: gated behind the shell's
  opt-in modifier class; default-off keeps existing cards identical. A test on
  `GameCardShell` asserts the class is absent without the prop.
- **Storybook drift** → `CardPatterns.stories.tsx` documents shared card styles;
  the new reserve modifier should be added there per the design-system rule.

## Migration Plan

Presentational-only; no DB, API, or data changes. Ship in one PR. Rollback = revert
the PR. No feature flag needed — the reserve is inert for every non-opted-in game,
so risk is confined to the P5X route.

## Open Questions

- Expose the reserve as a boolean (hardcode "2 rows" in `card.css`) or as a row
  count? Recommend boolean now (only P5X needs it; 2 is the only value); generalize
  to a count only if a second game later needs a different reserve.
