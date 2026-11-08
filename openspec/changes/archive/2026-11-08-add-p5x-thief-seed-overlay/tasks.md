## 1. Shared helper

- [x] 1.1 Add `applyOverlay(fetched, overlay, keyFn)` to `scripts/lib/pipeline.mjs`: fetched first, then overlay entries whose key is absent; collisions returned as `shadowed`
- [x] 1.2 Cover it in `scripts/lib/pipeline.test.mjs`: append order, shadowed collision keeps the fetched entry, empty overlay is a no-op
- [x] 1.3 Add `validateOverlaySeed(seed, { label, required, rarities })` to `scripts/lib/pipeline.mjs` (array, required fields, kebab-case unique id, rarity set, https-or-null `imageSource`) and cover every rejection in `pipeline.test.mjs`

## 2. P5X script

- [x] 2.1 Add `scripts/seeds/p5x-thieves.json` with the Kotone Shiomi entry
- [x] 2.2 `loadThiefSeed()` in `scripts/update-p5x-data.mjs`: missing file → `[]`; otherwise parse and pass through `validateOverlaySeed` (rarity 4|5) so a malformed seed throws before any codegen
- [x] 2.3 Map fetched details and seed entries to one shape, merge with `applyOverlay`, warn per shadowed seed entry, and run every unit through the existing `ensureAsset` portrait loop
- [x] 2.4 Banner names the seed; workflow PR body mentions it

## 3. Regenerate and document

- [x] 3.1 Run `node scripts/update-p5x-data.mjs`; `thieves.ts` gains `kotone-shiomi` and nothing else changes
- [x] 3.2 Document the seed in `CLAUDE.md` (Catalog Data Sources), `CONTEXT.md` (Update Pipeline), `wiki/Data-Architecture.md`
- [x] 3.3 `npm run lint`, `npm run format:check`, `npm test`, `npx openspec validate --all` pass
