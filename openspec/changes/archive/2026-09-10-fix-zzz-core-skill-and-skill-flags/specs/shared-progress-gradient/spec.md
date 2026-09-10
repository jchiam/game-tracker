## ADDED Requirements

### Requirement: Gradient utility provides a reduced-strength preview style set

The shared progress-gradient utility SHALL provide a preview variant of its style set, for surfaces
that must render a not-yet-committed state — such as the rungs a click would add to a cumulative
ladder. The preview variant SHALL be derived from the same interpolated hue as the normal style set
for the same value and range, differing only in strength: its border and active-background opacities
SHALL be lower than the normal set's, so a previewed surface reads as weaker than a committed one
while unmistakably belonging to the same ramp. Consumers SHALL obtain preview colours from this
utility and SHALL NOT mix their own alphas from a returned colour string.

#### Scenario: Preview shares the committed hue

- **WHEN** the preview variant and the normal style set are requested for the same value and range
- **THEN** both are derived from the same interpolated `r,g,b`

#### Scenario: Preview is weaker than committed

- **WHEN** the preview variant is returned for any value
- **THEN** its border and active-background opacities are lower than those of the normal style set
  for the same value

#### Scenario: Preview respects clamping and degenerate ranges

- **WHEN** the preview variant is requested with a value outside `[min, max]`, or with `min === max`
- **THEN** it clamps and degenerates identically to the normal style set, so the two never disagree
  about which anchor applies

#### Scenario: Consumers do not derive their own preview alphas

- **WHEN** the codebase is searched for preview-state colouring
- **THEN** preview colours come from this utility, and no consumer constructs its own reduced-alpha
  variant of a returned colour
