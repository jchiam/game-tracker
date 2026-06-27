# shared-card-base Specification

## Purpose

The canonical L2 card skeleton shared by every game. Defines once, in `src/styles/card.css`, the
`.game-card-*` structure (wrapper, header, image, overlay, controls, body, name), the three header
buttons (`.favorite-btn`, `.remove-btn`, `.edit-toggle-btn`), and the progress-section primitives
(`.progress-section`, `.section-*`). Games override only padding/gap/hover and add game-unique
rules. The collapse mechanism, control primitives, and the pill badge hang off this skeleton but
are specced separately (`shared-card-collapse`, `shared-card-controls`, `shared-card-badges`).

## Requirements

### Requirement: Canonical card skeleton defined once

The card skeleton classes SHALL be defined exactly once, in `src/styles/card.css`, using the
canonical names `.game-card`, `.game-card-header`, `.game-card-image`, `.game-card-overlay`,
`.game-card-controls`, `.game-card-controls-top`, `.game-card-controls-bottom`,
`.game-card-badges`, `.game-card-body`, and `.game-card-name`. Game-specific card stylesheets
SHALL NOT re-declare these structural rules; they MAY only override body padding/gap and hover
transforms and add game-unique rules.

#### Scenario: All games share the skeleton classes

- **WHEN** any game card (HSR, R1999, N2E, AE) is rendered
- **THEN** its outer wrapper, header, image, overlay, controls, body, and name resolve from the
  single `.game-card-*` rules in `card.css`

#### Scenario: No per-game skeleton duplication remains

- **WHEN** the codebase is searched for skeleton base rules on `.game-card`, `.game-card-header`,
  `.game-card-image`, `.game-card-overlay`, `.game-card-controls`, `.game-card-body`, or
  `.game-card-name`
- **THEN** none is re-declared in a game stylesheet; games contribute only padding/gap/hover
  overrides and game-unique rules

#### Scenario: Card entrance and hover are shared

- **WHEN** cards mount in a roster grid
- **THEN** they animate in via the shared `fade-in-up` with staggered `:nth-child` delays, and on
  hover the shared rule lifts the border to `--color-brand-primary` and scales `.game-card-image`

### Requirement: Canonical card header buttons defined once

The three header buttons SHALL be defined exactly once, in `src/styles/card.css`: `.favorite-btn`,
`.remove-btn`, and `.edit-toggle-btn`, including their `.active` states. Game-specific card
stylesheets SHALL NOT re-declare these button rules.

#### Scenario: Favorite toggle uses the shared active style

- **WHEN** a card's favorite button is toggled active
- **THEN** it takes the shared `.favorite-btn.active` treatment (brand-primary colour, muted
  background, inset glow) from `card.css`

#### Scenario: Edit toggle uses the shared active style

- **WHEN** a card enters edit mode
- **THEN** its `.edit-toggle-btn.active` styling resolves from the single rule in `card.css`

### Requirement: Progress-section primitives defined once

The progress-section primitives SHALL be defined exactly once, in `src/styles/card.css`:
`.progress-section`, `.section-header`, `.section-value`, and `.section-sublabel`, consumed by all
game cards (directly and via the shared `ProgressSection` component). Game stylesheets SHALL NOT
re-declare these primitives.

#### Scenario: A stat section uses the shared primitives

- **WHEN** any game card renders an investment/stat section
- **THEN** its container, header row, value, and sublabel resolve from the shared
  `.progress-section` / `.section-*` rules in `card.css`

### Requirement: Card base values reference design tokens

The skeleton, button, and progress-section rules SHALL reference design tokens for colour,
spacing, radius, shadow, and transition values rather than hardcoded literals — except the
documented glass/overlay exceptions (e.g. `rgba(0,0,0,…)` overlay gradients and translucent
hairline borders) that the token layer cannot yet express.

#### Scenario: Token-backed card chrome

- **WHEN** the shared card rules set background, border, radius, spacing, or transition
- **THEN** they reference `--color-*`, `--spacing-*`, `--border-radius-*`, `--shadow-*`, or
  `--transition-*` tokens, reserving literal `rgba()` only for the overlay/glass exceptions noted
  in CLAUDE.md

### Requirement: Card collapse, controls, and badges are specced separately

The card collapse mechanism, the card-control primitives, and the canonical pill badge SHALL
remain owned by their own capabilities — `shared-card-collapse`, `shared-card-controls`, and
`shared-card-badges` respectively. This capability SHALL reference them and SHALL NOT redeclare
their rules.

#### Scenario: No cross-capability duplication

- **WHEN** this capability's requirements are reviewed against `shared-card-collapse`,
  `shared-card-controls`, and `shared-card-badges`
- **THEN** the collapse classes (`.game-card-static-summary`, `.game-card-edit-body`, …), the
  control primitives (`.toggle-btn`, `.level-slider`, `.game-select`), and the `.game-badge` pill
  are mentioned only as cross-references, not redeclared as requirements here
