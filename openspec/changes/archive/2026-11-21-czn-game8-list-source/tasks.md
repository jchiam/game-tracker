# Tasks

## 1. Game8 source module

- [x] 1.1 Add `scripts/lib/czn-game8.mjs` with `extractCollectionMapping(html)`, `collectionMappingUrl`, `mapGame8Combatants(json, { pinned })`, `mapGame8Partners(json, { pinned })`, `buildIdPins`, and `missingIds`; verify `scripts/lib/czn-game8.test.mjs` covers a valid fixture, an unreleased item, unknown class/attribute (emitted + reported), missing class/attribute, an unexpected rarity, an empty list, a duplicate id, a pinned id, unused pins, malformed pins, and a page without props.

## 2. Script

- [x] 2.1 Rewrite `processCombatants` in `scripts/update-czn-data.mjs`: Game8 list → mapping JSON → `mapGame8Combatants`; Prydwen list joined on non-`Unknown` nodes, detail fetched only for joined slugs; Game8 `imageUrl` fallback with a warning unless reuploading combatants (then abort); seed overlay with the shadow warning naming Game8.
- [x] 2.2 Rewrite `processPartners` the same way over Game8's Partner list, with Prydwen static-query icons joined by minted id and the same degrade/abort rule under `--reupload-partners`.
- [x] 2.3 Add `scripts/seeds/czn-id-pins.json` (`lilian`, `westmaccot`) and load it through `buildIdPins`; warn on unused pins and on unknown taxonomy values.
- [x] 2.4 Add the removal guard (`assertNoRemovals`) to combatants, Partners, and Memory Fragment sets, before any upload or codegen, overridable with `--allow-removals`; verify that removing the `lilian` pin aborts the run naming `lilian` and leaves `partners.ts` unchanged.
- [x] 2.5 Empty `scripts/seeds/czn-combatants.json` and `czn-partners.json` to `[]`; run the script and verify 40 combatants / 51 Partners / 22 sets, no removals, no shadow or unknown-taxonomy warnings, every asset `skipped`, and that the catalog diffs touch only faction values, the two Partner display names, the banners, and the Blazebell / Vivian entries.

## 3. Docs and gates

- [x] 3.1 Rewrite the combatant and Partner bullets of CLAUDE.md "Catalog Data Sources (`czn`)", the workflow PR body, and the wiki pages for the Game8/Prydwen split, the pin file, the removal guard, and the seeds' new role.
- [x] 3.2 Run `npm test`, `npm run lint`, `npm run format:check`, `npx openspec validate --all`.
