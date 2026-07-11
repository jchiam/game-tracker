# shared-design-tokens Delta

## ADDED Requirements

### Requirement: Temper ramp gradient is a canonical token

The token system SHALL define one canonical Temper ramp gradient token (`gradient.temperRamp`, compiled to `--gradient-temper-ramp`) — a `linear-gradient` whose colour stops are Style Dictionary references to the `color.temper.*` anchors at the positions fixed by `shared-progress-gradient`'s anchor stops (rust 0%, amber 33%, gold 67%, verdigris 100%). CSS surfaces that paint the full investment ramp (rail backgrounds, scale visualisations) SHALL reference this token rather than hand-writing the gradient's stops.

#### Scenario: Rail surface uses the gradient token

- **WHEN** a stylesheet paints a full-ramp gradient surface
- **THEN** it sets `background: var(--gradient-temper-ramp)` rather than declaring its own `linear-gradient` of ramp hexes

#### Scenario: Gradient stays locked to the anchors

- **WHEN** the compiled `--gradient-temper-ramp` is inspected
- **THEN** its four stops equal the `color.temper.*` values at 0%/33%/67%/100%, matching the `shared-progress-gradient` anchor stops
