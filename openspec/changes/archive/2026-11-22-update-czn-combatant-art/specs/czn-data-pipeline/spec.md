# Spec Delta

## MODIFIED Requirements

### Requirement: Automated CZN update script

The system SHALL provide `scripts/update-czn-data.mjs`, composed from the shared pipeline plumbing, that fetches the combatant and Partner lists and taxonomy from Game8's CZN character-list and Partner-list collection JSON, combatant portraits and face icons from CZN Meta Decks (with Prydwen card art and Game8 icons as the fallback), Partner icons from the Prydwen partners static query, and the Prydwen Memory Fragments page chunk, merges each overlay seed, regenerates `src/data/chaos-zero-nightmare/combatants.ts`, `partners.ts`, and `fragment_sets.ts`, and uploads combatant portraits to ImageKit `chaos_zero_nightmare/combatants`, combatant face crops to `chaos_zero_nightmare/combatant-faces`, partner icons to `chaos_zero_nightmare/partners`, and set icons to `chaos_zero_nightmare/fragment-sets`. Each Game8 collection mapping id and `updatedAt` SHALL be read each run from its list page's collection-browser `data-react-props`, never hardcoded. The script SHALL be idempotent: already-uploaded assets are skipped unless a `--reupload-*` flag is passed. A fetch, parse, or seed-validation failure SHALL exit non-zero without writing a partial catalog, except that a combatant-art or Partner-icon source failure SHALL degrade as described in "Portrait URLs derived per run", "Combatant face crops", and "Partner catalog resolved through the page's static query".

#### Scenario: Fresh run regenerates catalog

- **WHEN** the script runs against the live Game8, CZN Meta Decks, and Prydwen sources
- **THEN** `combatants.ts`, `partners.ts`, and `fragment_sets.ts` are regenerated with every released source entry plus surviving overlay entries, carrying the generated-file banner, and for each catalog a diff (`added` / `removed`), the overlay count, and per-asset `skipped` / `uploaded` / `failed` counts are printed

#### Scenario: Existing assets skipped

- **WHEN** the script runs and a combatant portrait, combatant face crop, partner icon, or set icon already exists in ImageKit
- **THEN** the upload is skipped and counted as `skipped`, unless the matching `--reupload-combatants` / `--reupload-combatant-faces` / `--reupload-partners` / `--reupload-fragment-sets` flag or `--reupload-all` was passed

#### Scenario: Collection mapping resolved per run

- **WHEN** a Game8 list page (characters or Partners) carries a collection-browser wrapper whose `data-react-props` names a `toolStructuralMapping` id and `updatedAt`
- **THEN** the script fetches `/api/tool_structural_mappings/<id>.json?updatedAt=<updatedAt>` and reads `collectionArraySchema.collectionItems`

#### Scenario: Source shape drift fails loudly

- **WHEN** the Game8 page lacks the collection-browser props, the collection JSON lacks a non-empty `collectionItems`, a released item carries an unexpected rarity (combatants 4★/5★, Partners 3★–5★) or no class (or, for a combatant, no attribute), or the Memory Fragments chunk cannot be located or yields no set entries
- **THEN** the script exits non-zero naming the page, entry, endpoint, or chunk, and the committed catalogs are left unchanged

#### Scenario: New taxonomy value

- **WHEN** a released Game8 item carries a class or attribute outside the known vocabulary
- **THEN** the entry is emitted with the value verbatim (open taxonomy, neutral badge) and the run warns naming the entry and value so a respelling is caught in review

### Requirement: Portrait URLs derived per run

The script SHALL resolve each combatant's portrait download URL per run, never from a hardcoded hashed path. A Game8 entry that joins a CZN Meta Decks catalog entry SHALL use that entry's 804×924 portrait. Every other Game8 entry SHALL fall back: an id matching a Prydwen list node with real taxonomy uses that node's detail page-data image node (`cardImage`, falling back to `smallImage`) resolved against the Prydwen origin, and the rest use their Game8 `imageUrl`. Overlay entries SHALL use their `imageSource`. A Meta Decks portrait SHALL be uploaded with its fully transparent margin trimmed, as webp at source resolution. When the Meta Decks catalog fetch fails, the script SHALL warn and use the fallback chain for every entry; when the Prydwen list or a detail fetch fails, it SHALL warn and use the Game8 `imageUrl` for the affected entries. Under `--reupload-combatants` or `--reupload-all`, either failure SHALL instead exit non-zero without writing.

#### Scenario: Portrait taken from CZN Meta Decks

- **WHEN** a combatant joins a Meta Decks catalog entry
- **THEN** the download URL is that entry's portrait on the Meta Decks CDN, and the asset is uploaded, margin trimmed, at the path matching the entry's `imageUrl`

#### Scenario: Meta Decks catalog located per run

- **WHEN** the script needs the Meta Decks catalog
- **THEN** it reads the hashed catalog URL from the Meta Decks characters page on that run, never from a hardcoded file name

#### Scenario: Unit Meta Decks does not know

- **WHEN** a released Game8 item joins no Meta Decks entry
- **THEN** the run warns naming the entry, and its download URL comes from the Prydwen node when one matches, otherwise from the item's Game8 `imageUrl`

#### Scenario: Image URL taken from current page-data

- **WHEN** a combatant without a Meta Decks portrait joins a Prydwen node whose detail page-data carries a `cardImage` node
- **THEN** the download URL is that node's fallback `src` resolved against the Prydwen origin, and the asset is uploaded at the path matching the entry's `imageUrl`

