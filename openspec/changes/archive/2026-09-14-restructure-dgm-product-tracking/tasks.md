## 1. Reset the abandoned draft

- [x] 1.1 Revert the draft's shared relaxations: restore `GameCardShell` required `isFavorited` / `onToggleFavorite` / `onRemove` (drop the omitted-controls test and the "derived card" story) and `RosterTracked.isFavorited: boolean` in `src/hooks/useRoster.ts`; keep `TabbedEditorShell` + `EquipmentEditorShell` adapter; verify `npx vitest run src/components`
- [x] 1.2 Delete draft files that have no successor: `src/data/digimon/software.ts` + `.test.ts`, `src/services/digimon/softwareProgressService.ts` + `.test.ts`, `src/hooks/digimon/useSoftwareProgress.ts` + `.test.ts`, `src/pages/digimon/components/SoftwareCard.*`, `supabase/migrations/20260913000000_add_dgm_software_progress.sql`; revert `src/types.ts` software types, `src/pages/digimon/completion.ts` `qualifyingSoftware`, and the `CompletionView` software section; verify `npx tsc --noEmit` reports only the expected missing-module errors until section 3 lands

## 2. Shared shell

- [x] 2.1 `TabbedEditorShell`: add per-tab `disabled?: boolean` (button `disabled`, never activates; `initialTab` falls back to the first enabled tab); extend `TabbedEditorShell.test.tsx` (disabled tab cannot activate) and the story (one disabled tab); verify `npx vitest run src/components/TabbedEditorShell`

## 3. Product catalog and seeds

- [x] 3.1 Write a one-time scratchpad script that converts `scripts/seeds/dgm-devices.json` into `scripts/seeds/dgm-products.json` (group by `line` + `series`; product id `{line-abbrev}-{series-slug}`; product `name` = series-level name; `wikimon` from the first row; variants keep `id`, `colorway`, `releaseYear`, `region`, `imageSource`); review the 43 products by hand; delete `dgm-devices.json`; verify the new seed parses and has 89 variants
- [x] 3.2 Move `scripts/seeds/dgm-software/dvc.json` to `scripts/seeds/dgm-guides/dv-25th-color-evolution.json` (drop `id` / `name`, keep `overall` + `tracks`); delete `scripts/seeds/dgm-software/`
- [x] 3.3 Rewrite `scripts/update-dgm-data.mjs` for the nested seed: `validateProductSeed` (unique product ids, unique variant ids across the catalog, ≥1 variant, required fields, region enum, four-digit variant year), `loadGuides` + `validateGuides` (file name must match a product id; item-id prefix, uniqueness, `requires` resolution, `overall` enum, ≥1 item), per-variant `ensureAsset` to `/assets/digimon/devices/{variantId}.webp`, `generateProductsTs` (banner naming Wikimon, device manuals, and Humulos as references; interfaces per design D1; `ALL_PRODUCTS` with `releaseYear` = min variant year and `guide` attached; `DGM_LINES`; Prettier-stable `requires` lines); `--sync-wikimon` iterates products; verify a run writes `products.ts`, a guide with a bad `requires` exits non-zero naming it, and a guide file named for an unknown product exits non-zero
- [x] 3.4 Run the generator; delete `src/data/digimon/devices.ts`; commit `src/data/digimon/products.ts`; verify `npm run format:check` on the generated file
- [x] 3.5 Create `src/data/digimon/products.test.ts` (unique ids, variant ids unique across products, every product ≥1 variant, `DGM_LINES` coverage, `dv-25th-color-evolution` has three variants and a guide with tracks `partners` / `friends` / `map`, 82 friends, Omegamon `requires`); verify `npx vitest run src/data/digimon`

## 4. Types, persistence, migration

