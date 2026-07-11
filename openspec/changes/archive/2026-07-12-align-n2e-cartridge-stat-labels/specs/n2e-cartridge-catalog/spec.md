## ADDED Requirements

### Requirement: Cartridge stat labels match in-game display

The system SHALL name N2E cartridge stats using the game's in-game display text, not the raw everness.info API strings. The update pipeline SHALL apply an explicit rename map (`N2E_STAT_RENAME` in `scripts/lib/statOrder.mjs`) to each fetched stat label before generating `cartridge-stats.ts`, so `CARTRIDGE_MAIN_STATS` and `CARTRIDGE_SUB_STATS` carry the in-game labels.

The rename SHALL follow these rules: a percentage of a flat stat keeps a tight `%` (`ATK%`, `HP%`, `DEF%`); every other percentage stat drops the trailing `%` (`CRIT Rate`, `CRIT DMG`, `Healing Bonus`, and every `… DMG Bonus`); flat `ATK`/`HP`/`DEF`, `Break Intensity`, and `Cycle Intensity` are unchanged.

#### Scenario: Labels generated in in-game form

- **WHEN** the update script runs and the `mainStatCore` / `subStats` queries return the everness.info strings (e.g. `Cosmos DMG Bonus %`, `ATK %`, `CRIT Rate %`, `Healing Bonus %`)
- **THEN** `cartridge-stats.ts` is written with the in-game labels (`Cosmos DMG Bonus`, `ATK%`, `CRIT Rate`, `Healing Bonus`)

#### Scenario: Unmapped stat surfaces for manual placement

- **WHEN** the API returns a stat label absent from `N2E_STAT_RENAME`
- **THEN** the label passes through unchanged, and if it is also absent from `N2E_STAT_ORDER` it sorts to the end and trips the `unlistedStats` warning

### Requirement: Legacy stat labels remapped on load

The system SHALL remap N2E cartridge stat strings persisted under the old everness.info labels to the in-game labels when loading tracked characters from the DB, so existing saved builds match the current option lists, the scorer vocabulary, and the Target Build readout. The remap SHALL cover the equipped main stat, each equipped sub stat, and every preference-chain entry (main and sub).

#### Scenario: Legacy-labelled row surfaces in in-game labels

- **WHEN** a tracked-character row stores `cartridge_main_stat = 'Cosmos DMG Bonus %'`, a `cartridge_sub_stats` entry `'HP %'`, and a preference-chain entry `'CRIT Rate %'`
- **THEN** the loaded character exposes `cartridgeMainStat = 'Cosmos DMG Bonus'`, sub stat `'HP%'`, and preference entry `'CRIT Rate'`

#### Scenario: Current-labelled row unaffected

- **WHEN** a row already stores in-game labels
- **THEN** the remap is an identity pass and the values are unchanged
