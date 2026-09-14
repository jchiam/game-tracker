## ADDED Requirements

### Requirement: Variant rows migrate to copy counts

The migration `supabase/migrations/20260914000000_dgm_variant_copies.sql` SHALL add `wishlist BOOLEAN NOT NULL DEFAULT false` and `sealed`, `boxed`, `loose` (`INTEGER NOT NULL DEFAULT 0`, each `CHECK (>= 0)`) to `dgm_tracked_variants`, backfill every existing row (`wishlist = (status = 'wishlist')`; `sealed = 1` when `status = 'owned' AND condition = 'sealed'`, `boxed` likewise, `loose = 1` when `status = 'owned' AND (condition = 'loose' OR condition IS NULL)`, else `0`), drop `status` and `condition`, and add `CONSTRAINT dgm_tracked_variants_meaningful CHECK (wishlist OR sealed + boxed + loose > 0)`. The unique key, index, and RLS policies SHALL be untouched.

#### Scenario: Owned rows become one copy each

- **WHEN** a profile has variant rows (owned, sealed), (owned, boxed), (owned, NULL), and (wishlist, NULL)
- **THEN** after migration they read `sealed 1`, `boxed 1`, `loose 1` (the NULL-condition row), and `wishlist true` with all counters `0`

#### Scenario: Empty row rejected

- **WHEN** a row with `wishlist false` and every counter `0` is inserted
- **THEN** the insert fails the `dgm_tracked_variants_meaningful` check

## MODIFIED Requirements

### Requirement: Tracked product persistence with variant child rows

The system SHALL persist a user's tracked products in `dgm_tracked_products` (`id` uuid, `profile_id` FK `user_profiles` cascade, `product_id`, `is_favorited` default false, `notes` default `''`, `progress TEXT[]` default `'{}'`, `created_at`; unique `(profile_id, product_id)`; RLS user-scoped on `profile_id`; index on `profile_id`) and the per-variant state in `dgm_tracked_variants` (`id` uuid, `tracked_product_id` FK `dgm_tracked_products` cascade, `variant_id`, `wishlist BOOLEAN NOT NULL`, `sealed` / `boxed` / `loose` `INTEGER NOT NULL` each `>= 0`; unique `(tracked_product_id, variant_id)`; `CHECK (wishlist OR sealed + boxed + loose > 0)`; RLS through the parent's `profile_id`; index on `tracked_product_id`). A variant row exists only while it is wishlisted or holds at least one copy. `DgmTrackedVariant` in `src/types.ts` SHALL be `{ wishlist: boolean; copies: DgmCopyCounts }` where `DgmCopyCounts = Record<DgmCondition, number>`; `DgmVariantStatus` SHALL be removed. `src/services/digimon/productService.ts` SHALL be a `createRosterPersistence` adapter over `ALL_PRODUCTS` with an Extras Adapter joining `dgm_tracked_variants ( variant_id, wishlist, sealed, boxed, loose )` into `variantState`, re-exporting `loadProductsFromDB`, `insertProduct`, `deleteProduct`, `updateProduct`, plus per-game `upsertVariant(trackedProductId, variantId, { wishlist, copies })` (single-row upsert on `tracked_product_id,variant_id` writing all four columns) and `deleteVariant(trackedProductId, variantId)`. No RPC is involved.

#### Scenario: Load merges catalog, rows, and variant state

- **WHEN** `loadProductsFromDB` runs for a session whose `dv-25th-color-evolution` row has variant rows `dv-25th-anime-original` (`wishlist false`, `sealed 1`, `boxed 0`, `loose 1`) and `dv-25th-yagami-taichi` (`wishlist true`, all counters `0`)
- **THEN** the tracked product carries `dbId`, `isFavorited`, `notes`, `progress`, and `variantState` `{ 'dv-25th-anime-original': { wishlist: false, copies: { sealed: 1, boxed: 0, loose: 1 } }, 'dv-25th-yagami-taichi': { wishlist: true, copies: { sealed: 0, boxed: 0, loose: 0 } } }`; rows whose `product_id` matches no catalog product are dropped

