# shared-design-tokens Specification

## Purpose

The L1 design-token discipline. Tokens are the single source of truth for colour, spacing, radius,
shadow, transition, duration, and z-index values; `src/styles/tokens.css` is compiled from
`src/styles/design-tokens.json` by Style Dictionary and never hand-edited; game-specific colours
live under a per-game `color.{gameId}` group; token names use their canonical form; and
`--duration-*` (animation) is kept distinct from `--transition-*` (transition). Documents the
rules for using tokens, not an enumeration of token values.

## Requirements

### Requirement: Design tokens are the single source of truth

Component CSS SHALL reference design tokens for all colour, spacing, radius, shadow, transition,
duration, and z-index values rather than hardcoded literals. When a needed token does not exist,
it SHALL be added to `src/styles/design-tokens.json` first and compiled before use — never
introduced as a one-off literal. The only sanctioned literal exceptions are the glass/overlay
`rgba()` fills the token layer cannot yet express (documented in CLAUDE.md).

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

### Requirement: Duration and transition tokens are distinct

`--duration-*` tokens SHALL be used for `animation` durations (time only); `--transition-*` tokens
SHALL be used for CSS `transition` properties (time plus easing). The two SHALL NOT be used
interchangeably.

#### Scenario: Animating vs transitioning

- **WHEN** a rule sets an `animation` duration
- **THEN** it uses a `--duration-*` token; **WHEN** a rule sets a `transition`, it uses a
  `--transition-*` token
