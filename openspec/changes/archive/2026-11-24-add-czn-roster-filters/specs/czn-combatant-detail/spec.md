## ADDED Requirements

### Requirement: CZN roster filter facets

The CZN roster toolbar SHALL declare three filter facets and one bare chip — eight chips — through the shared `roster-predicate-filter` pattern (off by default, page-local, composing with search and sort), in the card's Level → Potential → Partner → Fragments order, with the predicates and copy in the scenarios below. Manifest Ego and Partner Manifest Ego (dupe-bound) and class, attribute, and rarity (covered by search) have no chip.

#### Scenario: Rows render in card order

- **WHEN** the CZN roster view renders with tracked combatants
- **THEN** the filter block shows, top to bottom, a "Level" row holding `Under Lv 60`, `Awakening`; an unlabelled row holding `Not attained`; a "Partner" row holding `None equipped`, `Under Lv 60`, `Off-build`; and a "Fragments" row holding `Open slots`, `No build`

#### Scenario: No chips without tracked combatants

- **WHEN** no combatants are tracked
- **THEN** no filter block, facet row, or chip is rendered

#### Scenario: Level facet renders as a joined segment

- **WHEN** the filter block renders
- **THEN** the Level chips render as one joined segmented pill, while the Partner and Fragments chips render as spaced pills with a vertical divider between `None equipped` and `Under Lv 60`

#### Scenario: Under Lv 60 level chip narrows roster

- **WHEN** user activates Level `Under Lv 60`
- **THEN** only combatants with `level < 60` are shown, and the single-chip no-match copy is `No combatants below Lv 60.`

#### Scenario: Awakening chip narrows roster

- **WHEN** user activates Level `Awakening`
- **THEN** only combatants at Lv 60 or 61 (Unconscious Awakening pending) are shown; combatants below 60 or at 62 are excluded, and the single-chip no-match copy is `No combatants with Awakening pending.`

#### Scenario: Level chips are mutually exclusive

- **WHEN** Level `Under Lv 60` is active and user activates `Awakening`
- **THEN** `Awakening` becomes active and `Under Lv 60` becomes inactive in the same update

#### Scenario: Potential chip narrows roster

- **WHEN** user activates `Not attained`
- **THEN** only combatants whose Potential is not attained are shown, and the single-chip no-match copy is `No combatants with Potential pending.`

#### Scenario: Partner none-equipped chip narrows roster

- **WHEN** user activates Partner `None equipped`
- **THEN** only combatants with no Partner equipped are shown, and the single-chip no-match copy is `No combatants without a Partner.`

#### Scenario: Partner level chip narrows roster

- **WHEN** user activates Partner `Under Lv 60`
- **THEN** only combatants with a Partner equipped below Lv 60 are shown; combatants with no Partner are excluded, and the single-chip no-match copy is `No combatants with a Partner below Lv 60.`

#### Scenario: Partner off-build chip narrows roster

- **WHEN** user activates Partner `Off-build`
- **THEN** only combatants with a Partner equipped, a non-empty preferred-Partners list, and an equipped Partner absent from that list are shown; a combatant running any listed Partner, with an empty list, or with no Partner is excluded, and the single-chip no-match copy is `No combatants with an off-build Partner.`

#### Scenario: Partner none-equipped is exclusive

- **WHEN** Partner `Under Lv 60` and `Off-build` are active and user activates `None equipped`
- **THEN** `None equipped` becomes active and both other Partner chips become inactive in the same update; activating either of them afterwards deactivates `None equipped`

#### Scenario: Partner threshold chips intersect

- **WHEN** Partner `Under Lv 60` and `Off-build` are both active
- **THEN** only combatants matching both are shown

#### Scenario: Fragments open-slots chip narrows roster

- **WHEN** user activates Fragments `Open slots`
- **THEN** only combatants with fewer than six Memory Fragment slots equipped are shown, and the single-chip no-match copy is `No combatants with open fragment slots.`

#### Scenario: Fragments no-build chip agrees with the score

- **WHEN** user activates Fragments `No build`
- **THEN** only combatants with no slot IV–VI main-stat chain, no substat chain, and no target set are shown — the same test the fragment scorer uses for its insufficient-data sentinel — and the single-chip no-match copy is `No combatants without a fragment Target Build.`

#### Scenario: Chips across facets compose as AND

- **WHEN** Level `Awakening` and Partner `None equipped` are both active and no combatant matches both
- **THEN** the roster shows `No combatants match the active filters.`
