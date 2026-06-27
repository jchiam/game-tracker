# shared-animations Specification

## Purpose

TBD - created by archiving change bootstrap-shared-animations. Update Purpose after archive.

## Requirements

### Requirement: Shared keyframes defined exactly once

The shared animation keyframes SHALL be defined exactly once, in `src/styles/animations.css`:
`fade-in-up`, `fade-in-down`, `fade-in`, `slide-in-down`, `slide-up`, `toast-slide-in`,
`saving-toast-pulse`, `spinner-bounce`, and `pulse-warn`. Component and game stylesheets SHALL NOT
declare their own copy of any of these keyframes.

#### Scenario: A consumer reuses a shared keyframe

- **WHEN** a component or game style applies one of the shared animations (e.g. `animation:
fade-in-up …`)
- **THEN** the keyframe resolves from the single definition in `animations.css`, not from a local
  copy

#### Scenario: No duplicate keyframe definitions remain

- **WHEN** the codebase is searched for `@keyframes` outside `src/styles/animations.css`
- **THEN** none is found — `animations.css` is the sole source for shared keyframes

### Requirement: Keyframes are globally imported and route-independent

The shared keyframes SHALL be available on every route without depending on any route-split bundle,
because `animations.css` is imported globally via `src/index.css`. A keyframe used by one game's
card SHALL resolve on a cold load of any other route.

#### Scenario: Keyframe resolves on a cold route load

- **WHEN** a card or component that uses a shared animation is rendered on a cold load of its route
- **THEN** the keyframe resolves from the globally-imported `animations.css`, independent of any
  other route's CSS

### Requirement: Components reference shared keyframes by name

Components and game styles SHALL consume shared animations by referencing the canonical keyframe
name in their `animation` shorthand, contributing only the timing, easing, iteration, and fill
parts. They SHALL NOT inline an equivalent `@keyframes` to achieve the same motion.

#### Scenario: Animation applied by reference

- **WHEN** `Modal.css` animates its entrance
- **THEN** it sets `animation: slide-up …` referencing the shared keyframe, with its own
  duration/easing/fill, and defines no local `slide-up` keyframe

### Requirement: Animation-duration tokens are owned by shared-design-tokens

The rule that animation `duration` values use `--duration-*` tokens SHALL remain owned by the
`shared-design-tokens` capability; this capability references that rule and SHALL NOT redeclare it.
Migration of remaining hardcoded duration literals in animation consumers is tracked there, not
here.

#### Scenario: Duration rule is not duplicated

- **WHEN** this capability is reviewed against `shared-design-tokens`
- **THEN** the `--duration-*` usage rule appears only as a cross-reference here, with the canonical
  requirement living in `shared-design-tokens`
