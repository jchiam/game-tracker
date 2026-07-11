# shared-design-tokens Specification

## Purpose

The L1 design-token discipline. Tokens are the single source of truth for colour, spacing, radius,
shadow, transition, duration, and z-index values; `src/styles/tokens.css` is compiled from
`src/styles/design-tokens.json` by Style Dictionary and never hand-edited; game-specific colours
live under a per-game `color.{gameId}` group; token names use their canonical form;
`--duration-*` (animation) is kept distinct from `--transition-*` (transition); typography is
carried by three system-native font roles; and the temper ramp anchors are the canonical named
home of the investment-gradient colours. Documents the rules for using tokens, not an enumeration
of token values.

## Requirements

### Requirement: Design tokens are the single source of truth

Component CSS SHALL reference design tokens for all colour, spacing, radius, shadow, transition,
duration, and z-index values rather than hardcoded literals. When a needed token does not exist,
it SHALL be added to `src/styles/design-tokens.json` first and compiled before use — never
introduced as a one-off literal. When a rule needs a token's hue at reduced opacity, it SHALL
derive it via `color-mix(in srgb, var(--token) X%, transparent)` rather than hardcoding an
`rgba()` literal. The only sanctioned literal exceptions are the neutral (white/black)
glass/overlay `rgba()` fills, which carry no token hue (documented in CLAUDE.md).

#### Scenario: New value needs a token

- **WHEN** a component needs a colour/spacing/radius/shadow/transition value that no token
  expresses
- **THEN** the value is added to `design-tokens.json`, `npm run build:tokens` is run, and the CSS
  references the new `--*` variable — not a literal

#### Scenario: Existing component CSS is token-backed

- **WHEN** a shared or game stylesheet sets a colour, spacing, radius, shadow, transition,
  duration, or z-index
- **THEN** it references a `--color-*`, `--spacing-*`, `--border-radius-*`, `--shadow-*`,
  `--transition-*`, `--duration-*`, or `--z-index-*` token

### Requirement: Text-role tokens meet WCAG AA contrast

Readable-text tokens SHALL meet WCAG AA: `--color-text-primary`, `--color-text-secondary`, and
`--color-text-dim` SHALL each yield a contrast ratio of at least 4.5:1 (normal text) against
every app surface they render on (`--color-bg-base`, `--color-bg-surface`, `--color-bg-elevated`,
`--color-bg-surface-hover`, each composited over the base background). "Dim" is a de-emphasis step
below secondary, not a licence to drop below AA — de-emphasis SHALL be expressed by choosing a
lower-contrast-but-still-AA colour, not by alpha that lands under 4.5:1. Purely decorative glyphs
(dashed-slot plus signs, separator dots) MAY render below AA via an explicit local `opacity`,
keeping the token itself compliant.

#### Scenario: Dim text on an elevated surface

- **WHEN** de-emphasised text (inactive tab, preference label, placeholder hint) uses
  `--color-text-dim` on a modal or card surface
- **THEN** its computed contrast against that surface is ≥ 4.5:1

#### Scenario: Decorative glyph opts down locally

- **WHEN** a purely decorative glyph (e.g. an empty-slot `+`) should read fainter than AA
- **THEN** the rule applies a local `opacity` on top of the compliant token rather than
  introducing a sub-AA colour token

### Requirement: tokens.css is generated, never hand-edited

`src/styles/tokens.css` SHALL be compiled from `src/styles/design-tokens.json` by Style Dictionary
via `npm run build:tokens` (run automatically before `npm run build`). The generated `tokens.css`
SHALL NOT be hand-edited; token changes SHALL be made in the JSON source and recompiled.

#### Scenario: Token change flows through the build

- **WHEN** a token value must change
- **THEN** the edit is made in `design-tokens.json` and `tokens.css` is regenerated via
  `npm run build:tokens`, not edited directly

### Requirement: Game-specific colours are namespaced under color.{gameId}

Game-specific colours SHALL live under a per-game `color.{gameId}` group in `design-tokens.json`,
one group per game keyed by that game's short ID. Cross-game/shared colour groups SHALL remain
under their canonical top-level names (`bg`, `text`, `brand`, `ui`, `toast`, `tier`).

#### Scenario: A new game adds its palette

- **WHEN** a new game is wired into the app
- **THEN** its colours are added under a new `color.{gameId}` group, leaving the shared
  `bg`/`text`/`brand`/`ui`/`toast`/`tier` groups unchanged

### Requirement: Canonical token names only

Token names SHALL use their canonical, fully-qualified form — `--color-brand-primary` (not
`--color-primary`), `--border-radius-md` (not `--radius-md`). Abbreviated or aliased token names
SHALL NOT be introduced.

#### Scenario: Referencing a radius token

- **WHEN** CSS needs the medium border radius
- **THEN** it uses `--border-radius-md`, never a `--radius-md` alias

### Requirement: Transitions enumerate their animated properties

CSS `transition` declarations SHALL enumerate the specific properties their state variants
actually change (e.g. `transition: color var(--transition-fast), border-color
var(--transition-fast)`); the keyword `all` SHALL NOT be used. `transition: all` silently animates
every mutated property — including layout-affecting ones a later edit introduces — causing
unintended repaints and jank the author never reviewed.

#### Scenario: Hover rule transitions only what changes

- **WHEN** a selector's `:hover`/`.active`/`:focus` variants change only `color` and `background`
- **THEN** its `transition` lists exactly `color` and `background`, not `all`

#### Scenario: New animated property is added deliberately

- **WHEN** a later edit makes a state variant change an additional property (e.g. `transform`)
- **THEN** that property is appended to the `transition` list explicitly, keeping the animated
  set reviewed and intentional

### Requirement: Duration and transition tokens are distinct

`--duration-*` tokens SHALL be used for `animation` durations (time only); `--transition-*` tokens
SHALL be used for CSS `transition` properties (time plus easing). The two SHALL NOT be used
interchangeably.

#### Scenario: Animating vs transitioning

- **WHEN** a rule sets an `animation` duration
- **THEN** it uses a `--duration-*` token; **WHEN** a rule sets a `transition`, it uses a
  `--transition-*` token

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
