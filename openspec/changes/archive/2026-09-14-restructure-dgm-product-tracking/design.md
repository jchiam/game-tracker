## Context

The Digimon tracker's tracked entity is the physical device: `dgm_tracked_devices` has one row per colourway with status, condition, acquisition date, and notes, and the Completion view counts owned devices per product line. An abandoned draft (`add-dgm-software-progress`, never committed; its files are still in the working tree) added game progress as a second roster keyed by "software", rendered as extra cards inside the Completion view.

The collector's journey does not follow that split. The unit of interest is the **product** (Digivice -25th COLOR EVOLUTION-, Digital Monster Ver.20th); its colourways are **variants** of that product; and game progress is something you do with a product you own. Three cards for one Digivice and a progress card living in a stats view are two symptoms of the same wrong grain.

The seed already carries the product key: `(line, series)` groups the 89 device rows into 43 products (largest: Ver.20th with 8 colourways including the English release; 19 products have one variant). Variant ids stay equal to the former device ids so every ImageKit asset under `/assets/digimon/devices/{id}.webp` remains valid.

Constraints carried over: never hand-edit `src/data/**`; token-first CSS; RLS on every table; compose the shared roster machinery (`createRosterPersistence` with the Extras Adapter, `useRoster`, `makeFieldUpdater`, `queueAction`, `GameCardShell`, `AddEntityModal`); multi-row writes go through RPCs, single-row writes do not; no script fetches Humulos.

## Goals / Non-Goals

**Goals:**

- One tracked entity — the product — carrying ownership of its variants and its game progress.
- Journey order on one card: own it? → which variants? → how far played?
- Keep every existing shared seam; the product is a "character", its variants are "equipment slots".
- Reuse what the abandoned draft got right: the N-tab shell, the progress math, the DVC guide seed, the generator validation.
- Completion view stays a pure derivation, now over products and variants.

**Non-Goals:**

- Acquisition dates (dropped) and per-variant notes (notes are product-level).
- Multiple copies of one variant.
- Progress on products with no owned variant (interest and wishlist do not unlock the track tabs).
- Two products sharing one progress guide. A guide is keyed by product id; if that case ever appears, the seed duplicates the guide file.
- Numeric progress. Items are booleans.

## Decisions

### D1 — Catalog: nested products with variants, guides keyed by product

`scripts/seeds/dgm-products.json` is an array of products:

```json
{
  "id": "dv-25th-color-evolution",
  "name": "Digivice -25th COLOR EVOLUTION-",
  "line": "Digivice",
  "series": "-25th COLOR EVOLUTION-",
  "releaseYear": 2024,
  "wikimon": "Digivice -25th COLOR EVOLUTION-",
  "variants": [
    {
      "id": "dv-25th-anime-original",
      "colorway": "Anime Original Color",
      "releaseYear": 2024,
      "region": "JP",
      "imageSource": "wikimon:Digivice_25thcolorevolution.jpg"
    }
  ]
}
```

`scripts/seeds/dgm-guides/<productId>.json` (the former `dgm-software/dvc.json`, renamed) is the product's progress guide: `overall` formula and `tracks → groups → items` with `hint` / `requires`. The generator attaches it as `DgmProduct.guide` when a file with the product's id exists and rejects a guide file that names no product.

Generated `src/data/digimon/products.ts`:

```ts
export interface DgmVariant {
  id: string;
  colorway: string;
  releaseYear: number;
  region: 'JP' | 'NA' | 'EU' | 'ASIA';
  imageUrl: string;
}
export interface DgmProgressItem {
  id: string;
  label: string;
  hint?: string;
  requires?: string[];
}
export interface DgmProgressGroup {
  id: string;
  label: string;
  items: DgmProgressItem[];
}
export interface DgmProgressTrack {
  id: string;
  label: string;
  groups: DgmProgressGroup[];
}
export interface DgmProgressGuide {
  overall: 'track-mean' | 'item-weighted';
  tracks: DgmProgressTrack[];
}
export interface DgmProduct {
  id: string;
  name: string;
  line: string;
  series: string;
  releaseYear: number;
  variants: DgmVariant[];
  guide?: DgmProgressGuide;
}
export const ALL_PRODUCTS: DgmProduct[];
export const DGM_LINES: string[];
```

Product `releaseYear` is the earliest variant year; `region` lives on variants only (the English Ver.20th is a variant of Ver.20th). Product ids are `{line-abbrev}-{series-slug}` (`dm-ver20th`, `dv-25th-color-evolution`, `pen-color-1`); a one-time scratchpad script derives the product seed from the current device seed, then the product seed is the source of truth. `--sync-wikimon` iterates products (one page per product) and reports variant colourways the seed lacks.

_Alternative:_ keep the flat device seed with a `product` field. Rejected: product-level fields (name, year, guide) would be repeated on every row or inferred, and the generator would re-derive grouping every run.

### D2 — Persistence: product row plus variant child rows

