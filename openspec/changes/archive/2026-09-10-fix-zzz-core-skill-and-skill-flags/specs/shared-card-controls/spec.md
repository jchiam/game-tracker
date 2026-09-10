## ADDED Requirements

### Requirement: Canonical cumulative-rung state treatments

`src/styles/controls.css` SHALL define, exactly once, the state treatments a cumulative rung row
uses beyond the base `.toggle-btn` on/off appearance: an **attained** treatment, an **added-preview**
treatment for rungs a click would gain, and a **dropped-preview** treatment for rungs a click would
give up. The added-preview treatment SHALL be visually weaker than attained and stronger than
unattained, so a previewed range reads as a continuation of the attained run rather than as already
owned. The dropped-preview treatment SHALL be neutral, carrying no investment-gradient hue, because
the hue is what the click removes. Game stylesheets SHALL NOT re-declare these treatments. All
colour values SHALL come from design tokens or from the shared investment gradient — never from
hardcoded literals — and every `transition` SHALL enumerate the properties its state variants
actually change.

#### Scenario: Attained rung

- **WHEN** a rung renders as attained in a cumulative row
- **THEN** it carries the canonical attained treatment coloured by its own position on the shared
  investment gradient

#### Scenario: Added-preview rung ranks between attained and unattained

- **WHEN** a rung renders in the added-preview state
- **THEN** its treatment is weaker than the attained treatment and stronger than the unattained
  resting treatment, and it carries the gradient hue for its own position

#### Scenario: Dropped-preview rung carries no gradient hue

- **WHEN** a rung renders in the dropped-preview state
- **THEN** its treatment uses neutral tokens only and carries no investment-gradient hue

#### Scenario: Treatments defined once

- **WHEN** the codebase is searched for the cumulative-rung state rules
- **THEN** they appear only in `src/styles/controls.css`, and no game stylesheet re-declares them

### Requirement: Base per-button hover is scoped away from cumulative rows

The base `.toggle-btn:hover` treatment highlights a single button, which contradicts the
prerequisite-range feedback a cumulative rung row requires. That base rule SHALL be scoped so it does
not apply to cumulative rows, rather than being neutralised inside cumulative rows by an override
that resets its properties. Non-cumulative toggle rows SHALL keep the base hover treatment unchanged.

#### Scenario: Cumulative row does not take the per-button hover

- **WHEN** the pointer enters a rung of a cumulative row
- **THEN** the base single-button hover treatment does not apply, and the row's range preview is the
  only hover feedback

#### Scenario: Existing toggle rows keep their hover

- **WHEN** the pointer enters a button in any non-cumulative toggle row
- **THEN** the base `.toggle-btn:hover` treatment applies exactly as before

#### Scenario: No property-reset opt-out

- **WHEN** the cumulative-row stylesheet is inspected
- **THEN** it contains no rule that neutralises the base hover by resetting its properties; the base
  rule is scoped at its own declaration instead