#### Scenario: Unit Prydwen does not know

- **WHEN** a released Game8 item has no Meta Decks entry and no matching Prydwen node
- **THEN** its download URL is the item's Game8 `imageUrl`

#### Scenario: Meta Decks unreachable

- **WHEN** the Meta Decks catalog fetch fails and no combatant reupload flag was passed
- **THEN** the run prints a warning, the catalog is still regenerated from Game8, and portraits not yet uploaded use the Prydwen and Game8 fallback (already-uploaded portraits stay skipped)

#### Scenario: Prydwen unreachable

- **WHEN** the Prydwen list fetch fails and no combatant reupload flag was passed
- **THEN** the run prints a warning, the catalog is still regenerated from Game8, and portraits without a Meta Decks source use Game8 `imageUrl`s (already-uploaded portraits stay skipped)

#### Scenario: Meta Decks unreachable during a reupload

- **WHEN** the Meta Decks catalog fetch fails and `--reupload-combatants` or `--reupload-all` was passed
- **THEN** the script exits non-zero and writes nothing

#### Scenario: Prydwen unreachable during a reupload

- **WHEN** a combatant lacks a Meta Decks portrait, the Prydwen list fetch fails, and `--reupload-combatants` or `--reupload-all` was passed
- **THEN** the script exits non-zero and writes nothing

#### Scenario: No image node

- **WHEN** an entry has no usable image URL, or an overlay entry's `imageSource` is `null`
- **THEN** the entry is still emitted to the catalog and its portrait is counted as missing in the run output

## ADDED Requirements

### Requirement: Combatant face crops

The script SHALL upload one square face crop per combatant to ImageKit `chaos_zero_nightmare/combatant-faces/{id}.webp`, at most 256 px a side and never upscaled. For a combatant with a Meta Decks portrait, the crop SHALL be the region of the untrimmed portrait that the game's face icon for that unit matches, cut at portrait resolution. When the match is not confident, the face icon itself SHALL be uploaded. A combatant without Meta Decks art SHALL get the top-anchored square of its fallback portrait.

#### Scenario: Face located in the portrait

- **WHEN** a combatant's face icon matches a region of its portrait with confidence
- **THEN** that square region is cut from the portrait, capped at 256 px, and uploaded as the combatant's face crop

#### Scenario: Weak match

- **WHEN** no region of the portrait matches the face icon with confidence
- **THEN** the face icon is uploaded as the face crop and the run output names the combatant as using the icon

#### Scenario: Fallback art

- **WHEN** a combatant's portrait came from Prydwen, Game8, or an overlay `imageSource`
- **THEN** its face crop is the top-anchored square of that portrait

#### Scenario: No portrait

- **WHEN** a combatant has no portrait source at all
- **THEN** no face crop is uploaded and the face is counted as missing in the run output

#### Scenario: Face computed only when needed

- **WHEN** a combatant's face crop already exists in ImageKit and no face reupload flag was passed
- **THEN** the face is counted as `skipped` and neither the portrait nor the face icon is downloaded for it

#### Scenario: Meta Decks unreachable during a face reupload

- **WHEN** the Meta Decks catalog fetch fails and `--reupload-combatant-faces` was passed
- **THEN** the script exits non-zero and writes nothing, so face crops are never replaced by fallback squares

#### Scenario: Faces redone without portraits

- **WHEN** the script runs with `--reupload-combatant-faces`
- **THEN** every face crop is recomputed and uploaded while existing portraits stay skipped

#### Scenario: Portrait reupload redoes faces

- **WHEN** the script runs with `--reupload-combatants` or `--reupload-all`
- **THEN** both the portrait and the face crop of every combatant are re-uploaded

### Requirement: Combatant art joined by name with an override seed

A combatant SHALL join the Meta Decks catalog entry whose name, lowercased and stripped of non-alphanumeric characters, equals the combatant's name in the same form, or whose kebab-case name slug equals the combatant's id. `scripts/seeds/czn-art-overrides.json` (`{ combatants: [] }`, each entry `{ id, charId?, face?, note? }`) SHALL override the join: `charId` names the Meta Decks unit for that combatant, and `face` (`{ left, top, side }` in portrait pixels) replaces the located face region. A malformed entry, a duplicate id, or a `face` box outside the portrait SHALL abort the run.

#### Scenario: Join by name

- **WHEN** a Game8 combatant and a Meta Decks entry carry the same name apart from case, spacing, and punctuation
- **THEN** the combatant uses that entry's portrait and face icon

#### Scenario: Join survives a pinned respelling

- **WHEN** Game8 spells a name differently from the committed id and Meta Decks uses the spelling the id was minted from
- **THEN** the combatant still joins, through its id

#### Scenario: Join forced by override

- **WHEN** an override entry gives a combatant id a `charId`
- **THEN** the combatant uses the Meta Decks unit with that `charId` regardless of its name

#### Scenario: Manual face box

- **WHEN** an override entry gives a combatant a `face` box
- **THEN** the face crop is that box cut from the untrimmed portrait, and no matching is attempted

#### Scenario: Override names an unknown target

- **WHEN** an override entry's `id` matches no emitted combatant, or its `charId` matches no Meta Decks entry
- **THEN** the run warns naming the entry and the combatant falls back to the name join

#### Scenario: Unreleased Meta Decks entries

- **WHEN** the Meta Decks catalog lists units that Game8 does not list as `Released`
- **THEN** those units are ignored: the join only supplies art for combatants already in the catalog
