# zzz-agent-catalog Specification

## Purpose

Generated catalog of Zenless Zone Zero Agents, consumed at runtime via `ALL_ZZZ_AGENTS`. Carries the Enka store's exact taxonomy — open element strings and specialties including Rupture — so new source vocabulary is data, not a code change.

## Requirements

### Requirement: Agent catalog data file

The system SHALL maintain a static catalog of ZZZ Agents in `src/data/zenless-zone-zero/agents.ts`, exporting a `ZzzAgent` interface and a `const ALL_ZZZ_AGENTS: ZzzAgent[]`. Each entry SHALL have: `id` (string, Enka avatar id, e.g. `1011`), `name` (string, English display name resolved from the Enka localization table), `rarity` (number, Enka rarity code — `4` = S, `3` = A), `specialty` (string, Enka `ProfessionType` verbatim, e.g. `Attack`, `Stun`, `Anomaly`, `Support`, `Defense`, `Rupture`), `element` (string, first Enka `ElementTypes` value verbatim), and `imageUrl` (string, local path `/assets/zenless-zone-zero/agents/{id}.png` — the untouched Enka original; display crops are on-the-fly CDN transforms, never baked into the asset).

#### Scenario: Catalog accessible at runtime

- **WHEN** any component imports `ALL_ZZZ_AGENTS` from `@/data/zenless-zone-zero/agents`
- **THEN** the full array of `ZzzAgent` entries is available with `id`, `name`, `rarity`, `specialty`, `element`, and `imageUrl` fields

#### Scenario: Source taxonomy stored verbatim

- **WHEN** the update script maps an Enka avatar
- **THEN** `specialty` and `element` carry the source values unmodified (e.g. `Elec`, `Physics`, `FireFrost`, `AuricEther`, `ZhenZhenAssault`, `Wind`, `Lumen` remain exact), so new source vocabulary is data, not a code change

### Requirement: Element and specialty presentation is data-driven

Element and specialty SHALL be typed as open `string` fields (never a closed union), and their badge colors and display labels SHALL come from lookup maps with a neutral fallback for unknown values. Display labels MAY rename source codes for readability (e.g. `Elec` → `Electric`, `Physics` → `Physical`) but the stored catalog value stays verbatim.

#### Scenario: Unknown element appears in a future update

- **WHEN** a future catalog regeneration introduces an element string with no badge-map entry
- **THEN** the agent card still renders, showing the raw string with the neutral fallback badge style — no code change is required to ship the data

#### Scenario: Display label mapping

- **WHEN** an agent with element `Elec` renders
- **THEN** the badge may display `Electric` while filters, search, and persistence continue to use the stored `Elec` value
