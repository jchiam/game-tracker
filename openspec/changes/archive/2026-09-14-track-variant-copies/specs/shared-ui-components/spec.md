## ADDED Requirements

### Requirement: Stepper renders a bounded integer control

The system SHALL provide a shared `Stepper` component (`src/components/Stepper.tsx`, styles in `src/styles/controls.css`) rendering a `role="group"` named by `label`, a decrement button, a `.stepper-value` readout of `value`, and an increment button. Props: `label`, `value` (integer), `onChange((next: number) => void)`, optional `min` (default `0`), optional `max`, optional `disabled`, optional `size` (`'md' | 'compact'`), optional `className`. The buttons SHALL be self-styled `.stepper-btn` elements (no `.btn`), SHALL carry `aria-label` "Decrease {label}" / "Increase {label}", and SHALL be disabled when the step would cross `min` / `max` or when `disabled` is set. Clicking SHALL emit `value - 1` / `value + 1` and never mutate `value` itself. A Storybook story SHALL cover default, at-min, at-max, compact, and disabled states, and `ControlPatterns` SHALL list the control.

#### Scenario: Increment

- **WHEN** a stepper at `value 1` has its increment clicked
- **THEN** `onChange(2)` is emitted once

#### Scenario: Lower bound

- **WHEN** a stepper is at `value 0` with default `min`
- **THEN** the decrement button is disabled and clicking it emits nothing

#### Scenario: Upper bound

- **WHEN** a stepper with `max 3` is at `value 3`
- **THEN** the increment button is disabled

#### Scenario: Accessible naming

- **WHEN** a stepper with label "Sealed" renders
- **THEN** the group is named "Sealed" and its buttons are named "Decrease Sealed" and "Increase Sealed"
