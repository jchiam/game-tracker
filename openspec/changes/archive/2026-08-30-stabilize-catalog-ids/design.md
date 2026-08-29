## Context

Three update scripts mint catalog `id`s from the entity display name:

```
n2e:420    const id = existingIds.get(e.name) ?? slugify(e.name);
r1999:444  const id = existingIds.get(c.Name) ?? slugify(c.Name);
p5x:225    const id = slugify(node.name, '-');            // no pinning at all
```

N2E and R1999 already attempt a pin — `existingIds` is built by `loadExisting*` regex-parsing the
previously generated `.ts` file — but the map is keyed by **name** (`n2e:155`, `r1999:126`). A rename
misses the map and falls through to a fresh slug, which is exactly the failure being fixed. P5X has no
pin at all, so every rename re-mints.

The minted `id` is the FK stored in `{game}_tracked_{entities}.{entity}_id` and
`{game}_party_members.character_id` (TEXT columns, e.g.
`supabase/migrations/20260515000000_add_n2e_tables.sql:6,53`), and is also the asset filename on
ImageKit and the key for script-local override maps (N2E's `CROP_OVERRIDES`, `IMAGE_OVERRIDES` in
`characterOverrides.ts`). It is a load-bearing identity in four places at once.

When the catalog id moves, `rosterPersistence.ts:58` drops the orphaned row with no signal:

```ts
const base = config.catalog.find((entry) => entry.id === row[config.entityIdColumn]);
if (!base) return null;
```

Every upstream source already exposes a stable key the scripts have on hand — N2E `e.id` (already used
in `skipIds` / `ALT_VARIANTS`), R1999 `c.Id` (already used to build image URLs at `r1999:475,487`),
P5X `node.unitId` (already used to match srcset images at `p5x:216`). None of them is currently
persisted into the catalog.

HSR, ZZZ, and AE are unaffected — they key off upstream ids or hand-curated stable ids already.

## Goals / Non-Goals

**Goals:**

- A minted catalog `id`, once assigned, never changes for the life of the entity.
- An entity whose name slugifies to nothing still gets a usable, unique id.
- A duplicate minted id fails the run loudly instead of producing a corrupt catalog.
- Zero id-value churn on the migration run — every existing entity keeps the id it has today.
- One shared implementation, so a fourth script inherits the guarantee for free.

**Non-Goals:**