#### Scenario: Insert defaults

- **WHEN** `insertProduct` runs
- **THEN** the product row is inserted with `is_favorited false`, `notes ''`, `progress '{}'` and no variant rows

#### Scenario: Variant upsert and delete

- **WHEN** `upsertVariant('db-1', 'dv-25th-anime-original', { wishlist: true, copies: { sealed: 2, boxed: 0, loose: 0 } })` runs
- **THEN** one row `{ tracked_product_id: 'db-1', variant_id: 'dv-25th-anime-original', wishlist: true, sealed: 2, boxed: 0, loose: 0 }` is upserted on conflict `tracked_product_id,variant_id`; `deleteVariant('db-1', 'dv-25th-anime-original')` deletes that row

### Requirement: Product roster hook

`src/hooks/digimon/useProducts.ts` SHALL wrap `useRoster` with `ALL_PRODUCTS` (nouns product / products; Fuse keys `name`, `line`, `series`, `variants.colorway`) and SHALL expose `updateNotes`, `toggleFavorite`, `updateProgress` (each via `makeFieldUpdater`, no custom body), `setVariantCopies(productId, variantId, condition, count)` and `setVariantWishlist(productId, variantId, wishlist)` (optimistic update of `variantState`, persisted through `queueAction` with `upsertVariant`, or `deleteVariant` when the resulting state has no copies and is not wishlisted, rolled back on error; `count` is clamped to `>= 0`), and `getFilteredRoster(searchTerm, 'ALPHA' | 'YEAR', entities?)` where `YEAR` orders by product `releaseYear` ascending then name.

#### Scenario: Add product optimistic

- **WHEN** `addProduct` is called with a catalog product
- **THEN** it appears in `trackedProducts` immediately with `isFavorited false`, `notes ''`, `progress []`, `variantState {}`, and the insert is issued

#### Scenario: Setting a variant status

- **WHEN** `setVariantCopies('dv-25th-color-evolution', 'dv-25th-anime-original', 'sealed', 1)` is called on a tracked product with a `dbId` and no state for that variant
- **THEN** `variantState` gains `{ wishlist: false, copies: { sealed: 1, boxed: 0, loose: 0 } }` immediately and one `upsertVariant` call is issued with that state

#### Scenario: Last copy removed deletes the row

- **WHEN** `setVariantCopies(productId, variantId, 'sealed', 0)` is called on a variant whose only state was `sealed 1` and `wishlist false`
- **THEN** the key is removed from `variantState` and `deleteVariant` is issued

#### Scenario: Wishlist keeps the row alive

- **WHEN** `setVariantWishlist(productId, variantId, true)` is called on a variant with no copies
- **THEN** `variantState` gains `{ wishlist: true, copies: { sealed: 0, boxed: 0, loose: 0 } }` and `upsertVariant` is issued; a later `setVariantWishlist(…, false)` on the same variant issues `deleteVariant`

#### Scenario: Variant write failure rolls back

- **WHEN** `upsertVariant` rejects
- **THEN** `variantState` is restored to its previous value and an error toast is raised

### Requirement: Derived ownership

`src/pages/digimon/ownership.ts` SHALL export `variantOwned(state)` (any counter `> 0`), `variantPlayable(state)` (`boxed + loose > 0`), `deriveOwnership(tracked)` returning `'owned'` when any variant is owned, else `'wishlist'` when any variant has `wishlist` set, else `'interested'`; `isPlayable(tracked)` (any variant playable); `ownedVariantCount(tracked)` (variants with any copy); `copyCount(tracked)` (sum of every counter); and `representativeVariant(tracked)` returning the first catalog variant that is owned, else the first catalog variant. Ownership and the picture SHALL ignore `wishlist` on an owned variant.

#### Scenario: Interested product

- **WHEN** a tracked product has an empty `variantState`
- **THEN** ownership is `interested`, `isPlayable` is false, `copyCount` is 0, and the representative variant is the first catalog variant

#### Scenario: Owned and wishlisted

