## 1. Gather canonical data

- [x] 1.1 Fetch Game8 "List of All Revelation Cards" (archives/532937); enumerate the full Heavens and Space set names, and record the actual per-category counts. (26 Heavens, 16 Space.)
- [x] 1.2 Record verified `twoSetEffect` + `fourSetEffect` for the 14 missing Heavens sets. Sourced from the Game8 list page (it carries the effect text); the 6 whose 4pc the summarizer compressed (Labor, Oppression, Pleasure, Power, Disappointment, Virtue) were re-fetched verbatim, then all condensed to the existing terse style.
- [x] 1.3 Establish the Space `effect` for each of the 8 missing Space sets. Finding: Space effects are pairing-conditional (no standalone one-liner; confirmed "NOT ON PAGE" on Game8 list, and Integrity's page lists per-Heavens pairings). Recorded each set's paired Heavens sets from the Game8 list (corroborated by Integrity's page) — no fabricated numbers.
- [x] 1.4 Confirm every new `id` (kebab-case slug of `name`) is distinct from the 20 existing ids — no collisions. (Asserted by a uniqueness test.)

## 2. Expand the catalog

- [x] 2.1 Update the `revelations.ts` header comment: pin "Game8 — List of All Revelation Cards" as the canonical source, note the catalog is manually maintained (no scraper).
- [x] 2.2 Insert the 14 new Heavens entries into `ALL_HEAVENS_SETS` at their alphabetical-by-`name` positions; leave the 12 existing entries unchanged.
- [x] 2.3 Insert the 8 new Space entries into `ALL_SPACE_SETS` at their alphabetical-by-`name` positions. (Ids of the 8 existing entries unchanged.)
- [x] 2.4 Normalize all 16 Space `effect` strings to the uniform factual "Paired bonuses with X sets" style (user-directed during apply). Space bonuses are pairing-conditional, so the existing standalone one-liners were replaced; sourced from the Game8 list pairings.

## 3. Tests

- [x] 3.1 Add `revelations.test.ts` assertions: `ALL_HEAVENS_SETS` length ≥ 26 and includes `labor`; `ALL_SPACE_SETS` length ≥ 16 and includes `integrity`; every Heavens entry has non-empty `twoSetEffect`/`fourSetEffect`; every Space entry has non-empty `effect`; ids unique per catalog.
- [x] 3.2 Run `npm test` (P5X data + service suites) — all green. (33 passed.)

## 4. Verify & finalize

- [x] 4.1 Run `npm run lint && npm run format:check`. (Both clean.)
- [x] 4.2 Run `npm run build` (TypeScript check). (Built OK.)
- [x] 4.3 Confirm Labor (Heavens) and Integrity (Space) appear in the set dropdowns. Verified by code inspection: `RevelationEditorModal` derives set options directly from `ALL_HEAVENS_SETS`/`ALL_SPACE_SETS` as `{ value: s.id, label: s.name }`, and both ids are now in the arrays (asserted by tests). A live UI click is not runnable headless in this environment.
- [x] 4.4 `npx openspec validate --all`. (40 passed, 0 failed.)
