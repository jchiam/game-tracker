# czn-combatant-catalog delta

## MODIFIED Requirements

### Requirement: Combatant catalog data file

The system SHALL maintain a static catalog of CZN Combatants in `src/data/chaos-zero-nightmare/combatants.ts`, exporting a `CznCombatant` interface and `const ALL_CZN_COMBATANTS: CznCombatant[]`. Each entry SHALL have `id` (the kebab-case slug of the name, equal to the Prydwen slug, e.g. `mei-lin`), `name`, `rarity` (`4 | 5`), `class` (string), `element` (string, the in-game Attribute), `faction` (string or `null`, raw source text), and `imageUrl` (`/assets/chaos-zero-nightmare/combatants/{id}.webp`).

#### Scenario: Catalog accessible at runtime

- **WHEN** any component imports `ALL_CZN_COMBATANTS` from `@/data/chaos-zero-nightmare/combatants`
- **THEN** the full array of `CznCombatant` entries is available with `id`, `name`, `rarity`, `class`, `element`, `faction`, and `imageUrl` fields

#### Scenario: Slug is the stable key

- **WHEN** the update script maps a Game8 collection item
- **THEN** `id` is `slugify(name, '-')`, which equals the unit's Prydwen slug, so tracked rows keyed on it survive catalog regeneration and overlay hand-off

### Requirement: Overlay seed for combatants the source lacks

The system SHALL maintain a hand-curated overlay seed at `scripts/seeds/czn-combatants.json`: a JSON array of released combatants Game8 does not list yet (normally empty). Each entry SHALL carry `id`, `name`, `rarity` (`4 | 5`), `class`, `element`, plus `imageSource` (an https URL or `null`) and MAY carry `faction` and a free-text `note`. `id` SHALL be the kebab-case slug of `name`, the id the script mints for the Game8 entry. `class` and `element` SHALL use the vocabulary already present in the generated catalog.

#### Scenario: Seed entry reaches the catalog

- **WHEN** the seed holds an entry whose `id` is absent from the fetched list
- **THEN** the regenerated catalog contains that entry after the fetched entries, mapped to the `CznCombatant` shape

#### Scenario: Upstream wins on collision

- **WHEN** the fetched list contains an id that also appears in the seed
- **THEN** the fetched entry is emitted, the seed entry is ignored, and the run warns naming the shadowed seed entry so it can be deleted by hand

#### Scenario: Invalid seed aborts the run

- **WHEN** a seed entry is missing a required field, has a non-kebab-case or duplicate `id`, an `id` that is not the slug of its `name`, a rarity other than 4 or 5, or an `imageSource` that is neither an https URL nor `null`
- **THEN** the script exits non-zero naming the seed and entry before any codegen or upload
