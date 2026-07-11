# shared-design-tokens Delta

## ADDED Requirements

### Requirement: Typography role tokens are system-native

The token system SHALL define exactly three font-family role tokens — `typography.fontFamily.display` (headings, card names, section labels, grade letters), `typography.fontFamily.base` (body text), and `typography.fontFamily.data` (numeric readouts) — each as a stack of system-shipped typefaces terminating in a generic family. The app SHALL NOT load fonts from external origins: no font CDN `@import`/`<link>`, no `@font-face` fetching a remote URL, and no font hosts in the CSP. Numeric readouts styled with the data role SHALL also set `font-variant-numeric: tabular-nums` so digit columns align.

#### Scenario: No external font loading

- **WHEN** the app's stylesheets and CSP are inspected
- **THEN** no rule imports or links a font from an external origin, and `vercel.json`'s CSP contains no font-delivery hosts

#### Scenario: Numeral surface uses the data role

- **WHEN** a shared numeric readout (level value, stat-chip value, score badge) renders
- **THEN** its computed font-family comes from `--typography-font-family-data` and `font-variant-numeric: tabular-nums` is applied

#### Scenario: Display role reaches card names via shared CSS

- **WHEN** a roster card renders its `.game-card-name` or a `.section-header` label
- **THEN** the computed font-family comes from `--typography-font-family-display`, applied by shared stylesheets rather than per-game CSS

### Requirement: Temper ramp anchors are canonical named tokens

The four investment-gradient anchor colours SHALL live as the token group `color.temper.{rust,amber,gold,verdigris}` with values identical to the anchor stops fixed by `shared-progress-gradient` (`#8a6050`, `#c88040`, `#d4af37`, `#40c8a0`). Tokens that reuse an anchor colour (score-grade tokens, `color.brand.primary`) SHALL be Style Dictionary references to the temper group rather than repeated hex literals. Non-anchor ramp intermediates (e.g. grade C) MAY remain standalone literals.

#### Scenario: Grade token resolves through its anchor

- **WHEN** `design-tokens.json` defines `color.score.gradeS`
- **THEN** its value is a reference to `color.temper.verdigris`, and the compiled `--color-score-grade-s` equals `#40c8a0`

#### Scenario: Anchor values stay locked to the gradient spec

- **WHEN** the temper anchor tokens are compared against the `shared-progress-gradient` anchor stops
- **THEN** all four hex values are identical
