# dgm-product-tracking Specification

## Purpose

How the Digimon collection is tracked per product: product rows with variant child rows, derived ownership (owned / wishlist / interested), the roster hook, page, card, add modal, and the product editor's Variants tab.

## Requirements

### Requirement: Tracked product persistence with variant child rows

The system SHALL persist a user's tracked products in `dgm_tracked_products` (`id` uuid, `profile_id` FK `user_profiles` cascade, `product_id`, `is_favorited` default false, `notes` default `''`, `progress TEXT[]` default `'{}'`, `created_at`; unique `(profile_id, product_id)`; RLS user-scoped on `profile_id`; index on `profile_id`) and the per-variant state in `dgm_tracked_variants` (`id` uuid, `tracked_product_id` FK `dgm_tracked_products` cascade, `variant_id`, `status` `'owned' | 'wishlist'` NOT NULL, `condition` `'sealed' | 'boxed' | 'loose'` or NULL; unique `(tracked_product_id, variant_id)`; RLS through the parent's `profile_id`; index on `tracked_product_id`). A variant row exists only while its status is set. `src/services/digimon/productService.ts` SHALL be a `createRosterPersistence` adapter over `ALL_PRODUCTS` with an Extras Adapter joining `dgm_tracked_variants ( variant_id, status, condition )` into `variantState`, re-exporting `loadProductsFromDB`, `insertProduct`, `deleteProduct`, `updateProduct`, plus per-game `upsertVariant(trackedProductId, variantId, { status, condition })` (single-row upsert on `tracked_product_id,variant_id`) and `deleteVariant(trackedProductId, variantId)`. No RPC is involved.

#### Scenario: Load merges catalog, rows, and variant state

- **WHEN** `loadProductsFromDB` runs for a session whose `dv-25th-color-evolution` row has variant rows `dv-25th-anime-original` (owned, boxed) and `dv-25th-yagami-taichi` (wishlist)
- **THEN** the tracked product carries `dbId`, `isFavorited`, `notes`, `progress`, and `variantState` `{ 'dv-25th-anime-original': { status: 'owned', condition: 'boxed' }, 'dv-25th-yagami-taichi': { status: 'wishlist', condition: null } }`; rows whose `product_id` matches no catalog product are dropped

#### Scenario: Insert defaults

- **WHEN** `insertProduct` runs
- **THEN** the product row is inserted with `is_favorited false`, `notes ''`, `progress '{}'` and no variant rows

#### Scenario: Variant upsert and delete

- **WHEN** `upsertVariant('db-1', 'dv-25th-anime-original', { status: 'owned', condition: null })` runs
- **THEN** one row is upserted on conflict `tracked_product_id,variant_id`; `deleteVariant('db-1', 'dv-25th-anime-original')` deletes that row

### Requirement: Existing device rows migrate to products

The migration `supabase/migrations/20260913000001_restructure_dgm_products.sql` SHALL create both tables, convert every `dgm_tracked_devices` row into its product row (favorite = any converted device favorited; notes = non-empty device notes joined by newline) and a variant row (status, condition) using a device-id → product-id map carried in the migration, SHALL raise if any device id is absent from the map, and SHALL then drop `dgm_tracked_devices`. `acquired_on` is not carried over.

#### Scenario: Three colourways become one product

- **WHEN** a profile has owned rows for all three `dv-25th-*` devices
- **THEN** after migration it has one `dv-25th-color-evolution` product row and three owned variant rows

#### Scenario: Unmapped device fails loudly

- **WHEN** a `dgm_tracked_devices` row's `device_id` is not in the map
- **THEN** the migration raises and nothing is dropped

### Requirement: Product roster hook

`src/hooks/digimon/useProducts.ts` SHALL wrap `useRoster` with `ALL_PRODUCTS` (nouns product / products; Fuse keys `name`, `line`, `series`, `variants.colorway`) and SHALL expose `updateNotes`, `toggleFavorite`, `updateProgress` (each via `makeFieldUpdater`, no custom body), `setVariantStatus(productId, variantId, status | null)` and `setVariantCondition(productId, variantId, condition | null)` (optimistic update of `variantState`, persisted through `queueAction` with `upsertVariant` / `deleteVariant`, rolled back on error), and `getFilteredRoster(searchTerm, 'ALPHA' | 'YEAR', entities?)` where `YEAR` orders by product `releaseYear` ascending then name.

#### Scenario: Add product optimistic

- **WHEN** `addProduct` is called with a catalog product
- **THEN** it appears in `trackedProducts` immediately with `isFavorited false`, `notes ''`, `progress []`, `variantState {}`, and the insert is issued

#### Scenario: Setting a variant status

- **WHEN** `setVariantStatus('dv-25th-color-evolution', 'dv-25th-anime-original', 'owned')` is called on a tracked product with a `dbId`
- **THEN** `variantState` gains that key immediately and one `upsertVariant` call is issued; calling it with `null` removes the key and issues `deleteVariant`

