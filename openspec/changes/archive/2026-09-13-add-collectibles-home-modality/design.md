## Context

The app is a multi-game roster tracker. Every game in `GAMES` (`src/lib/games.ts`) is a live-service gacha with the same shape: a generated catalog, a tracked roster with levels and equipment, and a party/lineup second view. The home page (`SelectionPage`) is a single "Select Game" grid, and `GameSwitcher` is a flat dropdown over the same array.

The first non-gacha tracker — the user's physical Digimon digivice / virtual-pet collection — has a different shape: a fixed catalog of product releases, per-item ownership state, and a completion metric per product line. Nothing in the shared machinery cares _what_ a tracked entity is (`createRosterPersistence`, `useRoster`, `useRosterView`, `RosterPageLayout`, `GameCardShell`, `AddEntityModal` are all entity-agnostic), so the roster core reuses cleanly. What is missing is a vocabulary and a home-page structure that lets the user (and the code) tell a gacha roster apart from a collectibles checklist, and that leaves an obvious seam for the next non-gacha tracker (TCG sets, amiibo, console libraries).

Constraints: registry-driven wiring (`shared-game-registry`), token-first CSS, the never-hand-edit-`src/data` rule, RLS on every table, no new CSP origins, no parties/RPCs needed.

## Goals / Non-Goals

**Goals:**

- Introduce **Tracker Modality** as a first-class, ordered registry that the home page and switcher group by, so adding a third modality is one registry entry plus games that reference it.
- Ship the Digimon device collection as the first `collection`-modality tracker, composed entirely of existing shared roster machinery — no new persistence patterns.
- Keep the six existing games untouched in behaviour; only their home-page grouping and one prop name change.
- Record the new vocabulary in `CONTEXT.md` so future specs and reviews use it.

**Non-Goals:**

- Renaming `Game` / `GAMES` to `Tracker` / `TRACKERS`. The Digimon line is a game franchise, the id is stable across tables and tokens, and the rename would touch every spec. Deferred; noted as a naming smell in Risks.
- Parties, equipment, scoring, or predicate filter chips for the collection modality. A status filter (Owned / Wishlist) is plausible later and is the natural first use of held cards here, but is out of scope.
- Automated catalog sourcing. The catalog is seed-driven in this change (see D6); a Wikimon sync that reports drift against the seed is a follow-up, not part of this change.
- Per-user custom catalog entries (adding a device the catalog lacks). Extend the seed instead.
- Multi-copy tracking (owning two of the same device). One row per `(profile, device)`.

## Decisions

### D1 — Modality is a registry, referenced by a field on each game

`src/lib/modalities.ts` exports `TrackerModality` (`'roster' | 'collection'`) and an ordered `MODALITIES: Modality[]` where `Modality = { id, title, subtitle }`:

| id           | title                | subtitle                              |
| ------------ | -------------------- | ------------------------------------- |
| `roster`     | Live-Service Rosters | Gacha rosters, builds, and lineups.   |
| `collection` | Collections          | Physical collectibles and completion. |

`Game` gains `modality: TrackerModality`. Consumers derive `GAMES.filter((g) => g.modality === m.id)` per modality — a `gamesByModality()` helper in `modalities.ts` returns `{ modality, games }[]` in `MODALITIES` order with empty modalities omitted, so `SelectionPage` and `GameSwitcher` share one grouping.

_Alternatives:_ (a) two arrays `GAMES` / `COLLECTIONS` — duplicates the registry contract, and every consumer must remember to read both; (b) a per-modality folder layout (`src/pages/collections/digimon/`) — directory churn for six existing games with no runtime benefit. A field plus an ordered registry is the smallest change that makes "which section does this belong to" a declared fact.

### D2 — Home page renders one section per populated modality

