## Purpose

Static catalog of Zenless Zone Zero Bangboos — companion units picked once per party. Covers the catalog entry shape, rarity handling, ordering, and the ImageKit icon resolver.

## ADDED Requirements

### Requirement: Bangboo catalog

The system SHALL provide a static Bangboo catalog at `src/data/zenless-zone-zero/bangboos.ts` exporting a `ZzzBangboo` interface and an `ALL_ZZZ_BANGBOOS` array. Each entry SHALL carry a stable string `id` (the HoyoLab wiki entry id), the English display `name`, a `rarity` of `'S' | 'A' | null` (null where the source leaves the Bangboo untagged), and a local `imageUrl` under `/assets/zenless-zone-zero/bangboos/`. The array SHALL be ordered rarity S first, then A, then untagged, alphabetically by name within each band.

#### Scenario: Catalog entries carry rarity where known

- **WHEN** the catalog is generated from a source entry tagged with a Bangboo rarity
- **THEN** the entry's `rarity` is `'S'` or `'A'` accordingly

#### Scenario: Untagged rarity is null, not guessed

- **WHEN** the source provides no rarity tag for a Bangboo (e.g. Booltergeist)
- **THEN** the catalog entry's `rarity` is `null` and the Bangboo still appears in the catalog

#### Scenario: Ordering

- **WHEN** the catalog file is regenerated
- **THEN** S-rank Bangboos precede A-rank, untagged entries come last, and each band is sorted alphabetically by name

### Requirement: Bangboo icon resolver

The system SHALL resolve Bangboo icons through an ImageKit URL helper that applies a plain width resize (`tr:w-128` — wiki icons are already square art, no crop) and SHALL fall back to the raw local path when ImageKit is not configured.

#### Scenario: ImageKit configured

- **WHEN** the helper is called with a Bangboo `imageUrl` and ImageKit is configured
- **THEN** it returns an ImageKit URL with the `tr:w-128` transform over the mapped `/zenless_zone_zero/bangboos/` path

#### Scenario: ImageKit not configured

- **WHEN** ImageKit is not configured
- **THEN** the helper returns the local path unchanged

### Requirement: Bangboo catalog is generated, not hand-authored

`src/data/zenless-zone-zero/bangboos.ts` SHALL be produced exclusively by the update script and SHALL never be hand-edited, per the repo-wide `src/data` rule.

#### Scenario: Catalog change needed

- **WHEN** a Bangboo's catalog data is wrong or missing
- **THEN** the fix is made in `scripts/update-zzz-data.mjs` (or its source mapping) and the file regenerated — never by editing `bangboos.ts` directly
