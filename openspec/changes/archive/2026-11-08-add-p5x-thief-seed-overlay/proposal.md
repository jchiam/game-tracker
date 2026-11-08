## Why

The P5X thief catalog is generated solely from Prydwen's CloudFront origin build. That build's
page-data was last modified 2026-04-27 and `www.prydwen.gg` now returns `410 Gone` for Gatsby
page-data, so the origin is a frozen snapshot: every weekly run since has reported
`60 characters listed (no changes)`. Kotone Shiomi (P3P collab, v4.10, 2026-09-24) — and any unit
released after April — can never reach the catalog, so a player cannot track her at all.

The pipeline needs a way to carry thieves the source lacks without hand-editing `src/data`, and
without losing them (or orphaning tracked rows) when the source eventually catches up.

## What Changes

- **Overlay seed `scripts/seeds/p5x-thieves.json`.** A hand-curated JSON array of thieves Prydwen
  does not list. Each entry carries the full `P5xThief` shape, an `imageSource` (https URL for the
  card art, or `null` while none is sourced) and a free-text `note`. The entry's `id` is the slug
  Prydwen will assign the unit, so the DB rows keyed on it survive the hand-off.
- **Script merges the overlay after the fetched list.** `update-p5x-data.mjs` validates the seed
  (required fields, kebab-case id, unique ids, rarity 4|5, https-or-null `imageSource`) before any
  codegen via a new shared `validateOverlaySeed` helper, maps fetched and seed entries to one
  shape, merges them with a new shared `applyOverlay(fetched, overlay, keyFn)` helper (both in
  `scripts/lib/pipeline.mjs`), and runs every
  entry through the same `ensureAsset` portrait loop. Upstream wins on an id collision; the run
  warns to delete the shadowed seed entry.
- **Seed the first overlay entry:** Kotone Shiomi (`kotone-shiomi`, 5★ Fire, Orpheus, role
  `Buffer`), card art sourced from lufel.net.
- Generated-file banner, workflow PR body, `CLAUDE.md`, `CONTEXT.md` and the wiki name the seed.

Out of scope: replacing the frozen Prydwen origin with a live source (the AE pipeline shares the
same origin and is frozen the same way). This change makes the gap curable by hand; it does not
reopen the tap.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `p5x-thief-catalog`: adds the overlay-seed requirement and extends the update script
  requirement with the merge step and seed validation.

## Impact

- `scripts/lib/pipeline.mjs` — new `applyOverlay` and `validateOverlaySeed` exports; `scripts/lib/pipeline.test.mjs` cases.
- `scripts/update-p5x-data.mjs` — seed loading/validation, unified fetched + overlay portrait loop.
- `scripts/seeds/p5x-thieves.json` — new; one entry.
- `src/data/persona-5-phantom-x/thieves.ts` — regenerated: 61 entries, new banner line.
- `.github/workflows/update-p5x-data.yml` — PR body mentions the seed.
- Docs: `CLAUDE.md`, `CONTEXT.md`, `wiki/Data-Architecture.md`.
- No DB migration; no app code change (`ALL_THIEVES` consumers are shape-agnostic).
