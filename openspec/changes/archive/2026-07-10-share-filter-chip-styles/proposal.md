## Why

The roster filter chip (`.filter-row` / `.filter-chip`) is a canonical class per the
`roster-predicate-filter` capability — every game that adds a gate uses the same markup. But its
CSS is duplicated page-local: once in `P5xPage.css` (accent = `--color-p5x-element-fire`) and once
in `Reverse1999Page.css` (accent = `--color-r1999-accent`). Two byte-similar copies of a canonical
class is exactly the maintainability debt CLAUDE.md's design system forbids (canonical rules are
declared once in L2; game stylesheets add only overrides). A third game adopting the gate would
add a third copy. Consolidate now while there are only two.

## What Changes

- Move the base `.filter-row` + `.filter-chip` rules (layout, neutral state, hover, active) into
  shared `src/styles/controls.css` (L2), defined once.
- Parameterize the accent: base rules reference a `--filter-chip-accent` CSS custom property; each
  game sets it on the `.filter-row` element it renders (P5X = `--color-p5x-element-fire`, R1999 =
  `--color-r1999-accent`).
- Remove the duplicated rules from `P5xPage.css` and `Reverse1999Page.css`. `P5xPage.css` becomes
  empty → delete it and drop its import; `Reverse1999Page.css` likewise if nothing else remains.
- Update the `ControlPatterns` Storybook story to document the shared filter chip.
- **No behavior or visual change** — computed styles for both games stay identical.

## Capabilities

### New Capabilities

<!-- None. -->

### Modified Capabilities

- `shared-card-controls`: Add `.filter-row` / `.filter-chip` to the set of canonical control
  primitives defined once in `controls.css`, with the per-game accent supplied via a
  `--filter-chip-accent` custom property. Page stylesheets SHALL NOT re-declare these rules.

## Impact

- `src/styles/controls.css` — gains the canonical `.filter-row` / `.filter-chip` rules using
  `var(--filter-chip-accent)`.
- `src/pages/persona-5-phantom-x/P5xPage.css` — filter rules removed; file deleted if empty.
- `src/pages/persona-5-phantom-x/P5xPage.tsx` — `.filter-row` element sets `--filter-chip-accent`;
  drop the `P5xPage.css` import if the file is deleted.
- `src/pages/reverse1999/Reverse1999Page.css` — filter rules removed; file deleted if empty.
- `src/pages/reverse1999/Reverse1999Page.tsx` — `.filter-row` element sets `--filter-chip-accent`;
  drop the CSS import if the file is deleted.
- `src/styles/ControlPatterns.stories.tsx` — document the shared filter chip.
- No token, DB, service, or hook changes. Existing P5X + R1999 page tests must stay green.