`SelectionPage` maps `gamesByModality()` to `<section className="selection-section">` blocks, each with a `.selection-section-header` (`h2.selection-section-title`, `p.selection-section-subtitle`) followed by the existing `.selection-grid`. The `selection-page-layout` column rules apply per grid unchanged (max three columns, auto-fit degradation). The hero becomes tracker-neutral: title **"Your Trackers"**, subtitle **"Pick something to track."** Modalities with zero games render nothing, so the page never shows an empty heading.

_Alternative:_ tabs per modality — hides the collection behind a click and invites a "which tab am I on" state; sections keep everything scannable and need no state.

### D3 — GameSwitcher groups the dropdown by modality

The dropdown list renders a `.dropdown-group` per populated modality with a `.dropdown-group-label` (modality title) followed by that modality's `.dropdown-item`s. Header copy becomes "Switch Tracker"; footer stays "Back to Selection". Active detection and the `/` hide are unchanged. Single-modality state (if all collections were removed) still renders the group label — consistent, and never the case in practice.

### D4 — `RosterPageLayout.partiesTab` → `secondView`

The slot's label prop is already `secondViewLabel`; the slot itself is renamed to match. Six pages and the layout stories update the prop name. The doc comment reads "The second-view content — parties/lineups for roster games, completion for collections."

_Alternative:_ leave the name and pass the completion view through `partiesTab` — cheap, but the misnomer would be copied into the first collection page and every one after it.

### D5 — Digimon domain model

| Term        | Value                                                                                        |
| ----------- | -------------------------------------------------------------------------------------------- |
| Short id    | `dgm` (commit scope, tokens `color.dgm`, table prefix `dgm_`)                                |
| Directory   | `digimon`                                                                                    |
| Entity noun | **device** — one digivice or virtual-pet release (a specific colourway of a specific series) |
| Tracked set | the **collection** (the roster of the collection modality; shared code still says roster)    |
| Second view | **Completion**                                                                               |
| Route       | `/digimon`                                                                                   |

Catalog `DgmDevice` (`src/data/digimon/devices.ts`, generated):

```ts
interface DgmDevice {
  id: string; // kebab slug, e.g. 'digital-monster-ver1-brown'
  name: string; // 'Digital Monster Ver.1 (Brown)'
  line: string; // product line: 'Digital Monster', 'Pendulum', 'D-3', 'Vital Bracelet', …
  series: string; // release within the line: 'Ver.1', 'Pendulum 1.0 Nature Spirits', 'Ver.20th'
  releaseYear: number;
  region: 'JP' | 'NA' | 'EU' | 'ASIA';
  colorway: string; // 'Brown', 'Clear Blue', …
  imageUrl: string; // '/assets/digimon/devices/{id}.webp'
}
```