```sql
CREATE TABLE dgm_tracked_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  is_favorited BOOLEAN NOT NULL DEFAULT false,
  notes TEXT NOT NULL DEFAULT '',
  progress TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (profile_id, product_id)
);
CREATE TABLE dgm_tracked_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracked_product_id UUID NOT NULL REFERENCES dgm_tracked_products(id) ON DELETE CASCADE,
  variant_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('owned', 'wishlist')),
  condition TEXT CHECK (condition IN ('sealed', 'boxed', 'loose')),
  UNIQUE (tracked_product_id, variant_id)
);
```

A variant row exists only while its status is set; clearing the status deletes the row. RLS on the child table follows the HSR relic pattern: policies check `EXISTS (SELECT 1 FROM dgm_tracked_products p WHERE p.id = tracked_product_id AND p.profile_id = (SELECT auth.uid())::text)`. Indexes on `profile_id` and `tracked_product_id`.

Ownership is derived, never stored: **owned** if any variant row is `owned`; else **wishlist** if any is `wishlist`; else **interested** (product tracked, no variant rows — the collector wants to remember it).

The migration converts existing rows: for each `dgm_tracked_devices` row, upsert the product row (favorite = any device favorited, notes = joined non-empty notes) and insert a variant row with the device's status and condition, using a `(device_id, product_id)` VALUES map emitted from the product seed at authoring time. `acquired_on` is dropped. Then `DROP TABLE dgm_tracked_devices`.

_Alternative:_ variants as a JSONB column on the product row. Rejected: per-variant status / condition would lose the CHECK constraints and the single-row upsert would carry the whole map on every toggle.

### D3 — Service: roster adapter with an Extras Adapter, plus two variant writers

`src/services/digimon/productService.ts` calls `createRosterPersistence` over `ALL_PRODUCTS` with `columns { notes, isFavorited, progress }`, insert defaults `{ notes: '', is_favorited: false, progress: [] }`, and `extras.selectFragment = 'dgm_tracked_variants ( variant_id, status, condition )'` mapped into `DgmTrackedProduct.variantState: Record<variantId, { status, condition }>`. Two per-game exports: `upsertVariant(trackedProductId, variantId, { status, condition })` — a single-row `.upsert(…, { onConflict: 'tracked_product_id,variant_id' })` — and `deleteVariant(trackedProductId, variantId)`. Both are single-row writes, so no RPC and no `assert_game_table` entry.

### D4 — Hook: `useProducts`

`src/hooks/digimon/useProducts.ts` wraps `useRoster` (nouns product / products; Fuse keys `name`, `line`, `series`, `variants.colorway`). Plain updaters via `makeFieldUpdater`: `updateNotes`, `toggleFavorite`, `updateProgress`. Custom updaters through `queueAction` (the relic precedent): `setVariantStatus(productId, variantId, status | null)` and `setVariantCondition(productId, variantId, condition | null)` — optimistic set on the variant map, then `upsertVariant` / `deleteVariant`, rollback on error. `getFilteredRoster(search, 'ALPHA' | 'YEAR', entities?)` as today.

### D5 — Types

```ts
export type DgmVariantStatus = 'owned' | 'wishlist';
export type DgmCondition = 'sealed' | 'boxed' | 'loose';
export type DgmOwnership = 'owned' | 'wishlist' | 'interested';
export interface DgmTrackedVariant {
  status: DgmVariantStatus;
  condition: DgmCondition | null;
}
export interface DgmTrackedProduct extends DgmProduct {
  dbId?: string;
  isFavorited: boolean;
  notes: string;
  progress: string[];
  /** Keyed by variant id; a missing key means the variant is not owned or wishlisted. */
  variantState: Record<string, DgmTrackedVariant>;
}
export interface DgmProductPatch {
  notes?: string;
  isFavorited?: boolean;
  progress?: string[];
}
```

The catalog's `variants` array keeps its name on the tracked type; the per-user map is `variantState` so the two never shadow each other.

### D6 — Pure modules