- Recovering DB rows already orphaned by a past rename (Zankou's `character_id: ''`). That needs an
  alias map and is explored separately.
- Making `rosterPersistence` surface unmatched rows instead of silently dropping them.
- Changing any id that exists today, including ugly ones this change may mint in future.
- Touching HSR / ZZZ / AE scripts.

## Decisions

### D1: Persist the upstream key in the catalog, not in a sidecar ledger

The pin map is rebuilt each run from the previously generated file. For that to key off `sourceId`,
`sourceId` must be written somewhere durable.

**Chosen:** add a `sourceId` field to each generated entry and its interface.

**Alternative considered:** a committed sidecar `scripts/data/{game}-id-pins.json` mapping
`sourceId → id`. It keeps the app-facing catalog interface clean and replaces regex parsing with a
JSON read. Rejected because it splits the identity record across two files that can silently desync —
if the sidecar is deleted or missed in a rebase, ids re-mint from names and the original bug returns
with no visible signal. Embedding in the catalog means the identity record cannot be lost without
losing the catalog itself.

Cost accepted: the app-facing interfaces (`N2ECharacter`, `Arcanist`, `P5xPersona`) gain a field the
app never reads.

### D2: `mintId` signature and fallback shape

```
mintId({ name, sourceId, pinned, taken, separator = '_', fallbackPrefix })
```

Resolution order:

1. `pinned.get(String(sourceId))` — the previously minted id. Wins unconditionally.
2. `slugify(name, separator)` — first sighting, normal path.
3. `` `${fallbackPrefix}${separator}${slugify(String(sourceId), separator)}` `` — when step 2 is empty.

Then: if the result is already in `taken`, throw naming both entities and the id. Otherwise add to
`taken` and return.

`taken` is a caller-owned `Map` of `id → entity label`, threaded through the entity loop, so collision
detection is per-run and the error can name _both_ colliding entities. A `Set` would only name the
second one.

`slugify` keeps its current signature and remains available for non-identity slugs (N2E's
`zero-female` variant slug, lookup keys). It is simply no longer called directly at an id site.

### D3: The fallback id is permanent, and that is deliberate

Had this been in place, Zankou would have been minted `unnamed_1046` while its name was `残虹`, and it
would still be `unnamed_1046` today — an ugly id forever, since D1 forbids re-minting on the later
localization to `Zankou`.

**Alternative considered:** skip entities whose name doesn't slugify, and admit them to the catalog
only once upstream localizes. Rejected — that is precisely the case the user hit: they wanted to track
the half-crafted entity early. Withholding it from the catalog trades a cosmetic wart for a missing
feature.

The id is never shown to the user (cards render `name`), so the wart is confined to generated source
and an ImageKit filename. Promoting a fallback id to a pretty one later is an id change by definition,
and therefore blocked until the alias/recovery layer exists — at which point it becomes a safe,
deliberate, one-off operation.

### D4: Name-keyed lookup is retained as a bootstrap tier

The migration run reads generated files that have **no** `sourceId` yet, so a pure sourceId-keyed pin
map would be empty on that run — every entity would fall through to `slugify(name)`. For most entities
that reproduces the current id, but any entity whose present id was pinned against an _older_ name
would silently re-mint and break exactly the tracking this change protects.

So `loadExisting*` returns both maps, and the resolution order is `bySourceId → byName → slugify`.
After the migration run every entry carries a `sourceId` and tier 2 never fires again; it is kept as a
cheap safety net for a catalog file that predates the field.

### D5: Collisions throw; the weekly workflow is expected to fail

A duplicate id means the upstream data cannot be represented faithfully, and emitting it corrupts the
catalog (`UNIQUE(profile_id, character_id)` then makes one of the two entities untrackable — the
`残虹`/`灵可` case). The script throws before writing any file, so the run leaves the repo untouched
and the weekly auto-PR workflow fails visibly. A failed workflow is the intended outcome: it demands a
human decision, which is strictly better than the silent corruption it replaces.

### D6: Field placement and the regex parsers

`loadExisting*` parses the script's own generated output with positional regexes whose `[^}]*?` runs
cannot cross an entry's closing `}`. `sourceId` is emitted immediately after `id` in every entry, and
each parser's regex gains a capture group in that position. Emitting it adjacent to `id` keeps the
identity pair legible in diffs and keeps the regex edit to one spot per script.

### D7: The parsers must accept both quote styles (found during implementation)

The existing `loadExisting*` regexes match `name: '...'` only, but `jsStr` emits **double** quotes for
any name containing an apostrophe. Those entries have therefore never parsed. In the pre-existing code
the only symptom was a cosmetic one — the N2E run reports `Arcs: +4 added` on every run for the four
apostrophe-bearing arcs, though `arcs.ts` is written unchanged.

Under this change the same flaw becomes load-bearing: an unparsed entry contributes no `sourceId` pin,
so its id would be re-minted from the current name — the exact silent desync this change exists to
prevent. Every id-pinning parser (N2E characters, R1999 arcanists, P5X personas) therefore takes P5X's
already-quote-agnostic name pattern, plus backslash unescaping.

The identical flaw in the **non-pinning** parsers (`loadExistingArcs`, `loadExistingCartridges`,
`loadExistingPsychubes`) is left alone — it affects only a diff-summary line, touches no identity, and
is out of scope here.

### D8: `sourceId` is a required field, not optional

Making it optional would have avoided all test-fixture churn, since no app code reads it. Rejected: the
generator always emits it, so an optional type would misdescribe the data to buy convenience in tests.
Cost paid once: `sourceId` added to catalog-shaped fixtures in 11 test files (~24 sites), mechanical
and covered by `tsc`.

## Risks / Trade-offs

- **Migration run silently re-mints an id** → D4's name-keyed bootstrap tier prevents it; the task list
  gates the migration commit on a `git diff` showing zero changed `id:` values across the three data
  files. Any id-line change in that diff is a stop-and-investigate.
- **Regex parsers are brittle and now parse one more field** → Contained: the parsers are already this
  shape, the change is one capture group each, and a parser that fails to match degrades to an empty
  pin map — which D4's name tier then covers, and which the migration diff gate would catch.
- **Permanent ugly ids from the fallback path** (D3) → Accepted. Confined to generated source and an
  asset filename; never user-visible; resolvable once the alias layer lands.
- **A hard failure blocks the weekly data refresh** (D5) → Intended. The failure mode it replaces is
  undetected data corruption.
- **`sourceId` is dead weight in the app's type surface** (D1) → Accepted for single-source-of-truth.
  It is also the field a future alias/recovery layer would want.
- **Nothing prevents a fourth script from calling `slugify` at an id site** → Only convention and the
  spec. A lint rule is out of proportion for six scripts.

## Migration Plan

1. Land `mintId` + tests in `scripts/lib/pipeline.mjs` — no behaviour change on its own.
2. Per script, in isolation: extend `loadExisting*` to parse and return `sourceId`, switch the id site
   to `mintId`, emit `sourceId` in codegen.
3. Run each script locally and inspect `git diff` on its data file. Expected: added `sourceId` lines,
   plus whatever genuine upstream drift occurred. **Not expected: any changed `id:` value.** Investigate
   before committing if one appears.
4. `npm run build` + `npm test` — the added interface field must typecheck against app consumers.
5. Commit the code and the regenerated data together, so no run in between sees a `sourceId`-less
   catalog with a `sourceId`-expecting script.

**Rollback:** revert the commit. Ids are unchanged by this change, so a revert restores the prior
(fragile) behaviour without touching any stored FK.
