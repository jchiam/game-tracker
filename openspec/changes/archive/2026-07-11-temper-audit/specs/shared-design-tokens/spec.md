# shared-design-tokens Delta

## MODIFIED Requirements

### Requirement: Design tokens are the single source of truth

Component CSS SHALL reference design tokens for all colour, spacing, radius, shadow, transition,
duration, and z-index values rather than hardcoded literals. When a needed token does not exist,
it SHALL be added to `src/styles/design-tokens.json` first and compiled before use — never
introduced as a one-off literal. When a rule needs a token's hue at reduced opacity, it SHALL
derive it via `color-mix(in srgb, var(--token) X%, transparent)` rather than hardcoding an
`rgba()` literal. The only sanctioned literal exceptions are the neutral (white/black)
glass/overlay `rgba()` fills, which carry no token hue (documented in CLAUDE.md); a translucent
glass surface that should read as the app ground SHALL derive from `--color-bg-base` via
`color-mix` rather than approximating the ground's hue as an `rgba()` literal.

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

#### Scenario: Glass surface tracks the ground

- **WHEN** a translucent surface should read as the app ground at reduced opacity (a badge fill,
  an overlay stop, a body wash)
- **THEN** it is written `color-mix(in srgb, var(--color-bg-base) N%, transparent)` — or a true
  neutral black/white `rgba()` where pure darkening/lightening is intended — never an `rgba()`
  literal that approximates the ground's hue
