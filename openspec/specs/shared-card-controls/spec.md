## Purpose

A single canonical set of card-control primitives — the toggle button (`.toggle-btn`),
the level slider (`.level-slider`), and the custom select (`.game-select`) — defined once
in `src/styles/controls.css` and consumed by every game card. Game stylesheets reference
these classes and add only game-unique state modifiers; they never re-declare the
primitives' rules.

## Requirements

### Requirement: Canonical card-control primitives defined once

The card-control primitives `.toggle-btn`, `.level-slider`, and `.game-select` SHALL be
defined exactly once, in `src/styles/controls.css`. Game-specific card stylesheets SHALL
NOT re-declare the rules of these primitives (layout, sizing, border, background, hover,
active, thumb, or dropdown affordance); they MAY only add game-unique state modifiers as
additional, separately-scoped classes.

#### Scenario: A game toggle button references the canonical class

- **WHEN** a game card renders a level/stage toggle button (portrait, euphoria,
  awakening, arc-tier, amplify, …)
- **THEN** its markup includes `toggle-btn` (optionally plus `compact` and/or a
  game-unique modifier), and its stylesheet contains no rule that re-declares the base
  `.toggle-btn` appearance

#### Scenario: No bespoke control duplicates remain

- **WHEN** the codebase is searched for the bespoke control rules `.portrait-btn`,
  `.euphoria-btn`, `.amplify-btn`, `.awakening-btn`, `.arc-tier-btn`, `.resonance-slider`,
  `.psychube-slider`, `.character-slider`, `.psychube-select`, `.character-select`
- **THEN** no such rule re-declares a canonical primitive; only canonical classes plus
  game-unique modifiers (e.g. `.portrait-reset`) remain

### Requirement: Standard and compact toggle-button sizes

`.toggle-btn` SHALL provide a standard size, and a `.toggle-btn.compact` modifier SHALL
provide a tighter size (`padding: 5px 4px`, `font-size: 0.78rem`) for dense button rows.
Both sizes SHALL share the same border, background, hover, and active treatment.

#### Scenario: Compact toggle row

- **WHEN** a card renders a dense toggle row (e.g. arc-tier or amplification levels)
- **THEN** each button uses `class="toggle-btn compact"` and renders at the compact size
  while keeping the canonical hover/active states

#### Scenario: Standard toggle row

- **WHEN** a card renders a standard toggle row (e.g. portrait, euphoria, awakening)
- **THEN** each button uses `class="toggle-btn"` without the compact modifier

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