- [x] 4.1 `src/types.ts`: replace the device types with `DgmVariantStatus`, `DgmCondition`, `DgmOwnership`, `DgmTrackedVariant`, `DgmTrackedProduct` (`variantState`), `DgmProductPatch` per design D5; verify `npx tsc --noEmit`
- [x] 4.2 Create `supabase/migrations/20260913000001_restructure_dgm_products.sql` per design D2: both tables, RLS (child policies via parent `profile_id`), indexes, the device-id → product-id VALUES map generated from the product seed, conversion (product row per profile + product with favorite / notes aggregation, variant rows with status / condition), `RAISE` on any unmapped `device_id`, `DROP TABLE dgm_tracked_devices`; verify on the throwaway `postgres:16` harness with seeded device rows (three DVC colourways collapse to one product, unmapped id raises, RLS hides other users' variants, unique constraints hold)
- [x] 4.3 Rewrite `src/services/digimon/deviceService.ts` → `productService.ts` per design D3 (roster adapter with extras join into `variantState`; `upsertVariant`, `deleteVariant`); rewrite the service test (load mapping with variant rows, insert defaults, patch column map, upsert conflict target, delete filter); delete the old files; verify `npx vitest run src/services/digimon`

## 5. Hook and pure modules

- [x] 5.1 Rewrite `src/hooks/digimon/useDevices.ts` → `useProducts.ts` per design D4 (`makeFieldUpdater` for notes / favorite / progress; `queueAction`-based `setVariantStatus` / `setVariantCondition` with optimistic update and rollback; `getFilteredRoster` with YEAR sort); rewrite the hook test with the hoisted-mock pattern (add optimistic, variant set → upsert, variant clear → delete, rollback + toast on failure, load error); delete the old files; verify `npx vitest run src/hooks/digimon`
- [x] 5.2 Create `src/pages/digimon/ownership.ts` (`deriveOwnership`, `ownedVariantCount`, `representativeVariant`) + test; verify `npx vitest run src/pages/digimon/ownership`
- [x] 5.3 Rename `src/pages/digimon/softwareProgress.ts` → `gameProgress.ts` retargeted to `DgmProgressGuide` (`computeProgress`, `toggleProgressItem`); move its test; verify `npx vitest run src/pages/digimon/gameProgress`
- [x] 5.4 Rewrite `src/pages/digimon/completion.ts` (`computeCompletion` over products and variants per design D6); update its tests in `CompletionView.test.tsx`; verify `npx vitest run src/pages/digimon/components/CompletionView`

## 6. Components and page

- [x] 6.1 Rewrite `ProgressEditorModal` → `ProductEditorModal.tsx` + `.css` per design D8 (Variants tab rows with `SegmentedButtons` status / condition; guide track tabs reusing the grouped checkbox body; track tabs `disabled` unless owned); rewrite the test (tick emits status, deselect emits null, condition row only while owned, track tabs disabled when not owned, toggle emits item id); delete `ProgressEditorModal.*`; verify `npx vitest run src/pages/digimon/components/ProductEditorModal`
- [x] 6.2 Rewrite `DeviceCard` → `ProductCard.tsx` + `.css` per design D7 (badges, ownership / variants / year chips with the existing tint classes plus an Interested tint, variant dot line, gated overall badge + track bars using `src/pages/digimon/completion.css`, edit body with Manage variants / track buttons / notes); rewrite the test (owned-with-guide numbers and widths, interested state, dot glyphs, disabled track buttons, editor opens on the right tab); delete `DeviceCard.*`; verify `npx vitest run src/pages/digimon/components/ProductCard`
- [x] 6.3 Rewrite `AddDeviceModal` → `AddProductModal.tsx` (config wrapper: title, noun, `searchKeys` incl. `variants.colorway`, badges line + `{n} variants`); rewrite the test (colourway search hits the product, tracked products excluded); delete the old files; verify `npx vitest run src/pages/digimon/components/AddProductModal`
- [x] 6.4 Rewrite `CompletionView.tsx` + `.css` (rows with product bar and variant readout; no software section); verify `npx vitest run src/pages/digimon/components/CompletionView`
- [x] 6.5 Rewrite `DigimonPage.tsx` per design D9 (`useProducts`, product cards, add-product modal, editor-close release point, toggle merge through `toggleProgressItem`); rewrite `DigimonPage.test.tsx` (ladder states, cards, add modal, Completion switch, favorite / edit / editor-close release points, progress toggle reaches `updateProgress` with the merged array, YEAR sort projection stability); verify `npx vitest run src/pages/digimon`
- [x] 6.6 Sweep `tests/*.spec.ts` for "Add Device" / device wording that the e2e suite asserts; update to product wording; verify `npm run test:e2e`

## 7. Docs and gate

- [x] 7.1 `CONTEXT.md`: Digimon row (entity noun **product**; variants; ownership; game progress on the card); add **Product**, **Variant**, **Ownership**, **Progress Guide** / **Progress Track**, **Game Progress**, **Tabbed Editor Shell** sections; adjust Equipment Editor Shell
- [x] 7.2 `CLAUDE.md`: Digimon description; L3 table row for `TabbedEditorShell`; Catalog Data Sources rewritten for the product seed and guide seeds; directory-layout note that `dgm` has no parties and its tracked entity is the product
- [x] 7.3 Update the `dgm-data-sources` memory for the product seed and guide seeds
- [x] 7.4 Full gate: `npm run lint && npm run format:check && npx tsc --noEmit && npm test && npm run build && npm run test:e2e`; `npx openspec validate --all`

## 8. Guide trim and card entry point (follow-up)

- [x] 8.1 `scripts/seeds/dgm-guides/dv-25th-color-evolution.json`: remove the `friends` track; in every `map` group place each location's secret-area item directly after that location (label `{Location} · secret area`, hint `Secret · {Digimon}`, no `requires`); regenerate `src/data/digimon/products.ts`; verify `npm run format:check` and that the DVC guide has 22 partner items and 69 map items across two tracks
- [x] 8.2 Update `src/data/digimon/products.test.ts` (two tracks, no friends, secret follows its location in File Island, Digital Forest has no secret) and `src/services/digimon/productService.test.ts` / `src/hooks/digimon/useProducts.test.ts` where they assert the three-track list; verify `npx vitest run src/data/digimon src/services/digimon src/hooks/digimon`
- [x] 8.3 `ProductCard.tsx`: replace the `.product-actions` button row with a `ProgressSection` labelled "Variants & progress" containing one `btn secondary-action` "Manage" that opens the editor on `VARIANTS_TAB`; drop `.product-actions` from `ProductCard.css`; update `ProductCard.test.tsx` (single Manage button, interested state no longer asserts disabled track buttons, editor reached on the Variants tab then switched to a track via its tab) and `DigimonPage.test.tsx` (open editor via Manage, switch to the Partners tab inside the modal); verify `npx vitest run src/pages/digimon` and, in `npm run dev`, that hovering Manage no longer clips against the edit-body top edge
- [x] 8.4 Full gate: `npm run lint && npm run format:check && npx tsc --noEmit && npm test && npm run build && npm run test:e2e`; `npx openspec validate --all`
