# czn-data-pipeline Specification

## Purpose

Automated update pipeline for Chaos Zero Nightmare catalog data: fetches the combatant and Partner lists from Game8's collection JSON and their art from Prydwen's CloudFront origin, the Memory Fragment sets from Prydwen's page chunk, merges the hand-curated overlay seeds, keeps committed ids stable (id pins and a removal guard), regenerates the catalog files, seeds art to ImageKit, and runs weekly via GitHub Actions with an auto-PR on changes.

## Requirements

### Requirement: Automated CZN update script

The system SHALL provide `scripts/update-czn-data.mjs`, composed from the shared pipeline plumbing, that fetches the combatant and Partner lists and taxonomy from Game8's CZN character-list and Partner-list collection JSON, combatant card art from the Prydwen CloudFront origin's list and detail page-data, Partner icons from the Prydwen partners static query, and the Prydwen Memory Fragments page chunk, merges each overlay seed, regenerates `src/data/chaos-zero-nightmare/combatants.ts`, `partners.ts`, and `fragment_sets.ts`, and uploads combatant portraits to ImageKit `chaos_zero_nightmare/combatants`, partner icons to `chaos_zero_nightmare/partners`, and set icons to `chaos_zero_nightmare/fragment-sets`. Each Game8 collection mapping id and `updatedAt` SHALL be read each run from its list page's collection-browser `data-react-props`, never hardcoded. The script SHALL be idempotent: already-uploaded assets are skipped unless a `--reupload-*` flag is passed. A fetch, parse, or seed-validation failure SHALL exit non-zero without writing a partial catalog, except that a Prydwen combatant-art or Partner-icon failure SHALL degrade as described in "Portrait URLs derived per run" and "Partner catalog resolved through the page's static query".

#### Scenario: Fresh run regenerates catalog

- **WHEN** the script runs against the live Game8 and Prydwen sources
- **THEN** `combatants.ts`, `partners.ts`, and `fragment_sets.ts` are regenerated with every released source entry plus surviving overlay entries, carrying the generated-file banner, and for each catalog a diff (`added` / `removed`), the overlay count, and per-asset `skipped` / `uploaded` / `failed` counts are printed

#### Scenario: Existing assets skipped

- **WHEN** the script runs and a combatant portrait, partner icon, or set icon already exists in ImageKit
- **THEN** the upload is skipped and counted as `skipped`, unless the matching `--reupload-combatants` / `--reupload-partners` / `--reupload-fragment-sets` flag or `--reupload-all` was passed

#### Scenario: Collection mapping resolved per run

- **WHEN** a Game8 list page (characters or Partners) carries a collection-browser wrapper whose `data-react-props` names a `toolStructuralMapping` id and `updatedAt`
- **THEN** the script fetches `/api/tool_structural_mappings/<id>.json?updatedAt=<updatedAt>` and reads `collectionArraySchema.collectionItems`

#### Scenario: Source shape drift fails loudly

- **WHEN** the Game8 page lacks the collection-browser props, the collection JSON lacks a non-empty `collectionItems`, a released item carries an unexpected rarity (combatants 4★/5★, Partners 3★–5★) or no class (or, for a combatant, no attribute), or the Memory Fragments chunk cannot be located or yields no set entries
- **THEN** the script exits non-zero naming the page, entry, endpoint, or chunk, and the committed catalogs are left unchanged

#### Scenario: New taxonomy value

- **WHEN** a released Game8 item carries a class or attribute outside the known vocabulary
- **THEN** the entry is emitted with the value verbatim (open taxonomy, neutral badge) and the run warns naming the entry and value so a respelling is caught in review

### Requirement: Placeholder entries excluded

The script SHALL emit only Game8 collection items whose `released` is `Released`. Prydwen list nodes whose `class` or `element` is `Unknown` (teaser placeholders) SHALL NOT supply card art.

#### Scenario: Teaser node dropped

- **WHEN** the collection JSON contains an item whose `released` is not `Released`
- **THEN** that item is absent from `combatants.ts` and is reported in the run output as excluded

#### Scenario: Teaser node later released

- **WHEN** a previously excluded item is marked `Released` in a later run
- **THEN** it appears in the regenerated catalog and the diff reports it as `added`

#### Scenario: Teaser node covered by the overlay seed

- **WHEN** a unit has released but Game8 has not yet listed it as `Released`, and the overlay seed carries an entry for it
- **THEN** the seed entry is emitted, and once Game8 lists the unit as `Released` the Game8 entry wins and the run warns that the seed entry is shadowed rather than reporting it as `added`