- **WHEN** a variant has `sealed 1` and `wishlist true`
- **THEN** ownership is `owned`, `isPlayable` is false, `ownedVariantCount` is 1, `copyCount` is 1

#### Scenario: Mixed copies

- **WHEN** a variant has `sealed 1` and `loose 2`
- **THEN** `isPlayable` is true and `copyCount` is 3

### Requirement: Product card

`ProductCard` SHALL compose `GameCardShell` with `entityNoun` "Product", image = `representativeVariant` resolved via `getDeviceImageUrl`, favorite and remove controls, a `GameBadge` for `line` (variant `dgm-line`), `summaryStats` of an ownership `StatChip` (Owned / Wishlist / Interested with the `dgm-status-chip-*` tints), an `{owned} / {total}` variants chip, a `{copies} copies` chip (`1 copy` at one) rendered only when `copyCount` is above zero, and the product year chip; `summaryLine` = a variant dot line (one glyph per catalog variant: filled when the variant has any copy, half when it is wishlisted with no copy, hollow otherwise, titled with the colourway) followed, when the product has a guide and `isPlayable` is true, by one labelled `.completion-bar` per track; `headerExtra` = an overall-percentage badge under the same gating; `editBody` = a `ProgressSection` labelled "Variants & progress" holding one `btn secondary-action` "Manage" that opens `ProductEditorModal` on the Variants tab (track navigation happens inside the editor), followed by `BuildComments` for notes. No per-track buttons and no wishlist marker beyond the dot line SHALL render on the card.

#### Scenario: Owned product with a guide

- **WHEN** a tracked `dv-25th-color-evolution` has one variant with `sealed 1` and `loose 1` and progress 18/22 partners, 35/69 map
- **THEN** the header badge reads `66%` (mean of 82% and 51%), the chips read `Owned`, `1 / 3`, `2 copies`, `2024`, the dot line has three glyphs with the first filled, and two bars have widths `82%`, `51%`

#### Scenario: Interested product

- **WHEN** a tracked product has no variant state
- **THEN** the chip reads `Interested`, no copies chip, badge, or bars render, and "Manage" still opens the editor (whose track tabs are disabled)

### Requirement: Product editor modal

`ProductEditorModal` SHALL compose `TabbedEditorShell` with title `{product name}`, `bodyClassName` `product-editor-body`, a first tab `variants` ("Variants") listing every catalog variant as a `.variant-row` (colourway, region, year, three compact `Stepper`s labelled Sealed / Boxed / Loose bound to that variant's copy counters, and a compact single-option `ToggleChips` "Wishlist" bound to its `wishlist` flag), followed by one tab per guide track rendering grouped checkbox rows (`.progress-group` with `{done} / {total}` header, `.progress-item` label rows with `.progress-item-hint`). Track tabs SHALL be disabled while `isPlayable` is false, and while the product is owned but not playable the Variants tab SHALL end with a `.product-editor-hint` reading "Open a copy to track progress." Callbacks: `onSetVariantCopies(variantId, condition, count)`, `onSetVariantWishlist(variantId, wishlist)`, `onToggleItem`, `onClose`.

#### Scenario: Ticking a variant

- **WHEN** the user clicks "Increase Sealed" on the Taichi row, which currently has no state
- **THEN** `onSetVariantCopies('dv-25th-yagami-taichi', 'sealed', 1)` is called

#### Scenario: Deselecting a variant

- **WHEN** the user clicks "Decrease Loose" on a row showing `loose 2`
- **THEN** `onSetVariantCopies(variantId, 'loose', 1)` is called; at `loose 0` the decrease button is disabled

#### Scenario: Toggling wishlist

- **WHEN** the user clicks the "Wishlist" pill on a row that is not wishlisted
- **THEN** `onSetVariantWishlist(variantId, true)` is called and the pill carries `aria-pressed="true"` once the state updates

#### Scenario: Track tabs gated

- **WHEN** the editor opens for a product with no playable copy
- **THEN** the track tab buttons are disabled and clicking one does not switch content
