## MODIFIED Requirements

### Requirement: Canonical card skeleton defined once

The card skeleton classes SHALL be defined exactly once, in `src/styles/card.css`,
using the canonical names `.game-card`, `.game-card-header`, `.game-card-image`,
`.game-card-overlay`, `.game-card-controls`, `.game-card-controls-top`,
`.game-card-controls-bottom`, `.game-card-badges`, `.game-card-body`, and
`.game-card-name`. Game-specific card stylesheets SHALL NOT re-declare these
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

## ADDED Requirements

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
