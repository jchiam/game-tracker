# Tasks

## 1. Meta Decks source module

- [x] 1.1 Add `scripts/lib/czn-metadecks.mjs` with: catalog-URL extraction from the characters page HTML, catalog parsing, the name/id join (design D4), and portrait / face-icon URL builders. Verify with `scripts/lib/czn-metadecks.test.mjs` against an inline page fixture and catalog fixture, covering: URL found, URL missing throws a named error, join by normalized name, join by id slug, unreleased entries ignored.
- [x] 1.2 Add `scripts/seeds/czn-art-overrides.json` as `{ "combatants": [] }` and its validation in `scripts/lib/czn-seeds.mjs` (malformed entry, duplicate id, `face` box outside 804×924 abort; unknown `id` / `charId` warn at join time). Verify with new cases in `scripts/lib/czn-seeds.test.mjs` and `czn-metadecks.test.mjs`.

## 2. Face crop module

- [x] 2.1 Add `scripts/lib/czn-face-crop.mjs` with `trimPortrait`, `locateFace` (template match, design D2), `cutFace` (box → ≤256 px webp, never upscaled), `topSquareFace`, and `buildFace`, ported from the dry-run scripts. Verify with `scripts/lib/czn-face-crop.test.mjs` using synthetic cut-outs drawn in the test (no game art committed): the located box lands within a few pixels of the expected box, a mismatched icon reports low confidence, a manual box bypasses matching, and the fallback top-square crop works on a non-alpha image.
- [x] 2.2 Settle the confidence threshold against real art and record the chosen value and its reason in a comment beside the constant. Verified: own-icon error 6.1–23.2 and cross-unit error ≥29.0 over all 40 combatants; threshold 26; `tiphera` crops from the portrait.

## 3. Update script

- [x] 3.1 In `scripts/update-czn-data.mjs`, resolve combatant portraits in the order Meta Decks → Prydwen → Game8, trim Meta Decks portraits before upload, fetch Prydwen only when a combatant lacks a Meta Decks portrait, and apply the failure rules in design D5. Verified with a run with uploads disabled (`IMAGEKIT_PRIVATE_KEY=` empty): no catalog diff, `40 portraits from CZN Meta Decks, 0 from Prydwen card art, 0 from Game8`, no Prydwen detail fetches logged. The `skipped` path against live ImageKit is covered by 6.2.
- [x] 3.2 Add the second `ensureAsset` loop for `chaos_zero_nightmare/combatant-faces` with the face work inside its fetch closure, and the `--reupload-combatant-faces` flag (`--reupload-combatants` and `--reupload-all` also force faces). Verified in the same uploads-disabled run: 40 faces built, 0 failed, no icon fallbacks, counts printed.
- [x] 3.3 Update the script header comment, the usage lines, the generated-file banner attribution, and the workflow PR body to name CZN Meta Decks. Verified: the regenerated `combatants.ts` differs only in the banner line.
- [x] 3.4 Update the `Catalog Data Sources (czn)` section of `CLAUDE.md` (portraits bullets, the override seed, the new flag, the face asset), and `wiki/Data-Architecture.md` and `wiki/Development.md` in the wiki submodule. `CONTEXT.md` does not name the CZN art source, so it needs no change. Verified by re-reading each against `specs/czn-data-pipeline/spec.md`.

## 4. App

- [x] 4.1 Add `getCznCombatantFaceUrl` to `src/lib/imagekit.ts` with local-path and ImageKit-URL tests in `src/lib/imagekit.test.ts`. Verified: `npx vitest run src/lib/imagekit.test.ts` passes.
- [x] 4.2 Point `resolveSlotImage` and `resolveListImage` in `src/pages/chaos-zero-nightmare/components/PartiesTab.tsx` at it and update `PartiesTab.test.tsx`. Verified: `npx vitest run src/pages/chaos-zero-nightmare/components/PartiesTab.test.tsx` passes.
- [x] 4.3 Check whether any other CZN surface shows a combatant at avatar size and switch it to the face image if so. Verified by grep under `src/pages/chaos-zero-nightmare`: the only combatant image surfaces are the roster card header (portrait, unchanged) and the two party resolvers; the add modal shows no image.

## 5. Dry-run cleanup

- [x] 5.1 Delete `public/assets/chaos-zero-nightmare/combatants`, `combatant-faces`, `partners`, and `fragment-sets`, and `.env.czn-dry.local`. Verified: `git status --short` shows no untracked files under `public/assets/`.

## 6. Production assets and integration

- [x] 6.1 Save the 40 current portrait originals (`?tr=orig-true`) outside the repo as the rollback copy. Verified: 40 non-empty files in `C:\Users\Admin\Documents\czn-portrait-backup-2026-11-22`.
- [x] 6.2 With the owner's explicit go-ahead, run `node scripts/update-czn-data.mjs --reupload-combatants`. Verify the output reports 40 portraits and 40 faces uploaded, zero failed, and lists any icon fallbacks. Done 2026-11-22: 40 portraits and 40 faces uploaded, 0 failed, no icon fallbacks.
- [x] 6.3 Run `npm run dev` against production ImageKit and check the CZN roster, the parties tab, and the party editor picker at desktop width. Verify portraits are frameless and sharp and every slot shows a face. Confirmed by the owner 2026-11-22, after purging the ImageKit cache for the 40 portrait URLs and clearing the browser cache.
- [x] 6.4 Run `npx openspec validate --all`, `npm run lint`, `npm run format:check`, `npm test`, and `npm run build`. Verify all pass.

## 7. Verification follow-ups

- [x] 7.1 Extract the source order, failure rules, reupload modes, and face asset loop into `scripts/lib/czn-combatant-art.mjs` with injected fetchers, and cover the failure-rule and face scenarios in `scripts/lib/czn-combatant-art.test.mjs`. Verified: `npx vitest run scripts/lib` passes, and a normal run against live ImageKit still skips all 40 portraits and 40 faces.
- [x] 7.2 Document that a reupload does not refresh the CDN or browser cache, and how to purge, in `CLAUDE.md` and `wiki/Data-Architecture.md`. Verified by re-reading both against what was done on 2026-11-22.
- [x] 7.3 Run `npm run test:e2e` once. Verified 2026-11-22: 66 passed.
