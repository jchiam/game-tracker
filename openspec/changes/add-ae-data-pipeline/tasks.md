## 1. Identify data source

- [ ] 1.1 Find a stable structured AE operator source (Prydwen/wiki endpoint or GitHub data repo) exposing a parseable operator list with id, name, rarity, class, element, weapon
- [ ] 1.2 Confirm portrait image URLs are derivable per operator (reuse the URL candidates already in `seed-ae-images.mjs`)

## 2. Update script — scripts/update-ae-data.mjs

- [ ] 2.1 Read `scripts/update-n2e-data.mjs` to mirror the ImageKit client init, env fallback chain, and `--reupload-*` flag handling
- [ ] 2.2 Fetch + parse the operator catalog from the source identified in task 1
- [ ] 2.3 Regenerate `src/data/arknights-endfield/operators.ts` with the auto-generated banner and `ALL_OPERATORS`
- [ ] 2.4 Download portraits and upload to ImageKit at `/arknights_endfield/operators/{id}.webp`, skipping files already present (idempotent)
- [ ] 2.5 Support `--reupload-all` / `--reupload-operators` flags matching the other scripts

## 3. Workflow — .github/workflows/update-ae-data.yml

- [ ] 3.1 Copy `update-n2e-data.yml` structure: weekly cron + `workflow_dispatch`
- [ ] 3.2 Run `node scripts/update-ae-data.mjs` with `IMAGEKIT_*` secrets, then `npm run format`
- [ ] 3.3 Open an auto-PR on a `chore/update-ae-data-<date>` branch when files change

## 4. Decommission seed script

- [ ] 4.1 Delete `scripts/seed-ae-images.mjs` once `update-ae-data.mjs` covers image upload
- [ ] 4.2 Update any docs referencing the seed script (`wiki/Data-Architecture.md`)

## 5. Tests and lint

- [ ] 5.1 Run `npm run lint && npm run format:check` — fix any issues
- [ ] 5.2 Run `npm test` — confirm no regressions
- [ ] 5.3 Trigger the workflow via manual dispatch and confirm it opens a clean PR
