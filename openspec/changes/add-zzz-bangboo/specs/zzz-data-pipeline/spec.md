## ADDED Requirements

### Requirement: Bangboo catalog generation

The update script SHALL additionally fetch the Bangboo entry list from the HoyoLab wiki API (`sg-wiki-api.hoyolab.com`, `hoyowiki/zzz/wapi/get_entry_page_list`, Bangboo menu, English language, paginated) — a distinct source from the Enka store, which carries no Bangboo data. For each entry it SHALL take the wiki entry id as the catalog id, the English display name, the rarity from the entry's `bangboo_rarity` filter value where tagged (`null` where absent), and the wiki icon URL. Icons SHALL be uploaded to ImageKit under `zenless_zone_zero/bangboos/{id}.png` via the shared `ensureAsset` plumbing, and `src/data/zenless-zone-zero/bangboos.ts` SHALL be regenerated with the generated-file banner and a catalog diff printed per run. A `--reupload-bangboos` flag (and the existing `--reupload-all`) SHALL force icon re-upload. The agent, disc-suit, and W-Engine codegen paths SHALL be unchanged by this addition.

#### Scenario: Fresh run emits Bangboo catalog

- **WHEN** the script runs against the live HoyoLab wiki API
- **THEN** `bangboos.ts` is regenerated with all listed Bangboos, sorted rarity S then A then untagged with names alphabetical within each band, and a Bangboo diff is printed alongside the agent, suit, and engine diffs

#### Scenario: Full list fetched across pages

- **WHEN** the wiki API returns the Bangboo list paginated
- **THEN** the script follows the pagination until all entries are fetched (list total honoured), not just the first page

#### Scenario: Existing Bangboo icons skipped

- **WHEN** a Bangboo icon already exists in ImageKit
- **THEN** the upload is skipped and counted as skipped, unless `--reupload-bangboos` or `--reupload-all` was passed

#### Scenario: Icon fetch failure is non-fatal

- **WHEN** a Bangboo icon download or upload fails
- **THEN** the Bangboo still appears in the catalog, the failure is counted and the icon listed as missing, and the run completes
