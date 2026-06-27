## Why

Arknights: Endfield is the only game without an automated data/asset update
pipeline. HSR, R:1999, and N2E each ship a `scripts/update-{id}-data.mjs` plus a
weekly GitHub Actions workflow that regenerate the static catalog, upload images
to ImageKit, and open an auto-PR. AE was launched in Phase 1 with only a one-shot
`scripts/seed-ae-images.mjs` (hardcoded ~28 operator names, image upload only — no
catalog regeneration, no workflow) and a **hand-authored** `operators.ts`. This was
an explicit Phase-1 deferral; this change tracks the Phase-2 debt so AE converges on
the per-game update pattern once a stable structured data source exists.

## What Changes

- Add `scripts/update-ae-data.mjs` following the per-game update-script pattern: fetch
  the operator catalog from an external source, regenerate `src/data/arknights-endfield/operators.ts`,
  download portraits, and upload them to ImageKit (idempotent skip-if-exists), with
  granular `--reupload-*` flags matching the other scripts.
- Add `.github/workflows/update-ae-data.yml`: weekly cron + manual dispatch, runs the
  script, formats generated files, and opens an auto-PR — mirroring `update-n2e-data.yml`.
- Convert `operators.ts` from hand-authored to auto-generated (header changes to the
  "do not edit — run the script" banner used by the other catalogs).
- Decommission the one-shot `scripts/seed-ae-images.mjs` once `update-ae-data.mjs` covers
  image upload.

## Capabilities

### New Capabilities

- `ae-data-pipeline`: Automated catalog regeneration + ImageKit asset upload for
  Arknights: Endfield via `update-ae-data.mjs` and a weekly GitHub Actions workflow.

## Impact

- **New code**: `scripts/update-ae-data.mjs`, `.github/workflows/update-ae-data.yml`.
- **Modified code**: `src/data/arknights-endfield/operators.ts` (becomes generated).
- **Removed code**: `scripts/seed-ae-images.mjs` (superseded).
- **Infra**: reuses the existing `arknights_endfield` ImageKit folder and the
  `IMAGEKIT_*` GitHub secrets; no new external image domain (already allowlisted in CSP).
- **Blocked on**: a stable structured AE data source. `operators.ts:2` notes the catalog
  is hand-maintained "until a stable structured data source exists" — this change cannot
  be implemented until that source is identified (e.g. a Prydwen/wiki endpoint with a
  parseable operator list).
- **No breaking changes** to existing games.
