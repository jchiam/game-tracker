## ADDED Requirements

### Requirement: Canonical roster filter-chip primitive

The roster filter primitives `.filter-row` and `.filter-chip` SHALL be defined exactly once, in
`src/styles/controls.css`. Game and page stylesheets SHALL NOT re-declare the rules of these
primitives (layout, sizing, border, background, hover, or active treatment); they MAY only supply
the per-game accent.

The base `.filter-chip` hover and active treatments SHALL derive their accent colour from a
`--filter-chip-accent` CSS custom property rather than a hardcoded per-game token. Each roster page
SHALL set `--filter-chip-accent` on the `.filter-row` element it renders, so the value inherits to
the chips within (P5X = `--color-p5x-element-fire`, R1999 = `--color-r1999-accent`).

#### Scenario: A game renders the filter chip via the canonical class

- **WHEN** a roster page renders a predicate-filter chip
- **THEN** its markup includes `filter-chip` inside a `filter-row`, and the page stylesheet contains
  no rule that re-declares the base `.filter-row` / `.filter-chip` appearance

#### Scenario: Accent comes from the custom property

- **WHEN** a page sets `--filter-chip-accent` on its `.filter-row` element
- **THEN** the chip's hover and active border/text/glow use that accent, with no accent colour
  hardcoded in the shared `.filter-chip` rules

#### Scenario: No page-local filter-chip duplicates remain

- **WHEN** the codebase is searched for `.filter-row` / `.filter-chip` rule declarations
- **THEN** the only declaration is in `src/styles/controls.css`; no page stylesheet re-declares them

#### Scenario: Visual parity preserved

- **WHEN** the P5X and R1999 gate chips render after consolidation
- **THEN** their computed hover and active styles are identical to the pre-consolidation page-local
  versions (accent unchanged per game)
