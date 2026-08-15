## ADDED Requirements

### Requirement: Mutually exclusive party members

The party editor SHALL support per-game exclusion groups: entities that share a non-null exclusion group key cannot co-exist in one party. The member picker SHALL hide entities whose exclusion group matches an already-selected member's group. Games that configure no exclusion groups SHALL behave exactly as before.

#### Scenario: Conflicting entity hidden from picker

- **WHEN** a party already contains an entity in exclusion group `trailblazer` and the user opens the member picker for another slot
- **THEN** all other entities in the `trailblazer` group are absent from the picker list

#### Scenario: Conflict cleared on removal

- **WHEN** the last member from an exclusion group is removed from the party
- **THEN** entities of that group reappear in the member picker

#### Scenario: Ungrouped entities unaffected

- **WHEN** a party contains an entity with no exclusion group
- **THEN** the picker excludes only that exact entity, and all other entities remain selectable

#### Scenario: Games without exclusion groups unchanged

- **WHEN** a game's party view config defines no exclusion groups
- **THEN** the member picker filters only exact duplicates, identical to prior behavior
