## Why

Catalog `id`s in three update scripts are derived from the entity's **display name**, which upstream
sources change without warning — so a rename silently breaks the identity that every tracked row,
party slot, and preference row is keyed on.

This already caused data loss. N2E's Zankou shipped from everness.info with an untranslated CJK name
(`残虹`); `slugify` strips all non-`[a-z0-9]` characters, so it minted `id: ''`. A character tracked
against that entry stored `character_id: ''` in `n2e_tracked_characters`. When upstream localized the
name to `Zankou` (commit `d03ec0e`), the id became `zankou`, and `rosterPersistence.ts:58`
(`if (!base) return null`) silently dropped the now-orphaned row from the roster. The same generation
also minted `id: ''` for two different characters (`残虹` and `灵可`), which under
`UNIQUE(profile_id, character_id)` made only one of them trackable at all.

Every upstream source already exposes a stable numeric/opaque key. The scripts just aren't using it.

## What Changes

- **Pin minted ids to the upstream source key, not the display name.** Generated catalogs gain a
  `sourceId` field carrying the upstream key. On each run, a script looks up the previously minted id
  by `sourceId`; the slug is only computed the first time an entity is seen. Once minted, an id never
  changes, whatever upstream does to the name.
  - `update-n2e-data.mjs` — esper `e.id`
  - `update-r1999-data.mjs` — kornblume `c.Id`
  - `update-p5x-data.mjs` — prydwen `node.unitId` (currently has no pinning at all)
- **Add a shared `mintId` helper to `scripts/lib/pipeline.mjs`.** Replaces bare `slugify` at id sites:
  never returns an empty id (falls back to a `sourceId`-derived form when the name slugifies to
  nothing), and hard-fails the run on a duplicate id rather than emitting a colliding catalog.
- **Regenerate the three catalogs** so `sourceId` is populated and existing ids are pinned to it.
  Existing id values are preserved as-is — this migration mints no new ids for known entities.

Not breaking for the app: `sourceId` is additive, and no existing catalog id changes value.

**Out of scope** (explored separately): recovering DB rows already orphaned by a past rename — the
`character_id: ''` Zankou row remains invisible after this change. This proposal stops the bleeding;
it does not heal the wound.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `shared-data-pipeline`: adds requirements that script-minted catalog ids are pinned to a stable
  upstream source key and are stable across upstream renames; that a minted id is never empty; and
  that a duplicate minted id fails the run.

## Impact

- `scripts/lib/pipeline.mjs` — new `mintId` export; `slugify` unchanged.
- `scripts/lib/pipeline.test.mjs` — cases for `mintId` (empty-slug fallback, collision failure,
  pin-wins-over-name).
- `scripts/update-n2e-data.mjs`, `scripts/update-r1999-data.mjs`, `scripts/update-p5x-data.mjs` —
  id derivation, `loadExisting*` parsers (must read `sourceId`), and catalog codegen.
- `src/data/neverness-to-everness/characters.ts`, `src/data/reverse1999/arcanists.ts`,
  `src/data/persona-5-phantom-x/personas.ts` — regenerated with a `sourceId` field on the interface
  and every entry.
- No DB migration. No change to `src/services/rosterPersistence.ts`, hooks, or components.
- Unaffected scripts: `update-hsr-data.mjs`, `update-zzz-data.mjs`, `update-ae-data.mjs` already key
  off upstream ids or hand-curated stable ids.
