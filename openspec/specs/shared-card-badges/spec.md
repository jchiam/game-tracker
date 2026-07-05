## Purpose

A single canonical "pill" badge — the base appearance (padding, radius, font size/weight,
uppercase transform, letter-spacing, backdrop blur, border width, line-height, `white-space`)
defined once as `.game-badge` in `src/styles/card.css` and emitted by the shared `GameBadge`
component. Every header badge across all games (class, element, weapon, afflatus, damage, esper,
arc, path) is this one pill; game stylesheets contribute only per-variant color modifiers and
never re-declare the base.

## Requirements

### Requirement: Canonical badge base defined once as `.game-badge`

The card "pill" badge base appearance SHALL be defined exactly once, as `.game-badge` in
`src/styles/card.css` — padding, radius, font size/weight, uppercase transform, letter-spacing,
backdrop blur, border width, line-height, and `white-space`. Game-specific stylesheets SHALL NOT
re-declare these base properties on their `.{variant}-badge` selectors; they MAY contribute only
per-variant color rules (text color, background fill, border color).

#### Scenario: A game badge inherits the shared base

- **WHEN** a header pill badge (class, element, weapon, afflatus, damage, esper, arc, path) is
  rendered
- **THEN** its element carries the `game-badge` class and takes its padding, radius, weight,
  uppercase, letter-spacing, and blur from the single `.game-badge` rule

#### Scenario: No per-game badge base duplicates remain

- **WHEN** the codebase is searched for badge base rules on `.element-badge`, `.path-badge`,
  `.afflatus-badge`, `.damage-badge`, `.esper-badge`, `.arc-badge`, `.ae-class-badge`,
  `.ae-element-badge`, or `.ae-weapon-badge`
- **THEN** none of them re-declares the base appearance; only per-variant color rules remain

### Requirement: `GameBadge` emits the base plus variant scoping and modifier

The shared `GameBadge` component SHALL render the class list `game-badge {variant}-badge
{variant}-{modifier}`. The `{variant}-badge` class SHALL be retained so each game's compound
per-variant color selectors (e.g. `.path-badge.path-destruction`) continue to match.

#### Scenario: GameBadge renders all three class hooks

- **WHEN** `GameBadge` is rendered with `variant="afflatus"` and `modifier="plant"`
- **THEN** the span has classes `game-badge`, `afflatus-badge`, and `afflatus-plant`, and the
  compound color rule `.afflatus-badge.afflatus-plant` applies

### Requirement: All `GameBadge` variants render the canonical tinted pill

Every `GameBadge` variant SHALL render as the canonical tinted-glass pill — including HSR element
and the AE class/element/weapon variants: bold, uppercase, blurred, with a per-variant fill and
border derived from the variant's colour token via `color-mix(in srgb, var(--token) 25%,
transparent)` (fill) and `60%` (border). No `GameBadge` variant SHALL render as a flat dark chip,
with a faint (`15%` / `30%`) fill, or with its hue hardcoded as an `rgba()` literal.

#### Scenario: AE operator badges match the canonical pill

- **WHEN** an AE operator card renders its class / element / weapon badges
- **THEN** each is bold, uppercase, and blurred with a 25% token-tint fill and 60% token-tint
  border (via `color-mix`) — visually consistent with the HSR path, R1999 afflatus, and N2E esper
  pills

#### Scenario: HSR element badge matches the path badge beside it

- **WHEN** an HSR character card renders its element badge next to its path badge
- **THEN** both render as the same canonical tinted pill (the element badge is no longer a flat
  dark chip)

#### Scenario: HSR slot-avatar border is unaffected by the badge tint

- **WHEN** an HSR party slot-avatar uses a shared `.element-{element}` class for its coloured
  border
- **THEN** it keeps its original border and fill — the canonical badge tint is scoped to the
  compound `.element-badge.element-{element}` selector and does not bleed into the avatar
