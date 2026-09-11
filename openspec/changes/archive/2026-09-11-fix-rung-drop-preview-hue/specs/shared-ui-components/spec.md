## MODIFIED Requirements

### Requirement: Cumulative rows preview the prerequisite range on hover and focus

Under `fill="cumulative"`, pointing at or keyboard-focusing a rung SHALL NOT highlight that rung in
isolation; it SHALL preview the entire range from the first rung, making the prerequisite chain
visible before the click commits. Given the selected rung `s` and the hovered-or-focused rung `h`:
when `h` is above `s`, the rungs above `s` up to and including `h` SHALL render in an **added**
preview state distinct from both attained and unattained, showing what would be gained; when `h` is
below `s`, the rungs above `h` up to and including `s` SHALL render in a **dropped** preview state,
showing what would be given up; when `h` is the selected rung and `allowDeselect` is set, the whole
attained run SHALL render in the dropped preview state, because the click clears it. Moving the
pointer off the row, or moving focus away, SHALL restore the resting state. Clicking a rung SHALL
clear the active hover/focus preview, so the click's result renders in its committed state
immediately — the pointer resting on the just-clicked rung SHALL NOT re-trigger a preview until it
leaves and re-enters. Keyboard focus SHALL produce the same preview as pointer hover, so the
affordance is not pointer-only. The resting cumulative ramp SHALL communicate the attained run on
its own, so no information is lost on input devices without hover.

#### Scenario: Upgrade preview

- **WHEN** rung 3 of 6 is selected and the pointer enters rung 5
- **THEN** rungs 1–3 stay attained, rungs 4–5 render in the added preview state, and rung 6 stays
  unattained

#### Scenario: Downgrade preview

- **WHEN** rung 5 of 6 is selected and the pointer enters rung 2
- **THEN** rungs 1–2 stay attained and rungs 3–5 render in the dropped preview state

#### Scenario: Hovering the selected rung previews clearing

- **WHEN** `allowDeselect` is set, rung 4 is selected, and the pointer enters rung 4
- **THEN** rungs 1–4 all render in the dropped preview state

#### Scenario: No isolated single-rung hover

- **WHEN** the pointer enters any rung of a cumulative row
- **THEN** no rung renders a highlight that is independent of the range from the first rung

#### Scenario: Clicking renders the committed result at once

- **WHEN** the pointer hovers rung 5 of 6 and clicks it to select
- **THEN** the preview clears with the click and rungs 1–5 render attained immediately, with no
  dropped-preview flash on the run while the pointer still rests on rung 5

#### Scenario: Leaving the row restores the resting state

- **WHEN** the pointer leaves the row or focus moves off it
- **THEN** every rung returns to its attained or unattained resting rendering

#### Scenario: Keyboard focus previews identically

- **WHEN** a rung receives keyboard focus
- **THEN** the same range preview renders as when that rung is hovered
