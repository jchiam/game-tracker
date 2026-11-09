# Tasks

## 1. Data pipeline

- [x] 1.1 Write `scripts/update-czn-data.mjs` composing `scripts/lib/pipeline.mjs` (P5X script as template): fetch list page-data from the CloudFront origin, throw on missing `allCharacters.nodes`, drop `class`/`element` `Unknown` nodes and log them as excluded, fetch each slug's detail page-data (throw on missing `currentUnit`), map to `CznCombatant` (`id` = slug, verbatim `class`/`element`/`faction`), emit `src/data/chaos-zero-nightmare/combatants.ts` with the generated-file banner and print the catalog diff — verify a dry run prints 32 entries (34 minus 2 placeholders) and the excluded slugs
- [x] 1.2 Add overlay seed `scripts/seeds/czn-combatants.json` (valid empty array or first hand-verified entries) and wire `validateOverlaySeed` (`required: id,name,rarity,class,element`, `rarities: [4,5]`) + `applyOverlay` keyed on `id` with the shadowed-entry warning — verify a deliberately malformed seed entry aborts the run before codegen and a valid extra entry appears after the fetched entries
- [x] 1.3 Portrait seeding: resolve each fetched entry's URL from `cardImage` (fallback `smallImage`) `gatsbyImageData.images.fallback.src` against the origin, seed entries from `imageSource`, convert to webp via `sharp`, upload via `ensureAsset` to ImageKit `chaos_zero_nightmare/combatants`, `--reupload-combatants` / `--reupload-all` flags, counters + missing list from `ensureAsset` results — verify a second run reports every asset as `skipped`
- [x] 1.4 Run the script for real, commit the generated `combatants.ts`, spot-check three portraits through `getMugshotUrl` / `getAvatarUrl` in the browser (heads not clipped; otherwise fall back to a CZN resolver per design D6)
- [x] 1.5 Add `.github/workflows/update-czn-data.yml` (weekly cron + manual dispatch, format, auto-PR on diff) mirroring `update-zzz-data.yml` — verify `actionlint`-clean or a manual dispatch dry run on the branch
- [x] 1.6 Document the source in `CLAUDE.md` (Catalog Data Sources `czn` block: origin, placeholder rule, overlay seed rules, "fix in seed, then regenerate") and add CZN to the game lists in `CLAUDE.md` and `CONTEXT.md` — verify `npx prettier --check` passes on both

## 2. Types + database

- [x] 2.1 Add `CznCombatant` re-export, `CznTrackedCombatant` (`level`, `ego`, `potentialAttained`, `isFavorited`, `dbId`) and `CznCombatantPatch` to `src/types.ts` — verify `npm run build` typechecks
- [x] 2.2 Migration `supabase/migrations/<ts>_add_czn_tables.sql`: `czn_tracked_combatants` (UNIQUE(profile_id, combatant_id), CHECKs level 1–62 / ego 0–6, `potential_attained BOOLEAN NOT NULL DEFAULT false`), `czn_parties` (tier, is_favorited), `czn_party_members` (slot_index CHECK 0–2, UNIQUE(party_id, slot_index)); RLS + user-scoped policies + standard indexes on all three — verify the file applies cleanly in the throwaway `postgres:16` harness
- [x] 2.3 In the same migration, `CREATE OR REPLACE FUNCTION assert_game_table` adding `czn` to the allowlist alternation, re-applying `SET search_path = public` and the existing REVOKE/GRANT pair — verify in the harness that `save_party('czn_parties','czn_party_members', …)` succeeds and a non-allowlisted name still raises `not a game table`

## 3. Service + hook layers

- [x] 3.1 `src/services/chaos-zero-nightmare/combatantService.ts` as `createRosterPersistence` config adapter (column map `level`/`ego`/`potential_attained`/`is_favorited`, insert defaults, catalog merge over `ALL_CZN_COMBATANTS`) + `combatantService.test.ts` covering load mapping, column map, insert defaults only — verify tests pass
- [x] 3.2 `src/services/chaos-zero-nightmare/partyService.ts` via `createPartyPersistence` (`czn_parties` / `czn_party_members`, `combatant_id` member column, tier + `is_favorited` extras, `toggleFavoriteParty`) + `partyService.test.ts` asserting the `save_party` RPC payload shape — verify tests pass
- [x] 3.3 `src/hooks/chaos-zero-nightmare/useCombatants.ts` over `useRoster` — `makeFieldUpdater` updaters for level (clamp 1–62), ego, potentialAttained, favorite; Fuse keys `name`, `class`, `element` + `useCombatants.test.ts` in the hoisted-mock pattern (load, add, clamp, toggle, DB-error path) — verify tests pass
- [x] 3.4 `src/hooks/chaos-zero-nightmare/useParties.ts` + `useParties.test.ts` (load, save, delete, favorite revert on failure) — verify tests pass

## 4. Page + components

- [x] 4.1 Design tokens: `color.czn` (`selStart`, `selMid`, five attribute hues, six class hues) in `design-tokens.json`, `npm run build:tokens`, `.game-card-header.bg-czn-sel` in `index.css`, update `DesignTokens.stories.tsx` — verify Storybook token story renders the new swatches
- [x] 4.2 `combatantBadges.ts` in the page module: class + element badge maps (`GameBadge` descriptors, neutral fallback for unknown strings) + unit test asserting the fallback — verify tests pass
- [x] 4.3 `CombatantCard.tsx` composed from `GameCardShell`: 4★/5★ rarity indicator, class + element `GameBadge`s, summary chips `Lv {n}` / `T{n}` / `Potential ✓|✗` via `getProgressStyle`, edit sections Level (`LevelSlider` 1–62) → Manifest Ego (`SegmentedButtons` T0–T6) → Potential (`ConfirmCheckbox`, HSR traces shape), `onEditCommit` wired + `CombatantCard.css` (overrides only, token-first) + `CombatantCard.test.tsx` — verify tests pass and no rule duplicates `card.css`/`controls.css`
- [x] 4.4 `AddCombatantModal.tsx` as `AddEntityModal` config wrapper (search keys name/class/element, rarity + class + element badges) + test — verify tests pass
- [x] 4.5 `PartiesTab.tsx` as `PartiesView` config adapter: nouns, `searchKeys`, `slotAccentClass` by element (`czn-element-*`), `supportsTier`, `supportsFavorite`, three uniform `slots` (`Combatant 1–3`, indices 0–2) + config-wiring test asserting 3 slots render — verify tests pass
- [x] 4.6 `CznPage.tsx` via `useRosterView` + `RosterPageLayout` (sort modes alphabetical/level, add modal, Parties second view, `projection.refreshBasis` wired to edit commits and favorite toggles) + `CznPage.css` + `CznPage.test.tsx` — verify tests pass
- [x] 4.7 Register in `src/lib/games.ts` (`id: 'czn'`, path `/chaos-zero-nightmare`, developer Super Creative, modality `roster`, placed after `n2e`), add `/assets/icons/czn-icon.webp` and `/assets/chaos-zero-nightmare/selection-cover.webp` — verify the home page shows the CZN card and the switcher lists it under Live-Service Rosters

## 5. Integration verification

- [x] 5.1 `npm run lint && npm run format:check && npm test && npm run build && npx openspec validate --all` all green
- [x] 5.2 Manual pass against the deployed DB: add combatants, edit level/Ego/Potential, reload and confirm persistence, build and save a 3-combatant party, set tier, toggle favorite, delete a party
