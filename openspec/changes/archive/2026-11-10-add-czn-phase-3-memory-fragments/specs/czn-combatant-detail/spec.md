# Spec Delta

## MODIFIED Requirements

### Requirement: Combatant card composition

The combatant card SHALL be composed from the shared Game Card Shell: header portrait with favorite/remove/edit controls, class and element badges, a rarity indicator (4★/5★), a build score badge in the header extra slot (hidden on the `-1` sentinel, see `czn-build-scoring`), a collapsed summary of level, Ego rank, and Potential state, a Partner summary line (see `czn-partner-tracking`), a Memory Fragment set digest line (see `czn-fragment-tracking`), and edit sections for Level (slider 1–62), Manifest Ego (rung control), Potential (toggle), Partner, Preferred Partners, and a labeled Memory Fragments group containing the six-cell slot grid and the gated Target Build readout, in that order. The card SHALL NOT re-implement shell mechanics.

#### Scenario: Card renders shell slots

- **WHEN** a tracked combatant renders in the roster grid
- **THEN** the card shows portrait, rarity indicator, class + element badges, the score badge when scored, the collapsed summary of level, Ego (`T` prefix), and Potential attained/not, the Partner summary line, and the set digest line

#### Scenario: Edit mode sections

- **WHEN** user toggles the card into edit mode
- **THEN** Level, Manifest Ego, Potential, Partner, Preferred Partners, and the Memory Fragments group (slot grid, then Target Build when preferences exist) are shown in that order
