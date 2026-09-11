## REMOVED Requirements

### Requirement: Canonical cumulative-rung state treatments

**Reason**: The dropped-preview clause is inverted by this change — the treatment previously had to be neutral with no investment-gradient hue, which made the baseline ramp colour disappear during previews (and flash gray right after a click). Its "Dropped-preview rung carries no gradient hue" scenario asserts the old behaviour, so the requirement is replaced wholesale rather than modified.

**Migration**: Replaced by "Canonical cumulative-rung state treatments keep the ramp hue" below — identical except the dropped-preview treatment now keeps the rung's own gradient hue and distinguishes itself structurally (dimmed + dashed).

## ADDED Requirements

### Requirement: Canonical cumulative-rung state treatments keep the ramp hue

`src/styles/controls.css` SHALL define, exactly once, the state treatments a cumulative rung row
uses beyond the base `.toggle-btn` on/off appearance: an **attained** treatment, an **added-preview**
treatment for rungs a click would gain, and a **dropped-preview** treatment for rungs a click would
give up. The added-preview treatment SHALL be visually weaker than attained and stronger than
unattained, so a previewed range reads as a continuation of the attained run rather than as already
owned. The dropped-preview treatment SHALL keep the rung's own investment-gradient hue — the
baseline ramp colour never disappears during a preview — and SHALL distinguish itself from attained
structurally (reduced opacity and a dashed edge), so the range reads as fading away rather than
being repainted neutral. Game stylesheets SHALL NOT re-declare these treatments. All colour values
SHALL come from design tokens or from the shared investment gradient — never from hardcoded
literals — and every `transition` SHALL enumerate the properties its state variants actually change.

#### Scenario: Attained rung

- **WHEN** a rung renders as attained in a cumulative row
- **THEN** it carries the canonical attained treatment coloured by its own position on the shared
  investment gradient

#### Scenario: Added-preview rung ranks between attained and unattained

- **WHEN** a rung renders in the added-preview state
- **THEN** its treatment is weaker than the attained treatment and stronger than the unattained
  resting treatment, and it carries the gradient hue for its own position

#### Scenario: Dropped-preview rung keeps its gradient hue

- **WHEN** a rung renders in the dropped-preview state
- **THEN** it still carries the gradient hue for its own position, dimmed and dashed by the
  canonical structural treatment, and no rule repaints it with neutral colour overrides

#### Scenario: Treatments defined once

- **WHEN** the codebase is searched for the cumulative-rung state rules
- **THEN** they appear only in `src/styles/controls.css`, and no game stylesheet re-declares them
