## ADDED Requirements

### Requirement: Companion slot

The shared party editor and card SHALL support an optional party-level companion pick: a single entity chosen from a separate companion catalog (not the game's roster entities), configured per game on `PartyViewConfig`. The companion is persisted as a single nullable party-level field (`Party.companionId`, one DB column on the parties table) — never as a member row, so member slot constraints are untouched. Games whose config omits the companion slot SHALL behave exactly as before.

#### Scenario: Games without companion config unchanged

- **WHEN** a game's `PartyViewConfig` declares no companion slot
- **THEN** the editor, card, and save payload are identical to prior behaviour, and `companionId` is never sent

#### Scenario: Companion picked in editor

- **WHEN** the user activates the companion slot in the party editor and selects an entry from the companion picker
- **THEN** the slot shows the selected companion's image and name, and saving the party persists its id as the party-level companion field

#### Scenario: Companion picker searches the companion catalog

- **WHEN** the companion slot is active and the user types a search term
- **THEN** the picker lists only companion-catalog entries matching the term by name — roster entities never appear in the companion picker, and companions never appear in member slot pickers

#### Scenario: Companion cleared

- **WHEN** the user removes the companion from its slot and saves
- **THEN** the party persists with a null companion field

#### Scenario: Companion round-trips

- **WHEN** a party saved with a companion is reloaded from the DB
- **THEN** `companionId` is populated and the editor and card show that companion

#### Scenario: Companion tile on party card

- **WHEN** a party card renders for a game with a companion slot configured
- **THEN** the card shows a labelled companion tile alongside the member avatars — the companion's avatar and name when set, an empty slot placeholder when unset

#### Scenario: ZZZ Bangboo wiring

- **WHEN** the ZZZ parties tab renders
- **THEN** the companion slot is labelled "Bangboo", its picker lists the Bangboo catalog, and the persisted field maps to the `bangboo_id` column on `zzz_parties`
