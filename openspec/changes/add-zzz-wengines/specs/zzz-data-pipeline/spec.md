## ADDED Requirements

### Requirement: W-Engine catalog generation

The update script SHALL additionally fetch `store/zzz/weapons.json`, resolve engine display names from the English localization table via each item's `ItemName` loc key, upload each engine icon (fetched from the Enka UI CDN at the item's `ImagePath`) to ImageKit under `zenless_zone_zero/wengines/{id}.png` via the shared `ensureAsset` plumbing, and regenerate `src/data/zenless-zone-zero/wengines.ts` with the generated-file banner and a catalog diff printed per run. Each entry SHALL carry the numeric rarity and the `ProfessionType` specialty verbatim. A `--reupload-wengines` flag (and the existing `--reupload-all`) SHALL force icon re-upload. The agent and disc-suit codegen paths SHALL be unchanged by this addition.

#### Scenario: Fresh run emits engine catalog

- **WHEN** the script runs against the live Enka store
- **THEN** `wengines.ts` is regenerated with all engines having resolvable English names, sorted rarity descending then name, and an engine diff is printed alongside the agent and suit diffs

#### Scenario: Existing engine icons skipped

- **WHEN** an engine icon already exists in ImageKit
- **THEN** the upload is skipped and counted as skipped, unless `--reupload-wengines` or `--reupload-all` was passed

#### Scenario: Icon fetch failure is non-fatal

- **WHEN** an engine icon download or upload fails
- **THEN** the engine still appears in the catalog, the failure is counted and the icon listed as missing, and the run completes
