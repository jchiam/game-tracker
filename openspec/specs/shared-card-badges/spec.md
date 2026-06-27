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
  `.afflatus-badge`, `.damage-badge`, `.esper-badge`, `.arc-badge`, `.endfield-class-badge`,
  `.endfield-element-badge`, or `.endfield-weapon-badge`
- **THEN** none of them re-declares the base appearance; only per-variant color rules remain

### Requirement: `GameBadge` emits the base plus variant scoping and modifier

The shared `GameBadge` component SHALL render the class list `game-badge {variant}-badge
{variant}-{modifier}`. The `{variant}-badge` class SHALL be retained so each game's compound
per-variant color selectors (e.g. `.path-badge.path-destruction`) continue to match.

#### Scenario: GameBadge renders all three class hooks

- **WHEN** `GameBadge` is rendered with `variant="afflatus"` and `modifier="plant"`
- **THEN** the span has classes `game-badge`, `afflatus-badge`, and `afflatus-plant`, and the
  compound color rule `.afflatus-badge.afflatus-plant` applies

### Requirement: Directly-rendered badges include the base class

Badge spans rendered without the `GameBadge` component SHALL include the `game-badge` class so
they inherit the same base appearance — specifically the HSR and AE element badges in the
character/operator picker modals.

#### Scenario: Picker-modal element badge inherits the base

- **WHEN** `AddCharacterModal` or `AddOperatorModal` renders an element badge by hand
- **THEN** the span's class list begins with `game-badge` followed by `{variant}-badge` and
  `{variant}-{modifier}`, and the badge renders with the canonical pill base

### Requirement: All `GameBadge` variants render the canonical tinted pill

Every `GameBadge` variant SHALL render as the canonical tinted-glass pill — including HSR element
and the AE class/element/weapon variants: bold, uppercase, blurred, with a per-variant fill of
`rgba(hue, 0.25)` and border of `rgba(hue, 0.6)`. No `GameBadge` variant SHALL render as a flat
dark chip or with a faint (`0.15` / `0.3`) fill.

#### Scenario: AE operator badges match the canonical pill

- **WHEN** an AE operator card renders its class / element / weapon badges
- **THEN** each is bold, uppercase, and blurred with a `rgba(hue, 0.25)` fill and `rgba(hue, 0.6)`
  border — visually consistent with the HSR path, R1999 afflatus, and N2E esper pills

#### Scenario: HSR element badge matches the path badge beside it

- **WHEN** an HSR character card renders its element badge next to its path badge
- **THEN** both render as the same canonical tinted pill (the element badge is no longer a flat
  dark chip)

#### Scenario: HSR slot-avatar border is unaffected by the badge tint

- **WHEN** an HSR party slot-avatar uses a shared `.element-{element}` class for its coloured
  border
- **THEN** it keeps its original border and fill — the canonical badge tint is scoped to the
  compound `.element-badge.element-{element}` selector and does not bleed into the avatar

### Requirement: Canonical-variant badges are visually unchanged

The five already-canonical variants SHALL NOT change appearance when the badge base moves to
`.game-badge` — HSR `path`, R1999 `afflatus` / `damage`, and N2E `esper` / `arc`.

#### Scenario: Path, afflatus, damage, esper, arc pills render unchanged

- **WHEN** an HSR, R1999, or N2E card is rendered after the migration
- **THEN** its path / afflatus / damage / esper / arc pills look identical to before (same
  padding, radius, weight, uppercase, blur, fill, and border)
