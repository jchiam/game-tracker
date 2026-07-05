# Design — Widen Selection Grid

## Context

Two nested width caps constrain the selection grid today:

```
.main-content        max-width: 1200px   (App.css)
  └─ .selection-grid max-width: 900px    (SelectionPage.css)
       grid-template-columns: repeat(auto-fit, minmax(320px, 1fr))
```

At 900px, a third `320px` track never fits (`3×320 + 2×32 gap = 1024px > 900`), so `auto-fit` tops out at 2 columns regardless of viewport. With 5 games registered the desktop layout is 2+2+1.

## Goals / Non-Goals

**Goals:**

- 3 columns on desktop viewports, with card width close to today's (~434px) so cover crops and header proportions are unchanged.
- Hard cap at 3 columns — never 4, even on ultra-wide monitors.
- Graceful degradation to 2 then 1 column purely via `auto-fit` (no media queries).
- Only the selection page widens; roster pages keep the 1200px shell.

**Non-Goals:**

- No change to `.main-content` in `App.css`.
- No design-token additions — layout max-widths are literal in this codebase (`App.css` uses literal `1200px`).
- No card visual redesign (header height, badges, hover behaviour untouched).

## Decisions

1. **Page-scoped shell escape via modifier class.** `SelectionPage` adds `selection-content` alongside `main-content`; the rule lives in `SelectionPage.css` and sets `max-width: 1400px`. Alternatives: widening `.main-content` globally (rejected — reflows every roster page) or dropping `main-content` from the page (rejected — loses shared padding/flex behaviour).

2. **Column cap by arithmetic, not media query.** Keep `repeat(auto-fit, minmax(360px, 1fr))` and raise grid `max-width` to 1400px. A 4th column needs `4×360 + 3×32 = 1536px > 1400`, so 3 is the ceiling; 2- and 1-column fallbacks come free from `auto-fit`. Alternative: explicit `repeat(3, 1fr)` + breakpoints (rejected — more CSS, duplicates what `auto-fit` already does, and the codebase's existing grids use `auto-fit`).

3. **Track minimum 360px (up from 320px).** Chosen so the 3-column threshold lands at ~1176px content width — comfortably inside common desktop viewports — while keeping the never-4 guarantee under the 1400px cap. At full width cards are ~424px, within 10px of today's 2-column card width.

## Risks / Trade-offs

- [Tablet band shifts] Viewports between ~784px and ~1176px content width render 2 columns; below that, 1. This mirrors current behaviour closely (old 2-column threshold was ~672px) — slightly earlier collapse to 1 column on small tablets is acceptable for a marketing-style page. → Verified visually at 768px during implementation.
- [Orphan row] 5 games render 3+2. Acceptable; less lopsided than today's 2+2+1. Grid rows stay left-aligned per standard grid flow.
- [Fixed 320px header height] Narrower-than-before cards on mid-size viewports make headers slightly more portrait. Cover art uses `background-size: cover` / positioned `<img>`, so crops adapt; eyeball per-game covers at 3-column width during implementation.