`line` and `series` are open strings (like ZZZ's taxonomy) — the catalog, not a hand-maintained enum, is the source of truth. `DGM_LINES: string[]` is also generated: distinct `line` values in seed order, which is chronological, and is what the Completion view iterates.

Tracked `DgmTrackedDevice extends DgmDevice` in `src/types.ts`:

```ts
{
  dbId?: string;
  isFavorited: boolean;
  status: 'owned' | 'wishlist';
  condition: 'sealed' | 'boxed' | 'loose' | null;
  acquiredOn: string | null;   // ISO date, no time
  notes: string;
}
```

`DgmDevicePatch` is the optional projection of the five mutable fields. Persistence is a plain `createRosterPersistence` adapter (`deviceService.ts`, table `dgm_tracked_devices`, entity column `device_id`, no extras). The hook `useDevices` declares every updater via `makeFieldUpdater` — no custom bodies exist, which is the point: the collection modality is roster machinery with a different vocabulary.

Table (`supabase/migrations/20260912000000_add_dgm_tables.sql`): uuid pk, `profile_id` FK to `user_profiles` with cascade, `device_id TEXT NOT NULL`, `status TEXT NOT NULL DEFAULT 'owned' CHECK (status IN ('owned','wishlist'))`, `condition TEXT CHECK (condition IN ('sealed','boxed','loose'))` nullable, `acquired_on DATE`, `notes TEXT NOT NULL DEFAULT ''`, `is_favorited BOOLEAN NOT NULL DEFAULT false`, `created_at`, `UNIQUE (profile_id, device_id)`, index on `profile_id`, RLS with the cached-`auth.uid()` policy form used by the 2026-09-11 migration. Single-row writes only — no RPC, so the Docker verification harness is not needed for this change.

### D6 — Seed-driven catalog generation

The catalog is generated from a hand-authored, curated seed rather than fetched. This keeps the "never hand-edit `src/data`" rule intact, keeps images off the repo, and keeps the row set under the collector's control (which colourways count as separate entries is a curation call, not a fact any upstream settles):

- `scripts/seeds/dgm-devices.json` — array of `{ id, name, line, series, releaseYear, region, colorway, imageSource, wikimon? }` where `imageSource` is a public image URL, a `wikimon:<File name>` reference (resolved to the file's URL through the Wikimon API when the script runs, so the seed never carries hashed upload paths), or `null` while no image has been sourced — null rows are emitted with their local `imageUrl` (the card falls back to ui-avatars) and listed by the script as unsourced. `wikimon` names the Wikimon page that documents the row; the sync report groups by it. The seed is the source of truth and is edited by hand in a normal PR.
- `scripts/update-dgm-data.mjs` — composes `scripts/lib/pipeline.mjs`: validates the seed (unique ids, required fields, `region` in the enum, `releaseYear` a 4-digit integer), runs `ensureAsset` per entry (download `imageSource`, upload to ImageKit at `/assets/digimon/devices/{id}.webp`, skip when present, `--reupload-devices` to force), then generates `devices.ts` with the standard banner plus `DGM_LINES`. Entries are emitted in seed order.
- `.github/workflows/update-dgm-data.yml` — `workflow_dispatch` only; there is no upstream to poll weekly. Its only value over a local run is that CI holds the ImageKit secrets, so a contributor without `.env.local` can still get images onto the CDN. If that never matters, replace it with a drift check in the checks workflow (regenerate from the seed, fail if `devices.ts` differs) and drop the auto-PR.

Seed scope (decided 2026-09-13): the modern era, 2010 onward — Xros Loader, Digivice / D-3 / D-Ark Ver.15th and -25th COLOR EVOLUTION-, Digivice: and Ver.Complete, Digital Monster Ver.20th / X / COLOR (including the Monster Hunter, Godzilla, Xros Wars, and Ultraman editions), Pendulum Ver.20th / Z / Z II / COLOR (including the Godzilla edition), Vital Bracelet Digital Monster / Digivice-V- / Vital Hero / BE / Digivice-VV-. The 1997–2000s originals are out of scope until the collector owns any; Appli Drive is left out until its colour-to-product mapping is confirmed. Colourways are separate entries; which ones count is the collector's call and is refined in the seed, not in code. Seven lines: Digital Monster, Pendulum, Vital Bracelet, Digivice, D-3, D-Ark, Xros Loader (`color.dgm.line*` tokens match).

**Seed provenance.** The first draft was authored from memory and turned out wrong where checkable (missing the 25th-anniversary devices entirely, wrong Digimon COLOR colourways). It was replaced the same day with rows transcribed from the Wikimon infobox (`|color=`, `|rdate1=`) and gallery of each device page, with `imageSource` pointing at the Wikimon file. Region and year for the English/US Digital Monster Ver.20th and X colourways are inferred from the page's release-date prose, not from a per-shell table — the sync report flags them until Wikimon lists them explicitly.

**Data sources, studied 2026-09-13.** Ranked for the device catalog:

| Source                                                          | Fit                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Wikimon** (`wikimon.net`)                                     | Fact source. MediaWiki with an open `api.php` returning wikitext; per-line pages (e.g. `Digital Monster COLOR`) carry a `=Versions=` wikitable with release dates, a shell list per version ("Ver.1 (Original Brown)"), Premium Bandai source links, and product images; `List of Virtual Pets` indexes every line, old and new. Licence CC BY-SA 3.0 — attribute in the generated-file banner and `CONTEXT.md` if content is copied.                                                                                            |
| **Bandai / Premium Bandai** (`toy.bandai.co.jp`, `p-bandai.jp`) | Primary source for exact JP dates, product names, and official renders. Pages expire after sale — use for verification, not automation.                                                                                                                                                                                                                                                                                                                                                                                          |
| **Humulos / Digitama Hatchery** (`humulos.com/digimon`)         | Not a catalog. Evolution guides, manuals, and rosters for modern lines only; colourway names appear on three pages (`dmc`, `penc`, `dmx`) as chart-header bullets, no release dates or regions anywhere, Vital Bracelet pages index Dim cards rather than shells, 17 series-level shell PNGs on the index page only. Site design and scripts are reserved by the author ("may not be reused except with express permission"). Reserved for the later evolution-guide / raising tracker — ask the author before pulling anything. |
| Wikipedia, Fandom Digimon Wiki, With the Will, r/digimon        | Cross-check only. Line-level history or unstructured announcements; nothing per shell.                                                                                                                                                                                                                                                                                                                                                                                                                                           |

**Sync principle.** The seed stays curated; sources inform it, never overwrite it. `update-dgm-data.mjs --sync-wikimon` fetches every page named by a seed row's `wikimon` field plus `List of Virtual Pets` through `api.php`, parses the infobox (`|color=`, `|rdate*=`, gallery `|iN=`/`|cN=` pairs) and the `=Versions=` tables, and prints per page: colourways with no seed row, seed years the page does not list, version titles with no seed row, gallery candidates for unsourced rows, and finally the list pages no row references. It writes nothing. Matching is by normalised substring, so a report line is a prompt to look, not a verdict (e.g. "Yagami Taichi orange" is flagged against the seed's "Yagami Taichi Color"). No source is polled on a schedule; the report runs when someone is editing the seed.

### D7 — Device card and add modal

`DeviceCard` composes `GameCardShell`:

- `resolveImage` → new `getDeviceImageUrl` in `src/lib/imagekit.ts` (contain-fit product shot; devices are not portraits, so the mugshot crops are wrong).
- Badges: `GameBadge` for `line` (variant `dgm-line`, modifier slugged line) and `region` (variant `dgm-region`).
- Summary chips: `StatChip` for status, condition (when set), release year.
- Summary line: `series · colorway`.
- Edit body: `SegmentedButtons` (`coloring="static"`) for status **Owned / Wishlist**; `SegmentedButtons` (`coloring="static"`, `allowDeselect`) for condition **Sealed / Boxed / Loose**; `FormGroup` wrapping a native `<input type="date">` for acquired date (no shared date primitive exists and a native date input is the right control); `BuildComments` for notes with label "Notes".
- Favorite / remove / edit-commit wired exactly as AE's `OperatorCard`; `onEditCommit` releases the basis.

`AddDeviceModal` is an `AddEntityModal` config wrapper: title "Add Device", noun "devices", `searchKeys` `['name', 'line', 'series', 'colorway']`, badges line + region.

Sort modes: `ALPHA` (default) and `YEAR` (`releaseYear` ascending, then name). Search placeholder "Search by name, line, series, or colour…".

### D8 — Completion view

`CompletionView` (`src/pages/digimon/components/CompletionView.tsx` + css) is a pure projection of `trackedDevices` and `ALL_DEVICES` — no hook, no fetch. It renders an overall row and one row per `DGM_LINES` entry: line name, `owned / total` count, percentage, and a bar. **Owned** means a tracked device with `status === 'owned'`; wishlist rows do not count. Lines with zero catalog entries cannot occur (lines are derived from the catalog). The bar uses the shared progress gradient tokens (`shared-progress-gradient`); classes are `.completion-list`, `.completion-row`, `.completion-bar`, `.completion-bar-fill`, all tokenised in the view's own CSS. The view receives the roster's `isInitialLoad` / `isLoadError` / `onRetry` and renders `LoadingState` / `ErrorState` on those rungs, `AuthGate` when signed out, so the second view ladder matches the roster ladder.

_Alternative:_ a hook + table for completion snapshots — nothing to persist; completion is fully derivable.

### D9 — Registry, tokens, and wiring

- `GAMES` entry: id `dgm`, name "Digimon Virtual Pets", path `/digimon`, developer "Bandai", description "Track your digivice and virtual-pet collection.", icon `/assets/icons/dgm-icon.webp`, cover `/assets/digimon/selection-cover.webp`, `bgClass: 'bg-dgm-sel'`, `modality: 'collection'`, lazy `DigimonPage`.
- Tokens: `color.dgm.selStart` / `selMid` plus badge hues for line and region under `color.dgm`; `DesignTokens.stories.tsx` gains the group.
- `src/index.css`: `.selection-card-header.bg-dgm-sel` gradient in the existing pattern.
- `CONTEXT.md`: new **Tracker Modality** section under Core Concepts; Digimon row in The Games; "Party View" paragraph notes collections have no parties. `CLAUDE.md`: game list, "Wiring a New Game" step 2 mentions `modality`, note that collection-modality games skip parties.

## Risks / Trade-offs

- [`Game` is now a misnomer for a collectibles tracker] → Accepted for this change; the vocabulary in `CONTEXT.md` calls entries "trackers" and defines modality. A `Game → Tracker` rename is a mechanical follow-up if the name keeps grating.
- [Seed typos ship straight into the catalog] → The generator validates ids, required fields, enums, and year; the generated diff is reviewed in the regeneration PR like every other catalog.
- [`imageSource` links rot or are blocked] → Images are uploaded once to ImageKit and never hotlinked at runtime; a failed download leaves the local-path fallback, and `GameCardShell` already falls back to ui-avatars. Missing images are listed by the script like other pipelines.
- [A single-card "Collections" section looks sparse] → Accepted; the grid auto-fits and the section header is the point — it advertises the seam. The section only renders when non-empty.
- [Prop rename touches six pages] → Mechanical; `tsc` catches every missed site, and page tests assert the second view renders.
- [Home hero copy change breaks tests/e2e asserting "Select Game"] → Tasks include a sweep of `SelectionPage.test.tsx` and `tests/` for the old strings.
- [Native `<input type="date">` bypasses the "no raw inputs" convention] → The convention targets controls that have a shared primitive (`Select`, `LevelSlider`); none exists for dates. Documented in the card; a `DateInput` primitive can be extracted if a second date field appears.

## Migration Plan

1. Apply `20260912000000_add_dgm_tables.sql` (additive; new table + RLS only).
2. Merge the code change; the home page and switcher regroup immediately; the `/digimon` route appears.
3. Run `scripts/update-dgm-data.mjs` via workflow dispatch once the seed is populated, merge the regeneration PR.
4. Rollback: revert the code merge; `DROP TABLE dgm_tracked_devices` if desired — no other table references it.

## Open Questions

- Exact Phase-1 seed rows and whether to include regional re-releases beyond D-Power (US) — resolved in the seed PR, not here.
- Whether the Completion view should also show wishlist counts as a secondary figure. Default: owned only; revisit after use.
- Icon and selection-cover art for the `dgm` card — needs a self-hosted asset the user is happy with (no hotlinking under CSP).
- Whether to keep `update-dgm-data.yml` or replace it with a seed-drift check (see D6). Default: keep until a second contributor needs it or it proves noisy.
- Shape of the future evolution-guide / raising tracker on top of Humulos data — a separate change; it needs the author's consent for any data reuse and is not a catalog concern.
