## Purpose

Consistent display-time sort order for AE weapon lists. Users scan for high-rarity weapons first, so all user-facing weapon pickers sort by rarity descending then name ascending — without modifying the static catalog's editorial order.

## Requirements

### Requirement: Weapon display sort order convention

All user-facing weapon lists in the Arknights: Endfield module SHALL be sorted by rarity descending (6★ → 3★), then name ascending (alphabetical, locale-aware) within the same rarity tier.

This applies to weapon equip dropdowns, weapon preference pickers, and any future UI presenting a list of weapons for user selection.

#### Scenario: Equip dropdown order

- **WHEN** the operator card renders the weapon equip `<select>`
- **THEN** options appear sorted by rarity descending, then name ascending within same rarity
- **AND** "No Weapon" remains the first option above the sorted list

#### Scenario: Preference picker order

- **WHEN** the operator card renders the preferred-weapons `PreferenceChain` options
- **THEN** available weapons appear in the same rarity-desc/alpha-asc order

#### Scenario: Future weapon lists

- **WHEN** a new UI component displays a selectable list of AE weapons
- **THEN** it uses `sortWeaponsForDisplay` to apply the canonical sort

### Requirement: Shared sort utility

The system SHALL provide a `sortWeaponsForDisplay` function in `src/pages/arknights-endfield/components/weaponSort.ts` that accepts an `AeWeapon[]` and returns a new sorted array without mutating the input.

#### Scenario: Sort produces correct order

- **WHEN** `sortWeaponsForDisplay` is called with weapons of mixed rarities
- **THEN** the returned array is ordered by rarity descending, then name ascending within same rarity

#### Scenario: Input not mutated

- **WHEN** `sortWeaponsForDisplay` is called
- **THEN** the original array is unchanged

### Requirement: Static catalog order preserved

The `ALL_WEAPONS` array in `src/data/arknights-endfield/weapons.ts` SHALL retain its editorial order (grouped by type, rarity ascending within type). The display sort is applied at render time only.

#### Scenario: Catalog unaffected by display sort

- **WHEN** `sortWeaponsForDisplay` is used in a component
- **THEN** `ALL_WEAPONS` import order remains unchanged
