## REMOVED Requirements

### Requirement: Device catalog data file

**Reason**: The tracked entity is now the product; the flat device catalog is replaced by the nested product / variant catalog in `dgm-product-catalog` (`src/data/digimon/products.ts`). Variant ids equal the former device ids so ImageKit assets are untouched.

**Migration**: `devices.ts` is deleted; consumers import `ALL_PRODUCTS` / `DGM_LINES` from `@/data/digimon/products`.

### Requirement: Catalog is generated from a hand-authored seed

**Reason**: Superseded by the nested product seed (`scripts/seeds/dgm-products.json`) in `dgm-product-catalog`.

**Migration**: A one-time script converts the device seed to the product seed; the device seed is deleted.

### Requirement: External sources inform the seed, never overwrite it

**Reason**: Restated over products in `dgm-product-catalog` (same Wikimon sync semantics, same Humulos exclusion).

**Migration**: None beyond the seed conversion.

### Requirement: Manual-dispatch regeneration workflow

**Reason**: Restated in `dgm-product-catalog`; the workflow file is unchanged.

**Migration**: None.