#### Scenario: Prydwen teaser node gives no art

- **WHEN** a released Game8 item's slug matches a Prydwen list node whose class or element is `Unknown`
- **THEN** the entry's portrait comes from its Game8 `imageUrl`, and no Prydwen detail page-data is fetched for it

### Requirement: Portrait URLs derived per run

The script SHALL resolve each combatant's portrait download URL per run, never from a hardcoded hashed path. A Game8 entry whose id matches a Prydwen list node with real taxonomy SHALL use that node's detail page-data image node (`cardImage`, falling back to `smallImage`) resolved against the Prydwen origin; every other Game8 entry SHALL use its Game8 `imageUrl`; overlay entries SHALL use their `imageSource`. When the Prydwen list or a detail fetch fails, the script SHALL warn and use the Game8 `imageUrl` for the affected entries, unless `--reupload-combatants` or `--reupload-all` was passed, in which case it SHALL exit non-zero without writing.

#### Scenario: Image URL taken from current page-data

- **WHEN** a combatant joins a Prydwen node whose detail page-data carries a `cardImage` node
- **THEN** the download URL is that node's fallback `src` resolved against the Prydwen origin, and the asset is uploaded at the path matching the entry's `imageUrl`

#### Scenario: Unit Prydwen does not know

- **WHEN** a released Game8 item has no matching Prydwen node
- **THEN** its download URL is the item's Game8 `imageUrl`

#### Scenario: Prydwen unreachable

- **WHEN** the Prydwen list fetch fails and no combatant reupload flag was passed
- **THEN** the run prints a warning, the catalog is still regenerated from Game8, and portraits use Game8 `imageUrl`s (already-uploaded portraits stay skipped)

#### Scenario: Prydwen unreachable during a reupload

- **WHEN** the Prydwen list fetch fails and `--reupload-combatants` or `--reupload-all` was passed
- **THEN** the script exits non-zero and writes nothing

#### Scenario: No image node

- **WHEN** an entry has no usable image URL, or an overlay entry's `imageSource` is `null`
- **THEN** the entry is still emitted to the catalog and its portrait is counted as missing in the run output

### Requirement: Weekly CZN update workflow

The system SHALL provide `.github/workflows/update-czn-data.yml` running the update script on a weekly cron plus manual dispatch. When the script produces file changes, the workflow SHALL auto-create a pull request with the diff, titled and described as a CZN data update covering combatants, partners, and Memory Fragment sets; when nothing changed, no PR is created.

#### Scenario: Weekly run with changes

- **WHEN** the scheduled workflow runs and a regenerated catalog differs from the committed one
- **THEN** a PR is opened containing the regenerated data file changes

#### Scenario: Weekly run without changes

- **WHEN** the scheduled workflow runs and no files change
- **THEN** no PR is created

### Requirement: Combatant catalog is generated, not hand-authored

`src/data/chaos-zero-nightmare/combatants.ts` SHALL be produced exclusively by the update script and SHALL never be hand-edited, per the repo-wide `src/data` rule. Corrections go into the script's mapping or the overlay seed. The overlay seed is for units Game8 has not yet listed; an entry whose id Game8 also lists is shadowed by the Game8 entry, and the run warns that it should be deleted.

#### Scenario: Catalog change needed

- **WHEN** a combatant's catalog data is wrong or missing
- **THEN** the fix is made in `scripts/update-czn-data.mjs` or `scripts/seeds/czn-combatants.json` and the file regenerated — never by editing `combatants.ts` directly

#### Scenario: Seed entry shadowed by Game8

- **WHEN** an overlay seed entry's id is also produced from the Game8 list
- **THEN** the Game8 entry is emitted and the run warns that the seed entry is now on Game8 and should be deleted

### Requirement: Partner catalog resolved through the page's static query

The Partner list and taxonomy (`name`, `rarity`, `class`, `faction`) SHALL come from Game8's Partner-list collection JSON, keeping only `Released` items. For icons, the script SHALL read the Prydwen partners page-data (`/page-data/chaos-zero-nightmare/partners/page-data.json`) for its `staticQueryHashes`, fetch each `/page-data/sq/d/<hash>.json`, and take Partner nodes from the one carrying `allContentfulChaosPartner.nodes`. The hash SHALL be resolved per run, never hardcoded, because it changes per site build. A Game8 Partner whose id equals the id minted from a Prydwen node's name SHALL use that node's `smallImage` fallback `src` resolved against the origin; every other Partner SHALL use its Game8 `imageUrl`. When the Prydwen page-data or static query fails, the run SHALL warn and use Game8 icons, unless `--reupload-partners` or `--reupload-all` was passed, in which case it SHALL exit non-zero without writing.