- `src/pages/digimon/ownership.ts`: `deriveOwnership(tracked)`, `ownedVariantCount(tracked)`, `representativeVariant(tracked)` (first owned variant, else first catalog variant — the card image).
- `src/pages/digimon/gameProgress.ts` (the draft's `softwareProgress.ts`, retargeted to `DgmProgressGuide`): `computeProgress(guide, progress)` and `toggleProgressItem(guide, progress, itemId)` with the same track-mean / item-weighted and transitive-requires semantics.
- `src/pages/digimon/completion.ts`: `computeCompletion(tracked)` now yields per line and overall `{ productsOwned, productsTotal, variantsOwned, variantsTotal }`; the primary bar is products, the secondary readout variants. Wishlist and interested never count.

### D7 — Card

`ProductCard` over `GameCardShell` (favorite and remove present — this is a real roster card):

```
┌─────────────────────────────────┐
│ [representative variant]  ★ ✕ ✎ │
│ [Digivice]             ┌────┐   │  headerExtra: overall % badge,
│                        │41% │   │  only when guide && ownership === 'owned'
├────────────────────────└────┘───┤
│ Digivice -25th COLOR EVOLUTION- │
│ Owned · 1 / 3 · 2024            │  chips: ownership, owned/total variants, year
│ ● Anime Original ○ Taichi ○ Yamato │  variant dot line (● owned ◐ wishlist ○ none)
│ Partners ████░░  Friends ██░░   │  one bar per track (same gating as the badge)
├─── edit ────────────────────────┤
│ [Manage variants]               │  opens editor on Variants tab
│ [Partners] [Friends] [Map]      │  open editor on that track; disabled until owned
│ Notes …                         │  BuildComments
└─────────────────────────────────┘
```

Chips are `StatChip`s with the existing `dgm-status-chip-*` tints plus a neutral **Interested** tint. The dot line and the bars are `summaryLine` array entries; bars reuse `.completion-bar` from a shared `src/pages/digimon/completion.css`.

### D8 — Product editor

`ProductEditorModal` composes `TabbedEditorShell`: tab `variants` ("Variants") lists every catalog variant as a row — colourway, region, year, a `SegmentedButtons` (static, `allowDeselect`) Owned / Wishlist, and, when owned, a `SegmentedButtons` (static, `allowDeselect`) Sealed / Boxed / Loose. Then one tab per guide track (the draft's `ProgressEditorModal` body: grouped checkbox rows with hint, group `done / total`). Track tabs render only when the product has a guide; they are disabled (`aria-disabled`, no content switch) while no variant is owned, with the tab label suffixed "· own a variant first"? Simpler: the shell gains an optional `disabled` flag per tab that renders the button disabled with a title; the editor sets it from ownership.

### D9 — Add flow and page

`AddProductModal` is an `AddEntityModal` config wrapper over `ALL_PRODUCTS` (title "Add Product", noun "products", search keys `name`, `line`, `series`, `variants.colorway`, badges: line and `{n} variants`). Adding inserts the product row only (ownership = interested); the collector opens the editor to tick variants. `DigimonPage` composes `useProducts` + `useRosterView` (sort ALPHA / YEAR by product `releaseYear`), one `ProductCard` per filtered product, `CompletionView` as `secondView`, `AddProductModal`. `projection.refreshBasis(id)` on favorite toggle and edit commit as today; the editor modal's close is also a release point.

### D10 — Shared shells

`TabbedEditorShell` (from the draft) stays and gains the per-tab `disabled?: boolean` (D8). `EquipmentEditorShell` remains its two-tab adapter. The draft's `GameCardShell` optional-controls change and `RosterTracked.isFavorited?` relaxation are reverted: nothing needs them now.

### D11 — DVC guide: no Friends track; secret areas sit under their location

The Friend List is filled by meeting Digimon while clearing map areas (event, battle, boss, secret encounters all add the friend). Tracking 82 friends by hand would duplicate map progress with a longer, noisier list, so the DVC guide has two tracks: `partners` and `map`. `overall` stays `track-mean` (now the mean of two).

Secret areas are real completion targets (they unlock at random while clearing a location's other areas, and V-dramon needs every one), so each keeps its own item. They are placed **directly after the location they belong to** rather than in a block at the end of the map group, labelled `{Location} · secret area` with hint `Secret · {Digimon}`, and carry no `requires` (a secret can be found before the location's boss falls). A map group therefore reads: Tropical Jungle, Tropical Jungle · secret area, Lake, Lake · secret area, … Locations still chain through `requires`.

### D12 — One editor entry point on the card

The edit body holds one action, "Manage", inside a `ProgressSection` labelled "Variants & progress" (the same placement every other game uses for its editor buttons — HSR's "Edit Preferences" lives inside a section, never as the first child of the edit body). It opens `ProductEditorModal` on the Variants tab; the editor's own tab bar is how the collector reaches a track, with track tabs disabled until a variant is owned. The four-button row (Manage variants + one per track) is removed: it duplicated the modal's tabs and its `.btn` hover lift (`translateY(-2px)`) was clipped by `.game-card-edit-body`'s `overflow: hidden` when the row was the first thing in the edit body, which read as the button sliding under the product name.

## Risks / Trade-offs

- **Data migration correctness.** The device → product map is generated from the seed; a device id missing from the map would drop a row. Mitigation: the migration raises if any `dgm_tracked_devices.device_id` is not in the map, so it fails loudly instead of losing data; verified on the throwaway `postgres:16` harness with seeded rows.
- **Variant toggle round trips.** Each status change is one upsert or delete; the debounced queue coalesces rapid taps on the same variant. Acceptable.
- **Fuse nested key.** `variants.colorway` search relies on Fuse's nested-path support; verified in the add-modal test.
- **Working tree churn.** The abandoned draft's files are deleted or rewritten; nothing from it was committed, so no history is affected.

## Migration Plan

1. Regenerate `products.ts` from the new seeds; delete `devices.ts` and `software.ts`.
2. Apply `20260913000001_restructure_dgm_products.sql` (creates, migrates, drops).
3. Deploy. Collectors see one card per product, variants pre-ticked from their old rows.

Rollback: restore `dgm_tracked_devices` from the pre-migration backup; revert code.

## Open Questions

- Whether the Ver.20th English release should be its own product is a seed decision deferred to the collector; the model handles either.
