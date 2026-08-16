# zzz-data-pipeline Delta

## ADDED Requirements

### Requirement: Drive Disc suit catalog generation

The update script SHALL additionally fetch `store/zzz/equipments.json`, resolve suit display names from the English localization table via the suit's `Name` loc key, upload each suit icon (fetched from the Enka UI CDN at the suit's `Icon` path) to ImageKit under `zenless_zone_zero/disc-suits/{suitId}.png` via the shared `ensureAsset` plumbing, and regenerate `src/data/zenless-zone-zero/disc_suits.ts` with the generated-file banner and a catalog diff printed per run. A `--reupload-discs` flag (and the existing `--reupload-all`) SHALL force icon re-upload. The agent codegen path SHALL be unchanged by this addition, and the multi-catalog structure SHALL follow the HSR script's parallel load/generate + single fetch block + single write block shape.

#### Scenario: Fresh run emits suit catalog

- **WHEN** the script runs against the live Enka store
- **THEN** `disc_suits.ts` is regenerated with all suits having resolvable English names, alphabetically sorted, and a suit diff is printed alongside the agent diff

#### Scenario: Existing suit icons skipped

- **WHEN** a suit icon already exists in ImageKit
- **THEN** the upload is skipped and counted as skipped, unless `--reupload-discs` or `--reupload-all` was passed

#### Scenario: Icon fetch failure is non-fatal

- **WHEN** a suit icon download or upload fails
- **THEN** the suit still appears in the catalog, the failure is counted and the icon listed as missing, and the run completes
