# Spec Delta

## MODIFIED Requirements

### Requirement: Combatant card composition

The combatant card SHALL be composed from the shared Game Card Shell: header portrait with favorite/remove/edit controls, class and element badges, a rarity indicator (4★/5★), a collapsed summary of level, Ego rank, and Potential state, a Partner summary line (see `czn-partner-tracking`), and edit sections for Level (slider 1–62), Manifest Ego (rung control), Potential (toggle), Partner, and Preferred Partners, in that order. The card SHALL NOT re-implement shell mechanics.

#### Scenario: Card renders shell slots

- **WHEN** a tracked combatant renders in the roster grid
- **THEN** the card shows portrait, rarity indicator, class + element badges, the collapsed summary of level, Ego (`T` prefix), and Potential attained/not, and the Partner summary line

#### Scenario: Edit mode sections

- **WHEN** user toggles the card into edit mode
- **THEN** Level, Manifest Ego, Potential, Partner, and Preferred Partners controls are shown in that order
