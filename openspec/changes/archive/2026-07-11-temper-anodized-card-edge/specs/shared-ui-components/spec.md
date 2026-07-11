# shared-ui-components Delta

## ADDED Requirements

### Requirement: GameCardShell renders the anodized temper edge

`GameCardShell` SHALL accept an optional `temperScore` prop (number). When the prop is a non-negative score, the shell SHALL set the `--temper` custom property inline on the card root to the shared investment-progress gradient colour at that score (0–100) and tag the root with the `has-temper-edge` class, causing the shared edge rules to render the card's anodized edge. When the prop is omitted or negative (the insufficient-data sentinel), the shell SHALL set neither the property nor the class, and the card SHALL render identically to a card without the feature. Games without an equipment score SHALL simply not pass the prop.

#### Scenario: Scored card wears its ramp colour

- **WHEN** `GameCardShell` receives `temperScore={92}`
- **THEN** the `.game-card` root has the `has-temper-edge` class and an inline `--temper` equal to the shared gradient colour at 92% investment

#### Scenario: Sentinel and absence fall back neutrally

- **WHEN** `GameCardShell` receives `temperScore={-1}` or no `temperScore` at all
- **THEN** the root has no `has-temper-edge` class and no inline `--temper`, rendering as before the feature existed

#### Scenario: Colour comes from the shared gradient

- **WHEN** the inline `--temper` value is compared with `getProgressStyle(score, 0, 100).color`
- **THEN** they are identical, so the edge, the score badge grades, and the investment sliders all speak the same ramp
