# shared-card-base Delta

## ADDED Requirements

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
