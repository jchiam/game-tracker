# czn-combatant-catalog Specification

## Purpose

Generated catalog of Chaos Zero Nightmare Combatants, consumed at runtime via `ALL_CZN_COMBATANTS`, carrying Prydwen's exact class, attribute, and faction vocabulary so new source values are data, not code; plus the hand-curated overlay seed for combatants the source lags on.

## Requirements

### Requirement: Combatant catalog data file

The system SHALL maintain a static catalog of CZN Combatants in `src/data/chaos-zero-nightmare/combatants.ts`, exporting a `CznCombatant` interface and `const ALL_CZN_COMBATANTS: CznCombatant[]`. Each entry SHALL have `id` (Prydwen slug, e.g. `mei-lin`), `name`, `rarity` (`4 | 5`), `class` (string), `element` (string, the in-game Attribute), `faction` (string or `null`, raw source text), and `imageUrl` (`/assets/chaos-zero-nightmare/combatants/{id}.webp`).

#### Scenario: Catalog accessible at runtime

- **WHEN** any component imports `ALL_CZN_COMBATANTS` from `@/data/chaos-zero-nightmare/combatants`
- **THEN** the full array of `CznCombatant` entries is available with `id`, `name`, `rarity`, `class`, `element`, `faction`, and `imageUrl` fields

#### Scenario: Slug is the stable key

- **WHEN** the update script maps a Prydwen node
- **THEN** `id` is the node's `slug`, so tracked rows keyed on it survive catalog regeneration and overlay hand-off

### Requirement: Source taxonomy stored verbatim

`class`, `element`, and `faction` SHALL carry the source values unmodified and SHALL be typed as open `string` fields (never closed unions). Badge colours and labels SHALL come from lookup maps with a neutral fallback for unknown values, so a new class or attribute ships as data.

#### Scenario: Known vocabulary

- **WHEN** the catalog is regenerated from the current source
- **THEN** `class` is one of Striker, Vanguard, Ranger, Hunter, Psionic, Controller and `element` is one of Passion, Order, Justice, Void, Instinct, stored exactly as the source spells them

#### Scenario: Unknown value appears in a future update

- **WHEN** a future regeneration introduces a class or attribute string with no badge-map entry
- **THEN** the combatant card still renders, showing the raw string with the neutral fallback badge style, with no code change required

#### Scenario: Faction carried but not surfaced

- **WHEN** a combatant entry has a `faction` value
- **THEN** the value is present in the catalog entry and is not rendered as a card badge or roster filter in this phase

### Requirement: Overlay seed for combatants the source lacks

The system SHALL maintain a hand-curated overlay seed at `scripts/seeds/czn-combatants.json`: a JSON array of combatants Prydwen does not list. Each entry SHALL carry `id`, `name`, `rarity` (`4 | 5`), `class`, `element`, plus `imageSource` (an https URL or `null`) and MAY carry `faction` and a free-text `note`. `id` SHALL be the slug the source will assign, in kebab-case. `class` and `element` SHALL use the source vocabulary already present in the generated catalog.

#### Scenario: Seed entry reaches the catalog

- **WHEN** the seed holds an entry whose `id` is absent from the fetched list
- **THEN** the regenerated catalog contains that entry after the fetched entries, mapped to the `CznCombatant` shape

#### Scenario: Upstream wins on collision

- **WHEN** the fetched list contains a slug that also appears in the seed
- **THEN** the fetched entry is emitted, the seed entry is ignored, and the run warns naming the shadowed seed entry so it can be deleted by hand

#### Scenario: Invalid seed aborts the run

- **WHEN** a seed entry is missing a required field, has a non-kebab-case or duplicate `id`, a rarity other than 4 or 5, or an `imageSource` that is neither an https URL nor `null`
- **THEN** the script exits non-zero naming the seed and entry before any codegen or upload
