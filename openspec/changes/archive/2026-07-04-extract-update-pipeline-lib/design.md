## Context

Every update script is plain Node ESM run directly (`node scripts/update-*.mjs`) — no
build step, no `@/` alias. The duplicated plumbing is byte-identical across scripts
except: `uploadToImageKit` (HSR passes a `mimeType`, others hardcode webp), `slugify`
(HSR uses `-` separator + a redundant `[•·]` pre-replace; R1999/N2E use `_`), and
reupload-flag wiring (different flag names per script, same shape).

## Decisions

### 1. Single module at `scripts/lib/pipeline.mjs`

One file, plain named exports — mirrors how the scripts consume it (a flat toolbox), and
keeps the scripts' zero-build constraint. No barrel, no split into imagekit/codegen
modules: the whole lib is ~180 lines; splitting adds import ceremony for nothing.

### 2. `initImageKit()` factory, explicit `loadLocalEnv()`

The current scripts init a module-level client at import time with console side effects.
The lib instead exposes:

- `loadLocalEnv()` — the `process.loadEnvFile('.env.local')` try/catch. Explicit call
  (not an import side effect) so importing the lib in Vitest doesn't mutate the test
  env with real ImageKit keys.
- `initImageKit()` — reads the `IMAGEKIT_*` / `VITE_IMAGEKIT_*` fallback chain **at call
  time**, logs enabled/skipped, and returns `{ enabled, existsOnImageKit,
uploadToImageKit }` closed over the client (or `null`). Call-time env read makes the
  disabled path unit-testable with `vi.stubEnv`.

`uploadToImageKit(buffer, localAssetPath, mimeType = 'image/webp')` — HSR's mimeType
variant becomes the general signature.

### 3. `slugify(name, separator = '_')`

HSR calls `slugify(name, '-')`. Its old `[•·]` pre-replace is provably redundant (`•`/`·`
are already caught by `[^a-z0-9]+`), so outputs are byte-identical — critical because
slugs are Supabase FK ids. R1999/N2E use the default.

### 4. `parseReuploadFlags(types, argv = process.argv.slice(2))`

Returns `{ all, flags }` where `flags[type] = all || --reupload-{type}` for each declared
type, and logs `Reupload mode: all assets` or the joined active types. Injectable `argv`
for tests. Log wording unifies the three slightly different formats — cosmetic only; the
flag semantics (`--reupload-all` implies every per-type flag) are preserved exactly.

### 5. Diff/report and header helpers

`diffByKey(existing, next, keyFn)` → `{ added, removed }` and `formatDiff(added,
removed)` → `'+X added, -Y removed' | 'no changes'` replace six inline copies.
`generatedHeader(source, scriptName)` returns the two banner comment lines; scripts
append extra game-specific comment lines where they exist today (R1999 arcanists).

### 6. What stays per-game

N2E's `fetchGraphQL` (POST + GraphQL error unwrap, one consumer), R1999's headicon
lookup + Fandom batch fetchers, N2E's `mergeAvatars` (sharp), all `generate*Ts` bodies,
and all `main()` orchestration. HSR's `downloadBinary` (download **and** write local
file) becomes `downloadImage` + an explicit `writeFile` in the HSR script — the local
write is HSR-specific behaviour.

`scripts/seed-ae-images.mjs` is not migrated: the active `add-ae-data-pipeline` change
deletes it once a real AE update script exists.

### 7. Testing

`scripts/lib/pipeline.test.mjs` — Vitest picks up `.test.mjs` (default include, no
`tests/` path). Covers the pure helpers (`slugify` both separators, `esc`,
`toImageKitLocation`, `diffByKey`, `formatDiff`, `generatedHeader`,
`parseReuploadFlags` with injected argv) plus `initImageKit()` disabled semantics via
`vi.stubEnv`. Network paths (`fetchJSON`, `downloadImage`, live ImageKit calls) are not
unit-tested — same as today. Script behaviour is verified statically (`node --check`,
diff review); the scripts are not run because they hit external APIs and would
regenerate `src/data/**` / upload assets.
