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

The card skeleton classes SHALL be defined exactly once, in `src/styles/card.css`,
using the canonical names `.game-card`, `.game-card-header`, `.game-card-image`,
`.game-card-overlay`, `.game-card-controls`, `.game-card-controls-top`,
`.game-card-controls-bottom`, `.game-card-badges`, `.game-card-header-actions`,
`.game-card-body`, and `.game-card-name`. Game-specific card stylesheets SHALL NOT re-declare these
structural rules as bare rules on the shared class. Any genuine per-game deviation
from a shared structural rule SHALL be expressed in a **leak-proof** (element-scoped)
form — a game-scoped selector (e.g. `.game-card.is-{gameId} …`) or an inline
custom property on the card root — and SHALL NOT be a bare rule on a shared
`.game-card-*` class or pseudo-class in route-split CSS. This mirrors the
`shared-card-collapse` capability, which leak-proofs per-game height budgets for the
same reason: in the SPA all route stylesheets coexist in one document, so a bare
rule on a shared class is resolved by load order and leaks across games.

#### Scenario: All games share the skeleton classes

- **WHEN** any game card (HSR, R1999, N2E, AE) is rendered
- **THEN** its outer wrapper, header, image, overlay, controls, body, and name resolve from the
  single `.game-card-*` rules in `card.css`

#### Scenario: No per-game skeleton duplication remains

- **WHEN** the codebase is searched for skeleton base rules on `.game-card`, `.game-card-header`,
  `.game-card-image`, `.game-card-overlay`, `.game-card-controls`, `.game-card-body`, or
  `.game-card-name`
- **THEN** none is re-declared as a bare rule in a game stylesheet; games contribute only
  leak-proof (game-scoped or inline) deviations and game-unique rules

#### Scenario: No bare shared-class rule leaks across games

- **WHEN** a user navigates between two games' rosters within the SPA, so both route
  stylesheets are loaded
- **THEN** neither game's body padding/gap, name margin, nor card `:hover` transform is
  altered by the other game's stylesheet, because no game declares a bare rule on a shared
  `.game-card-*` class or `.game-card:hover`

#### Scenario: Card entrance and hover are shared

- **WHEN** cards mount in a roster grid
- **THEN** they animate in via the shared `fade-in-up` with staggered `:nth-child` delays, and on
  hover the shared rule lifts the border to `--color-brand-primary` and scales `.game-card-image`

#### Scenario: Stagger saturates beyond the delay ladder

- **WHEN** a grid renders more cards than the stagger ladder has explicit `:nth-child` delay rungs
- **THEN** every card beyond the ladder takes a saturating `:nth-child(n + …)` delay at least as
  long as the final rung, so no later card ever animates in before an earlier one (an uncapped
  ladder leaves later cards at `animation-delay: 0`, making them pop in first)

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

### Requirement: Canonical card-body layout default

`card.css` SHALL define the default card-body layout — body padding, body gap, and
`.game-card-name` margin — on the base `.game-card-body` / `.game-card-name` rules,
sized to the layout shared by the majority of games. A game whose card matches this
default SHALL contribute **no** body-layout CSS; it inherits padding, gap, and name
spacing from `card.css`. A game that adds a tracked card without any body-layout
override SHALL still render with correct padding, making a "missing body padding"
regression structurally impossible.

#### Scenario: A game with no body override renders padded

- **WHEN** a game card has no game-specific `.game-card-body` rule
- **THEN** it renders with the canonical body padding, gap, and name spacing from `card.css`,
  on a cold route load, without depending on any other game's stylesheet

#### Scenario: Matching games contribute no body-layout CSS

- **WHEN** the game card stylesheets are searched for `.game-card-body` padding/gap and
  `.game-card-body > .game-card-name` margin rules
- **THEN** only games that genuinely deviate from the canonical default declare them, and they
  do so in leak-proof (game-scoped or inline) form

### Requirement: Anodized edge rules defined once

The anodized-edge presentation SHALL be defined exactly once, in `src/styles/card.css`, gated on the `has-temper-edge` class: a 3px edge spanning the top of the card whose colour is `var(--temper)` (supplied inline per card by the shell) and whose glow is derived from the same property via `color-mix(in srgb, var(--temper) X%, transparent)` — never a hardcoded hue. The glow SHALL intensify on card hover, layered with (not replacing) the existing shared hover treatment. A card without the class SHALL render no edge and incur no layout shift relative to an edged card. Game stylesheets SHALL NOT re-declare or override the edge rules.

#### Scenario: Edge renders from the inline property

- **WHEN** a `.game-card.has-temper-edge` renders with an inline `--temper`
- **THEN** the 3px top edge and its glow both resolve from `var(--temper)` via the single rule set in `card.css`

#### Scenario: Hover intensifies the glow

- **WHEN** an edged card is hovered
- **THEN** the edge glow strengthens via a higher `color-mix` percentage while the shared card hover (border lift, shadow, image scale) still applies

#### Scenario: Unedged cards are unaffected

- **WHEN** a card renders without `has-temper-edge` (R1999, AE, or a scored game's insufficient-data card)
- **THEN** no edge or glow renders and the card's geometry matches the pre-feature layout

### Requirement: Section-group primitive defined once

A **section group** — a labeled container that visually encloses a set of `.progress-section`s
under a single heading — SHALL be defined exactly once, in `src/styles/card.css`, as
`.card-section-group` (the container) and `.card-section-group-header` (its heading). It is the
canonical way for a game card to present several stat/investment sections as one named unit (first
consumer: the N2E Console group). Game stylesheets SHALL NOT re-declare these primitives, and SHALL
NOT introduce a game-local equivalent wrapper.

The primitive SHALL be visually **neutral**: a tokenized hairline border and neutral background,
with a heading styled consistently with `.section-header`. It SHALL carry no game-specific accent
colour, and games SHALL NOT layer a per-game accent tint onto it — every section group reads the
same across games. It references design tokens for colour, spacing, and radius per the "Card base
values reference design tokens" requirement (reserving only the documented overlay/glass literal
exceptions).

#### Scenario: A card groups sections under one header

- **WHEN** a game card wraps multiple `.progress-section`s in a named group (e.g. the N2E Console)
- **THEN** the container and heading resolve from the shared `.card-section-group` /
  `.card-section-group-header` rules in `card.css`, not a game-local re-declaration

#### Scenario: Section group is visually neutral

- **WHEN** the section-group primitive renders on any game card
- **THEN** its border, background, and heading use neutral tokenized values with no game accent
  colour, and no game stylesheet adds an accent-tint override

#### Scenario: Nested sections keep the shared primitives

- **WHEN** a `.card-section-group` encloses its child sections
- **THEN** each child is a shared `.progress-section` (via `ProgressSection`), and the group adds
  only the enclosing container + heading, never a re-declared section rule
