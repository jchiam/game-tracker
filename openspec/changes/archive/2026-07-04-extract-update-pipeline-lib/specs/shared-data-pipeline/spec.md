## ADDED Requirements

### Requirement: Shared update-pipeline helper library

Update scripts SHALL compose the shared helpers in `scripts/lib/pipeline.mjs` — env
loading (`loadLocalEnv`), ImageKit init/existence-check/upload (`initImageKit`),
asset-path derivation (`toImageKitLocation`), reupload-flag parsing
(`parseReuploadFlags`), fetch/download (`fetchJSON`, `downloadImage`), id and string
helpers (`slugify`, `esc`), catalog diffing (`diffByKey`, `formatDiff`), and the
generated-file banner (`generatedHeader`) — instead of carrying private copies. The lib
SHALL be the only implementation of this plumbing; game-specific fetching, data mapping,
and codegen bodies stay in each script.

#### Scenario: Scripts share one ImageKit implementation

- **WHEN** the ImageKit existence check or upload behaviour needs to change
- **THEN** the change is made once in `scripts/lib/pipeline.mjs` and applies to every
  game's update script

#### Scenario: New game script composes the lib

- **WHEN** a new game's `update-{game}-data.mjs` is written (e.g. the pending AE
  pipeline)
- **THEN** it imports the lib helpers rather than copying plumbing from an existing
  script

#### Scenario: Pure helpers are unit tested

- **WHEN** `npm test` runs
- **THEN** `scripts/lib/pipeline.test.mjs` verifies the pure helpers (slugify, esc,
  toImageKitLocation, diff/format, reupload-flag parsing, generated header) and the
  ImageKit-disabled early-return path
