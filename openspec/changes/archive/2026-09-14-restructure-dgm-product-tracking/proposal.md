## Why

The Digimon tracker shipped (PR #70) with the physical unit as its tracked entity: one card per colourway, and completion derived per product line. Walking the collector's journey shows that is the wrong grain. The question order is: _do I own this product?_ — _which of its variants?_ — _how far have I played it?_ Colourways of one release are the same product with the same software; a collector does not want three Digivice -25th cards, and game progress belongs to the product they own, not to a separate roster stitched onto the Completion view (as the now-abandoned `add-dgm-software-progress` draft did). This change restructures the tracker around **products** with **variants**, and puts game progress on the product card.

## What Changes

- **Product catalog replaces the device catalog.** `scripts/seeds/dgm-products.json` (nested: product → variants) and `scripts/seeds/dgm-guides/<productId>.json` (one hand-written progress guide per product that has one) generate `src/data/digimon/products.ts` — `DgmProduct` (id, name, line, series, releaseYear, optional `guide`, `variants`), `DgmVariant` (id = the former device id so ImageKit assets stay valid, colorway, releaseYear, region, imageUrl), `ALL_PRODUCTS`, `DGM_LINES`. `devices.ts` and `software.ts` go away. `--sync-wikimon` reports against products.
- **Product roster.** `dgm_tracked_products` (favorite, notes, `progress text[]`) with child `dgm_tracked_variants` (status owned / wishlist, condition) — loaded through the Extras Adapter, variants written as single-row upserts / deletes. A tracked product with no variant rows is allowed and reads **interested**. Product ownership is derived: owned if any variant is owned, else wishlist if any is wishlisted, else interested. The acquisition date is dropped.
- **One card per product.** `ProductCard` over `GameCardShell`: line badge, ownership chip, owned / total variants chip, a variant dot line, and — when a guide exists and at least one variant is owned — an overall-percentage header badge and one bar per track. The edit body holds notes and buttons that open the **product editor**.
- **Product editor.** `TabbedEditorShell` with a Variants tab (per variant: Owned / Wishlist segmented toggle with deselect, condition when owned) followed by one tab per progress track (grouped checkbox rows with prerequisite semantics). Track tabs are disabled until a variant is owned.
- **Add flow.** `AddProductModal` picks a product; variants are ticked afterwards in the editor.
- **Completion view is pure derivation.** Per line and overall: products owned / total and variants owned / total. No cards, no second roster.
- **Migration.** New tables; existing `dgm_tracked_devices` rows are converted to product + variant rows through a device-id → product-id map carried in the migration, then the old table is dropped.
- **Shared.** `TabbedEditorShell` (N-tab scaffold) is added; `EquipmentEditorShell` becomes its two-tab adapter. `assert_game_table` allowlist is not needed (no RPC). The `GameCardShell` optional-controls and `RosterTracked` relaxations from the abandoned draft are reverted.
- **Guide trimmed to what the player does.** The DVC guide drops its Friends track: friends are met by clearing map areas, so they are a consequence of map completion, not a separate checklist. Secret areas stay as their own items, listed directly under the location they belong to.
- **One entry point into the editor.** The card's edit body holds a single "Manage" action (inside a labelled section, so the shared button's hover lift no longer clips against the edit-body boundary) that opens the product editor on the Variants tab; the tabs inside the editor are the navigation. The per-track buttons are gone.
- **Domain language.** `CONTEXT.md`: **Product**, **Variant**, **Ownership** (owned / wishlist / interested), **Progress Guide** / **Progress Track**, **Game Progress**; Digimon row updated (entity noun **product**).

## Capabilities

### New Capabilities

- `dgm-product-catalog`: the nested product / variant catalog, guide seeds, generation, validation, Wikimon sync.
- `dgm-product-tracking`: product persistence with variant child rows, hook, page, card, add modal, product editor (variants tab).
- `dgm-game-progress`: progress guide semantics (tracks, items, prerequisites, overall formula), the progress array on the product row, editor track tabs, card progress surface, owned-gating.

### Removed Capabilities

- `dgm-device-catalog`: superseded by `dgm-product-catalog`.
- `dgm-device-tracking`: superseded by `dgm-product-tracking`.

### Modified Capabilities

- `dgm-completion-view`: rows report products and variants per line; no game-progress section.
- `shared-ui-components`: `TabbedEditorShell` added; `EquipmentEditorShell` respecified as its two-tab adapter.

## Impact

- **Code:** `src/data/digimon/{products.ts,products.test.ts}` (replacing `devices.ts`, `software.ts`), `src/services/digimon/productService.ts`, `src/hooks/digimon/useProducts.ts`, `src/pages/digimon/{DigimonPage,completion,gameProgress}.ts(x)`, `src/pages/digimon/components/{ProductCard,ProductEditorModal,AddProductModal,CompletionView}`, `src/components/{TabbedEditorShell,EquipmentEditorShell}.tsx`, `src/types.ts`, `CONTEXT.md`, `CLAUDE.md`. The working tree currently holds the abandoned draft's device-based files; they are reworked or deleted in this change.
- **Database:** `supabase/migrations/20260913000001_restructure_dgm_products.sql` — create `dgm_tracked_products` and `dgm_tracked_variants` with RLS, migrate rows, drop `dgm_tracked_devices`. Single-row writes only; no RPC.
- **Scripts:** `scripts/update-dgm-data.mjs` reads the product seed and guide seeds, validates both, emits `products.ts`; ImageKit asset paths unchanged (`/assets/digimon/devices/{variantId}.webp`).
- **Docs / Storybook:** `TabbedEditorShell.stories.tsx`; `CONTEXT.md`, `CLAUDE.md` catalog and card guidance.
- **Memory:** `dgm-data-sources` updated for the product seed and Humulos-informed guide seeds.