#### Scenario: Static query located per run

- **WHEN** the partners page-data lists one or more static query hashes
- **THEN** the script fetches them and uses the first whose payload carries `allContentfulChaosPartner.nodes`; when none does, the run warns and uses Game8 icons, or aborts non-zero under a Partner reupload flag

#### Scenario: Partner icon URL taken from current static query

- **WHEN** a Game8 Partner joins a Prydwen node that carries a `smallImage` node
- **THEN** the download URL is that node's fallback `src` resolved against the Prydwen origin, uploaded as webp at source size to the path matching the entry's `imageUrl`

#### Scenario: Partner without an image

- **WHEN** a Partner has neither a joined Prydwen `smallImage` nor a Game8 `imageUrl`, or an overlay entry's `imageSource` is `null`
- **THEN** the entry is still emitted and its icon is counted as missing in the run output

#### Scenario: Partner Prydwen lacks

- **WHEN** a released Game8 Partner has no matching Prydwen node
- **THEN** its download URL is the item's Game8 `imageUrl`

### Requirement: Memory Fragment set catalog resolved through the page's webpack chunk

The script SHALL locate the Memory Fragments page component chunk by reading the origin's `webpack.stats.json` and taking the hashed `component---…` asset listed for the `memory-fragments` page chunk name, then extract the set list from that chunk's hardcoded array of `{ ID, Name, Effect, Type }` entries by pattern matching the literal shape. The script SHALL NOT evaluate downloaded JavaScript. Each entry maps `Name` and `Type` (`4-PC` → 4 pieces, `2-PC` → 2) into `CznFragmentSet` with `id` minted as the name's kebab-case slug; `Effect` is not emitted. Each set's icon download URL SHALL be read from the same chunk — the image file the chunk's per-ID render binding names for that set ID, at the largest width its inlined srcset advertises — resolved against the origin per run, never hardcoded. The chunk filename, the ID→file bindings, and the hashed image directories SHALL be resolved every run because all change per site build and the binding is positional rather than derived from the ID.

#### Scenario: Chunk located per run

- **WHEN** `webpack.stats.json` lists an asset for the Memory Fragments page chunk name
- **THEN** the script fetches that asset and parses its set array, aborting non-zero naming the chunk if no asset is listed or no entries parse

#### Scenario: Set icon URL taken from the current chunk

- **WHEN** the chunk binds an image file to a set's `ID` and inlines that file's srcset
- **THEN** the download URL is that file's largest-width hashed `/static/` path resolved against the Prydwen origin, uploaded as webp at source size to the path matching the entry's `imageUrl`

#### Scenario: Set without an icon path

- **WHEN** the chunk binds no image file to a set's `ID` (or the bound file has no srcset), or an overlay entry's `imageSource` is `null`
- **THEN** the entry is still emitted and its icon is counted as missing in the run output

### Requirement: Catalog ids stable across runs

Combatant and Partner ids SHALL be minted as `slugify(name, '-')`, except that an entry in `scripts/seeds/czn-id-pins.json` (`{ combatants: [], partners: [] }`, each pin `{ game8Id, id, name?, note? }`) SHALL fix the id of the Game8 item with that `game8Id`, so a Game8 spelling that differs from the spelling an id was first minted from keeps the committed id. A malformed or duplicate pin SHALL abort the run; a pin matching no released item SHALL be warned about. Because tracked rows key on these ids, the script SHALL exit non-zero without writing when a regenerated combatant, Partner, or Memory Fragment set catalog lacks an id present in its committed file, listing the missing ids, unless `--allow-removals` was passed.

#### Scenario: Upstream rename

- **WHEN** Game8 renames a unit so its minted id changes and no pin covers it
- **THEN** the run aborts listing the old id as missing and pointing at the pin file, and the catalog is unchanged

#### Scenario: Pinned respelling

- **WHEN** Game8 lists a Partner as `Lillian` and the pin file maps its Game8 id to `lilian`
- **THEN** the emitted entry has `id: 'lilian'` and `name: 'Lillian'`, and the diff reports no change for it

#### Scenario: Deliberate removal

- **WHEN** the same run is repeated with `--allow-removals`
- **THEN** the catalog is regenerated and the diff reports the id as `removed`
