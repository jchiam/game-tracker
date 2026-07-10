## 1. Catalog data

- [x] 1.1 In `src/data/persona-5-phantom-x/revelations.ts` `SUB_STATS`, rename `Flat ATK`→`ATK`, `Flat DEF`→`DEF`, `Flat HP`→`HP`
- [x] 1.2 In `MAIN_STATS`, rename `SUN: ['Flat HP']`→`['HP']` and `SPACE: ['Flat ATK & Flat DEF']`→`['ATK & DEF']`

## 2. DB migration

- [x] 2.1 Add `supabase/migrations/YYYYMMDD000000_p5x_drop_flat_stat_prefix.sql`
- [x] 2.2 UPDATE `p5x_revelation_cards.main_stat`: `Flat HP`→`HP`, `Flat ATK & Flat DEF`→`ATK & DEF`
- [x] 2.3 UPDATE `p5x_revelation_cards.sub_stats` (JSONB): rewrite each element's `type` for `Flat ATK`→`ATK`, `Flat DEF`→`DEF`, `Flat HP`→`HP`, matching only rows containing a flat label
- [x] 2.4 UPDATE `p5x_revelation_preferences.stat`: `Flat ATK`→`ATK`, `Flat DEF`→`DEF`, `Flat HP`→`HP`
- [x] 2.5 Confirm rewrites are idempotent (match only old labels; safe to re-run)

## 3. Tests

- [x] 3.1 Update `ThiefCard.test.tsx` fixtures asserting `Flat HP` / `Flat ATK & Flat DEF`
- [x] 3.2 Update `RevelationEditorModal.test.tsx` assertions referencing `Flat HP`
- [x] 3.3 Grep P5X source/tests for residual `Flat ` labels; update any stragglers

## 4. Verify

- [x] 4.1 `npm test` — P5X suites green
- [x] 4.2 `npx openspec validate p5x-drop-flat-substat-prefix --strict`
- [x] 4.3 `npm run lint && npm run format:check`
