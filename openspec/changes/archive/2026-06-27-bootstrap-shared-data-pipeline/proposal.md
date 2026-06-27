## Why

Every game follows the same data/asset update pattern (CLAUDE.md → "Update script" and
"Image Pipeline"): a `scripts/update-{game}-data.mjs` that fetches from external sources,
downloads images, uploads them to ImageKit, and regenerates `src/data/{game}/*.ts`, paired with a
weekly `.github/workflows/update-{game}-data.yml` that auto-PRs the result. This contract is
implemented for HSR, N2E, and R1999 but specced only in fragments — `hsr-imagekit-upload`
(HSR-only write path) and `n2e-cartridge-catalog` (N2E-only data file). There is no shared
capability for the cross-game pattern, and the "never hand-edit `src/data/**`" invariant is
asserted nowhere as a requirement. This bootstrap captures the shared write/update half of the
asset pipeline.

## What Changes

- Create new spec `shared-data-pipeline`: the canonical update-script contract (regenerate
  `src/data/{game}/*.ts` from external sources, idempotent ImageKit upload with `--reupload-*`
  overrides, ImageKit-optional regeneration), the generated-data invariant (`src/data/**` is
  never hand-edited), the local-path storage convention that seams to `shared-image-pipeline`, and
  the weekly auto-PR GitHub Actions workflow.

No application code is changed. This is documentation only. The runtime read path (resolving a
stored `/assets/` path to an ImageKit URL) stays owned by `shared-image-pipeline` and is
cross-referenced, not restated.

## Capabilities

### New Capabilities

- `shared-data-pipeline`: the build-time write/update half of the asset pipeline — per-game update
  scripts that regenerate static data files and idempotently upload assets to ImageKit, the
  never-hand-edit-`src/data` invariant, and the weekly auto-PR workflow.

### Modified Capabilities

None — one all-new capability.

## Impact

- `scripts/update-{hsr,n2e,r1999}-data.mjs` — source for the update-script requirements.
- `.github/workflows/update-{hsr,n2e,r1999}-data.yml` — source for the workflow requirement.
- `src/data/{game}/*.ts` — the generated artifacts the invariant protects.
- `shared-image-pipeline` — the read-path capability this one seams to via the `/assets/{game}/`
  path convention; referenced, not modified.
- Out of scope: Arknights: Endfield has no `update-ae-data.mjs` or workflow yet (assets seeded
  one-off via `scripts/seed-ae-images.mjs`); bringing AE onto the pattern is a separate
  implementation change, not this documentation bootstrap.
