## Why

The three per-game update scripts (`update-hsr-data.mjs`, `update-r1999-data.mjs`,
`update-n2e-data.mjs`) each carry a verbatim copy of the same pipeline plumbing:
`.env.local` loading, the ImageKit env fallback chain + client init + enabled/skipped
logging, `toImageKitLocation` / `existsOnImageKit` / `uploadToImageKit` (three identical
copies), `fetchJSON`, buffer-returning image download, `slugify` (differing only by
separator), `esc`, `--reupload-*` flag parsing, added/removed catalog diffing, and the
"Auto-generated — do not edit" header. That is ~350 duplicated lines; a fix to any of it
(e.g. the ImageKit existence check) must be applied three times, and the pending
`add-ae-data-pipeline` change would create a fourth copy.

## What Changes

- Add `scripts/lib/pipeline.mjs`: shared update-pipeline helpers — `ROOT`,
  `loadLocalEnv()`, `initImageKit()` (returns `{ enabled, existsOnImageKit,
uploadToImageKit }`), `toImageKitLocation`, `parseReuploadFlags`, `fetchJSON`,
  `downloadImage`, `slugify(name, separator)`, `esc`, `diffByKey`, `formatDiff`,
  `generatedHeader`.
- Refactor the three update scripts to import from the lib, deleting their local copies.
  Game-specific logic (GraphQL client, headicon lookup, avatar merging, codegen bodies)
  stays in each script.
- Add `scripts/lib/pipeline.test.mjs` unit-testing the pure helpers and the
  ImageKit-disabled path.
- No behaviour change: generated file contents, entity IDs, ImageKit folders/filenames,
  CLI flags, and workflows are unchanged. (Only cosmetic log-line unification for
  reupload-mode messages.)

## Capabilities

### Modified Capabilities

- `shared-data-pipeline`: adds the shared helper-library requirement — update scripts
  compose `scripts/lib/pipeline.mjs` instead of carrying private copies of the pipeline
  plumbing.

## Impact

- **New code**: `scripts/lib/pipeline.mjs`, `scripts/lib/pipeline.test.mjs`.
- **Modified code**: `scripts/update-hsr-data.mjs`, `scripts/update-r1999-data.mjs`,
  `scripts/update-n2e-data.mjs` (each loses ~120 lines of boilerplate).
- **Untouched**: `.github/workflows/update-*.yml` (same CLI contract),
  `scripts/seed-ae-images.mjs` (superseded by the pending `add-ae-data-pipeline`
  change — not worth migrating), `src/data/**` (no regeneration in this change).
- **Unblocks**: `add-ae-data-pipeline` gets the plumbing for free when its data source
  exists.
