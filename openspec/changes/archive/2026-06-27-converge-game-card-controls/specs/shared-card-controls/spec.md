## ADDED Requirements

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

### Requirement: Migration is behavior-preserving

Converging the game cards onto the canonical primitives SHALL NOT change the rendered
appearance or interaction of any control. The post-migration controls SHALL match the
pre-migration pixels (size, color, hover, active, slider fill + glow, select chevron).

#### Scenario: R1999 and N2E controls render unchanged

- **WHEN** an R1999 arcanist card or an N2E character card is rendered after migration
- **THEN** its toggle buttons, sliders, and selects look and behave identically to the
  pre-migration card
