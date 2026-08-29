## 1. Shared `mintId` helper

- [x] 1.1 Add `mintId({ name, sourceId, pinned, taken, separator, fallbackPrefix })` to `scripts/lib/pipeline.mjs` implementing the D2 resolution order: pinned-by-sourceId → `slugify(name)` → `${fallbackPrefix}${separator}${slugify(String(sourceId))}`
- [x] 1.2 Make `mintId` throw on a collision with `taken`, with an error naming both entities and the colliding id; add the resolved id to `taken` on success (`taken` is a `Map` of id → entity label so the error can name both sides)
- [x] 1.3 Add `mintId` cases to `scripts/lib/pipeline.test.mjs`: pinned id wins over a differing name slug, empty slug falls back to the `sourceId` form, collision throws, non-colliding mints accumulate in `taken`
- [x] 1.4 `npm test` passes with no changes to any update script yet

## 2. N2E — `update-n2e-data.mjs`

- [x] 2.1 Extend `loadExistingCharacters` to capture `sourceId` and return a `bySourceId` map alongside the existing name-keyed `idMap` (D4 bootstrap tier)
- [x] 2.2 Replace `const id = existingIds.get(e.name) ?? slugify(e.name)` with a `mintId` call passing `e.id` as `sourceId`, both pin maps, and a run-scoped `taken` set
- [x] 2.3 Emit `sourceId` immediately after `id` in `generateCharactersTs`, and declare it on the `N2ECharacter` interface in the generated output
- [x] 2.4 Run the script; confirm `git diff src/data/neverness-to-everness/characters.ts` shows added `sourceId` lines and **zero changed `id:` values**

## 3. R1999 — `update-r1999-data.mjs`

- [x] 3.1 Extend `loadExistingArcanists` to capture `sourceId` and return a `bySourceId` map alongside the existing name-keyed `idMap`
- [x] 3.2 Replace `const id = existingIds.get(c.Name) ?? slugify(c.Name)` with a `mintId` call passing `c.Id` as `sourceId`
- [x] 3.3 Emit `sourceId` after `id` in the arcanist codegen and declare it on the generated `Arcanist` interface
- [x] 3.4 Run the script; confirm `git diff src/data/reverse1999/arcanists.ts` shows added `sourceId` lines and **zero changed `id:` values**

## 4. P5X — `update-p5x-data.mjs`

- [x] 4.1 Extend `loadExistingPersonas` to capture `sourceId` and return both a `bySourceId` map and a name-keyed map (P5X currently builds no pin map at all)
- [x] 4.2 Replace `const id = slugify(node.name, '-')` with a `mintId` call passing `node.unitId` as `sourceId` and `separator: '-'`
- [x] 4.3 Emit `sourceId` after `id` in the persona codegen and declare it on the generated `P5xPersona` interface
- [x] 4.4 Run the script; confirm `git diff src/data/persona-5-phantom-x/personas.ts` shows added `sourceId` lines and **zero changed `id:` values**

## 5. Verification

- [x] 5.1 `npm run build` — the added interface field typechecks against every catalog consumer
- [x] 5.2 `npm test` and `npm run lint && npm run format:check` pass
- [x] 5.3 Re-run all three scripts back-to-back; the second run produces no diff at all (minting is idempotent once pinned)
- [x] 5.4 Manually verify the fallback path against real data: temporarily blank one entity's upstream name in a local run and confirm the emitted id is the `sourceId` form, not empty — revert the local edit afterwards
- [x] 5.5 `./node_modules/.bin/openspec validate --all`
- [x] 5.6 Commit script changes and regenerated data together in one commit (D-Migration step 5)
