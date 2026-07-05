## 1. Identify data source

- [x] 1.1 Find a stable structured AE operator source (Prydwen/wiki endpoint or GitHub data repo) exposing a parseable operator list with id, name, rarity, class, element, weapon — Prydwen Gatsby page-data via CloudFront origin (`/page-data/arknights-endfield/characters/page-data.json`), same source as P5X; list nodes carry all fields
- [x] 1.2 Confirm portrait image URLs are derivable per operator (reuse the URL candidates already in `seed-ae-images.mjs`) — derived from detail page-data image nodes (`smallImage`/`cardImage`) instead of hardcoded CDN guesses; hashed `/static/` paths resolved fresh each run

## 2. Update script — scripts/update-ae-data.mjs

- [x] 2.1 Read `scripts/update-n2e-data.mjs` to mirror the ImageKit client init, env fallback chain, and `--reupload-*` flag handling — mirrored `update-p5x-data.mjs` instead (same Prydwen source); all plumbing from `scripts/lib/pipeline.mjs`
- [x] 2.2 Fetch + parse the operator catalog from the source identified in task 1
- [x] 2.3 Regenerate `src/data/arknights-endfield/operators.ts` with the auto-generated banner and `ALL_OPERATORS` — generated output data-identical to hand catalog (header only diff)
- [x] 2.4 Download portraits and upload to ImageKit at `/arknights_endfield/operators/{id}.webp`, skipping files already present (idempotent) — verified: all 28 existing portraits skipped
- [x] 2.5 Support `--reupload-all` / `--reupload-operators` flags matching the other scripts

## 3. Workflow — .github/workflows/update-ae-data.yml

- [x] 3.1 Copy `update-n2e-data.yml` structure: weekly cron + `workflow_dispatch`
- [x] 3.2 Run `node scripts/update-ae-data.mjs` with `IMAGEKIT_*` secrets, then `npm run format`
- [x] 3.3 Open an auto-PR on a `chore/update-ae-data-<date>` branch when files change

## 4. Decommission seed script

- [x] 4.1 Delete `scripts/seed-ae-images.mjs` once `update-ae-data.mjs` covers image upload
- [x] 4.2 Update any docs referencing the seed script (`wiki/Data-Architecture.md`) — also updated `CONTEXT.md` (AE row, Catalog exception, Update Pipeline exception now scoped to the weapon catalog) and `weapons.ts` header; added `ae-operator-catalog` delta spec superseding the manual procedure

## 5. Tests and lint

- [x] 5.1 Run `npm run lint && npm run format:check` — fix any issues
- [x] 5.2 Run `npm test` — confirm no regressions (77 files / 889 tests pass)
- [ ] 5.3 Trigger the workflow via manual dispatch and confirm it opens a clean PR
