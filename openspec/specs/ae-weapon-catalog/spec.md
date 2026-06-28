## Purpose

Static, hand-authored catalog of Arknights: Endfield weapons (`ALL_WEAPONS`). Defines the `AeWeapon` interface, the exact-match contract between a weapon's `type` and an operator's intrinsic `weapon` class (the join key for class-filtered weapon pickers), and the manual maintenance procedure used until the AE data pipeline absorbs it.

## Requirements

### Requirement: Weapon catalog data file

The system SHALL maintain a static catalog of AE weapons in
`src/data/arknights-endfield/weapons.ts`, exporting an `AeWeapon` interface and a
`const ALL_WEAPONS: AeWeapon[]`. Like `operators.ts`, this file is hand-authored
(no structured AE data source exists yet) and its header SHALL state that it is
manually maintained.

Each entry SHALL have the fields: `id` (string, kebab-case slug), `name` (string,
display name), `rarity` (numeric star rating), and `type` (string — the weapon
class, e.g. `Sword`, `Greatsword`, `Polearm`, `Handcannon`, `Arts Unit`). No `imageUrl` field is
defined in this iteration; weapons are surfaced by name and rarity only.

#### Scenario: Catalog accessible at runtime

- **WHEN** any component imports `ALL_WEAPONS` from `@/data/arknights-endfield/weapons`
- **THEN** the full array of `AeWeapon` entries is available with `id`, `name`, `rarity`, and `type` fields

#### Scenario: Initial catalog scope

- **WHEN** the catalog is first authored
- **THEN** it contains the full known launch weapon list across all weapon classes

### Requirement: Weapon type matches operator weapon class

Each weapon's `type` SHALL exactly string-match the value space of
`AeOperator.weapon` (the operator's intrinsic weapon class). This exact-match
contract is the join key that powers class-filtered weapon pickers: a weapon with
`type: 'Sword'` is equippable only on operators whose `weapon` is `'Sword'`.

#### Scenario: Type aligns with operator class vocabulary

- **WHEN** a weapon is added to `ALL_WEAPONS`
- **THEN** its `type` is one of the exact strings used by `AeOperator.weapon` (`Sword`, `Greatsword`, `Polearm`, `Handcannon`, `Arts Unit`), with no casing or spacing drift

#### Scenario: Picker resolves equippable weapons by exact match

- **WHEN** the operator card filters `ALL_WEAPONS` for an operator
- **THEN** the equippable set is exactly `ALL_WEAPONS.filter(w => w.type === operator.weapon)`

### Requirement: Manual weapon catalog maintenance

The system SHALL support updating the weapon catalog by hand using a documented,
repeatable procedure, because no structured AE data source exists yet. To add or
update a weapon, a maintainer SHALL source the weapon's attributes (name, rarity,
weapon class) from a community Endfield database, choose a kebab-case `id`, and add
or edit the entry in `ALL_WEAPONS` with a `type` that exactly matches an existing
`AeOperator.weapon` value. Automating this is the same tech debt tracked by the
`add-ae-data-pipeline` change, which will eventually absorb the weapon catalog
alongside the operator catalog.

#### Scenario: Adding a new weapon

- **WHEN** a new weapon ships in a game patch
- **THEN** the maintainer adds the entry to `ALL_WEAPONS` with a `type` matching the operator weapon-class vocabulary; no image step is required in this iteration

#### Scenario: Weapon class has no entries

- **WHEN** an operator's weapon class has no matching `ALL_WEAPONS` entries
- **THEN** the operator's weapon picker shows only the "No Weapon" option, and the card renders the empty gear one-liner