#### Scenario: Variant write failure rolls back

- **WHEN** `upsertVariant` rejects
- **THEN** `variantState` is restored to its previous value and an error toast is raised

### Requirement: Derived ownership

`src/pages/digimon/ownership.ts` SHALL export `deriveOwnership(tracked)` returning `'owned'` when any variant state is `owned`, else `'wishlist'` when any is `wishlist`, else `'interested'`; `ownedVariantCount(tracked)`; and `representativeVariant(tracked)` returning the first catalog variant whose state is `owned`, else the first catalog variant.

#### Scenario: Interested product

- **WHEN** a tracked product has an empty `variantState`
- **THEN** ownership is `interested` and the representative variant is the first catalog variant

### Requirement: Product page

`src/pages/digimon/DigimonPage.tsx` SHALL compose `useProducts`, `useRosterView` (sort modes `ALPHA` "AZ" / `YEAR` "Yr"; placeholder "Search by name, line, series, or colour…"; add title "Add Product"), and `RosterPageLayout` with title "Digimon Virtual Pets", `secondViewLabel` "Completion", empty message "No products in your collection yet. Use the + button to begin!", one `ProductCard` per filtered product, `AddProductModal`, and the completion view in `secondView`. Favorite toggles, edit commits, and product-editor closes SHALL call `projection.refreshBasis(id)`.

#### Scenario: Registry wiring unchanged

- **WHEN** `GAMES` is read
- **THEN** the `dgm` entry still has `path '/digimon'`, `modality 'collection'`, `bgClass 'bg-dgm-sel'`

### Requirement: Product card

`ProductCard` SHALL compose `GameCardShell` with `entityNoun` "Product", image = `representativeVariant` resolved via `getDeviceImageUrl`, favorite and remove controls, a `GameBadge` for `line` (variant `dgm-line`), `summaryStats` of an ownership `StatChip` (Owned / Wishlist / Interested with the `dgm-status-chip-*` tints), an `{owned} / {total}` variants chip, and the product year chip; `summaryLine` = a variant dot line (one glyph per catalog variant: filled for owned, half for wishlist, hollow otherwise, titled with the colourway) followed, when the product has a guide and ownership is `owned`, by one labelled `.completion-bar` per track; `headerExtra` = an overall-percentage badge under the same gating; `editBody` = a `ProgressSection` labelled "Variants & progress" holding one `btn secondary-action` "Manage" that opens `ProductEditorModal` on the Variants tab (track navigation happens inside the editor), followed by `BuildComments` for notes. No per-track buttons SHALL render on the card.

#### Scenario: Owned product with a guide

- **WHEN** a tracked `dv-25th-color-evolution` has one owned variant and progress 18/22 partners, 35/69 map
- **THEN** the header badge reads `66%` (mean of 82% and 51%), the chips read `Owned`, `1 / 3`, `2024`, the dot line has three glyphs with the first filled, and two bars have widths `82%`, `51%`

#### Scenario: Interested product

- **WHEN** a tracked product has no variant state
- **THEN** the chip reads `Interested`, no badge or bars render, and "Manage" still opens the editor (whose track tabs are disabled)

### Requirement: Product editor modal

`ProductEditorModal` SHALL compose `TabbedEditorShell` with title `{product name}`, `bodyClassName` `product-editor-body`, a first tab `variants` ("Variants") listing every catalog variant as a `.variant-row` (colourway, region, year, a static `SegmentedButtons` Owned / Wishlist with `allowDeselect`, and — only while owned — a static `SegmentedButtons` Sealed / Boxed / Loose with `allowDeselect`), followed by one tab per guide track rendering grouped checkbox rows (`.progress-group` with `{done} / {total}` header, `.progress-item` label rows with `.progress-item-hint`). Track tabs SHALL be disabled while ownership is not `owned`. Callbacks: `onSetVariantStatus`, `onSetVariantCondition`, `onToggleItem`, `onClose`.

#### Scenario: Ticking a variant

- **WHEN** the user clicks "Owned" on the Taichi row
- **THEN** `onSetVariantStatus(productId, 'dv-25th-yagami-taichi', 'owned')` is called and the condition row appears for it

#### Scenario: Deselecting a variant

- **WHEN** the user clicks the active "Wishlist" on a row
- **THEN** `onSetVariantStatus(productId, variantId, null)` is called

#### Scenario: Track tabs gated

- **WHEN** the editor opens for a product with no owned variant
- **THEN** the track tab buttons are disabled and clicking one does not switch content

### Requirement: Add product modal

`AddProductModal` SHALL be an `AddEntityModal` config wrapper: title "Add Product", entity noun "products", `searchKeys` `['name', 'line', 'series', 'variants.colorway']`, badges for `line` and `{n} variants`; tracked products are excluded. Adding inserts the product only; variants are set in the editor.

#### Scenario: Search by colourway

- **WHEN** the user types "Yagami"
- **THEN** the Digivice -25th COLOR EVOLUTION- product is listed
