## 1. Shared library

- [x] 1.1 Create `scripts/lib/pipeline.mjs` with `ROOT`, `loadLocalEnv`, `initImageKit`, `toImageKitLocation`, `parseReuploadFlags`, `fetchJSON`, `downloadImage`, `slugify`, `esc`, `diffByKey`, `formatDiff`, `generatedHeader`

## 2. Refactor scripts

- [x] 2.1 `update-hsr-data.mjs`: import lib, delete local copies, `slugify(name, '-')`, `downloadImage` + explicit `writeFile`
- [x] 2.2 `update-r1999-data.mjs`: import lib, delete local copies
- [x] 2.3 `update-n2e-data.mjs`: import lib, delete local copies (keep `fetchGraphQL`, `mergeAvatars`)

## 3. Tests

- [x] 3.1 Add `scripts/lib/pipeline.test.mjs` covering pure helpers + ImageKit-disabled path

## 4. Verify

- [x] 4.1 `node --check` all three scripts + lib
- [x] 4.2 `npm test`, `npm run lint`, `npm run format:check`, `npm run build` green; coverage thresholds still met

## 5. Docs and spec sync

- [x] 5.1 CLAUDE.md: update-script layer description + Key Files row for `scripts/lib/pipeline.mjs`
- [x] 5.2 Apply delta to `openspec/specs/shared-data-pipeline/spec.md`, archive change, `npx openspec validate --all`
