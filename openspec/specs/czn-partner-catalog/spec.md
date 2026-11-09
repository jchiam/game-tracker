# czn-partner-catalog Specification

## Purpose

Generated catalog of Chaos Zero Nightmare Partners, consumed at runtime via `ALL_CZN_PARTNERS`, carrying Prydwen's exact class and faction vocabulary under ids minted from the Partner's name, plus the hand-curated overlay seed for Partners the source lags on.

## Requirements

### Requirement: Partner catalog data file

The system SHALL maintain a static catalog of CZN Partners in `src/data/chaos-zero-nightmare/partners.ts`, exporting a `CznPartner` interface and `const ALL_CZN_PARTNERS: CznPartner[]`. Each entry SHALL have `id` (kebab-case slug), `name`, `rarity` (`3 | 4 | 5`), `class` (string), `faction` (string or `null`, raw source text), and `imageUrl` (`/assets/chaos-zero-nightmare/partners/{id}.webp`). Entries SHALL be ordered by rarity descending, then name ascending.

#### Scenario: Catalog accessible at runtime

- **WHEN** any component imports `ALL_CZN_PARTNERS` from `@/data/chaos-zero-nightmare/partners`
- **THEN** the full array of `CznPartner` entries is available with `id`, `name`, `rarity`, `class`, `faction`, and `imageUrl` fields

#### Scenario: Three rarity tiers

- **WHEN** the catalog is regenerated from the current source
- **THEN** every entry's `rarity` is 3, 4, or 5 and a source rarity outside that set aborts the run

### Requirement: Partner id minted from the name

Because the source lists Partners without a slug and publishes no per-Partner pages, each Partner's `id` SHALL be the kebab-case slug of its `name` (e.g. `Akad` → `akad`, `Mei Lin` → `mei-lin`). The run SHALL abort on a duplicate minted id rather than emit two entries sharing one. Tracked rows and the overlay seed key on this id, so a Partner's `name` spelling is its stable identity.

#### Scenario: Id derived from name

- **WHEN** the update script maps a source Partner node named `Akad`
- **THEN** the emitted entry has `id: 'akad'`

#### Scenario: Two names slugify alike

- **WHEN** two source nodes would mint the same id
- **THEN** the script exits non-zero naming both Partners and the committed catalog is left unchanged

### Requirement: Partner class shares the combatant vocabulary

A Partner's `class` SHALL carry the source value unmodified as an open `string` and SHALL use the same spelling as `CznCombatant.class` (Striker, Vanguard, Ranger, Hunter, Psionic, Controller), because class equality is the join key that scopes a Combatant's Partner picker. `faction` SHALL be carried raw and is catalog-only.

#### Scenario: Class equality joins Partner to Combatant

- **WHEN** a Combatant with `class: 'Striker'` scopes its Partner options
- **THEN** exactly the catalog entries with `class === 'Striker'` are offered

#### Scenario: Unknown class in a future update

- **WHEN** a future regeneration introduces a class string with no combatant counterpart
- **THEN** the entry is emitted unchanged and is simply never offered to any Combatant until a Combatant carries that class

### Requirement: Overlay seed for Partners the source lacks

The system SHALL maintain a hand-curated overlay seed at `scripts/seeds/czn-partners.json`: a JSON array of Partners the source does not list. Each entry SHALL carry `id`, `name`, `rarity` (`3 | 4 | 5`), `class`, plus `imageSource` (an https URL or `null`) and MAY carry `faction` and a free-text `note`. `id` SHALL equal the kebab-case slug of `name`, so the entry hands off to the fetched one when the source adds the Partner. `class` SHALL use the combatant class vocabulary.

#### Scenario: Seed entry reaches the catalog

- **WHEN** the seed holds an entry whose `id` is absent from the fetched list
- **THEN** the regenerated catalog contains that entry, mapped to the `CznPartner` shape and sorted with the fetched entries

#### Scenario: Upstream wins on collision

- **WHEN** the fetched list mints an id that also appears in the seed
- **THEN** the fetched entry is emitted, the seed entry is ignored, and the run warns naming the shadowed seed entry so it can be deleted by hand

#### Scenario: Invalid seed aborts the run

- **WHEN** a seed entry is missing a required field, has a non-kebab-case or duplicate `id`, an `id` that is not the slug of its `name`, a rarity outside 3–5, or an `imageSource` that is neither an https URL nor `null`
- **THEN** the script exits non-zero naming the seed and entry before any codegen or upload

### Requirement: Partner catalog is generated, not hand-authored

`src/data/chaos-zero-nightmare/partners.ts` SHALL be produced exclusively by the update script and SHALL never be hand-edited, per the repo-wide `src/data` rule. Corrections go into the script's mapping or the overlay seed.

#### Scenario: Catalog change needed

- **WHEN** a Partner's catalog data is wrong or missing
- **THEN** the fix is made in `scripts/update-czn-data.mjs` or `scripts/seeds/czn-partners.json` and the file regenerated — never by editing `partners.ts` directly
