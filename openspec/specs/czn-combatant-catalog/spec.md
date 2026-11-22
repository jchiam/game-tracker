# czn-combatant-catalog Specification

## Purpose

Generated catalog of Chaos Zero Nightmare Combatants, consumed at runtime via `ALL_CZN_COMBATANTS`, carrying the source's class, attribute, and faction values verbatim (Game8's list, in the Prydwen spelling) so new source values are data, not code, under ids that never change once committed; plus the hand-curated overlay seed for combatants the source lags on.

## Requirements

### Requirement: Combatant catalog data file

The system SHALL maintain a static catalog of CZN Combatants in `src/data/chaos-zero-nightmare/combatants.ts`, exporting a `CznCombatant` interface and `const ALL_CZN_COMBATANTS: CznCombatant[]`. Each entry SHALL have `id` (the kebab-case slug of the name, equal to the Prydwen slug, e.g. `mei-lin`), `name`, `rarity` (`4 | 5`), `class` (string), `element` (string, the in-game Attribute), `faction` (string or `null`, raw source text), and `imageUrl` (`/assets/chaos-zero-nightmare/combatants/{id}.webp`).

#### Scenario: Catalog accessible at runtime

- **WHEN** any component imports `ALL_CZN_COMBATANTS` from `@/data/chaos-zero-nightmare/combatants`
- **THEN** the full array of `CznCombatant` entries is available with `id`, `name`, `rarity`, `class`, `element`, `faction`, and `imageUrl` fields

#### Scenario: Slug is the stable key

- **WHEN** the update script maps a Game8 collection item
- **THEN** `id` is `slugify(name, '-')`, which equals the unit's Prydwen slug, so tracked rows keyed on it survive catalog regeneration and overlay hand-off

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

### Requirement: Combatant face image

Each combatant SHALL have a square face image at `/assets/chaos-zero-nightmare/combatant-faces/{id}.webp`, derived from its `imageUrl` rather than stored in the catalog. `src/lib/imagekit.ts` SHALL provide `getCznCombatantFaceUrl`, which takes a combatant's `imageUrl` and returns the ImageKit URL of the face image with a width cap of 256 px that never upscales, falling back to the local face path when ImageKit is not configured. CZN party slots and the party member picker SHALL show this face image.

#### Scenario: Face path derived from the portrait path

- **WHEN** `getCznCombatantFaceUrl` is called with `/assets/chaos-zero-nightmare/combatants/haru.webp` and ImageKit is not configured
- **THEN** it returns `/assets/chaos-zero-nightmare/combatant-faces/haru.webp`

#### Scenario: Face served from ImageKit

- **WHEN** `getCznCombatantFaceUrl` is called with a combatant `imageUrl` and ImageKit is configured
- **THEN** it returns the ImageKit URL of the matching `chaos_zero_nightmare/combatant_faces` asset with a 256 px width cap that leaves smaller sources untouched

#### Scenario: Party slot shows the face

- **WHEN** a CZN party card or the party editor renders a filled slot
- **THEN** the slot image is the combatant's face image, not its full-body portrait

#### Scenario: Party picker shows the face

- **WHEN** the CZN party editor lists combatants to pick
- **THEN** each row's image is the combatant's face image

#### Scenario: Roster card keeps the portrait

- **WHEN** a CZN roster card renders
- **THEN** its header image is the combatant's portrait through the default mugshot crop
