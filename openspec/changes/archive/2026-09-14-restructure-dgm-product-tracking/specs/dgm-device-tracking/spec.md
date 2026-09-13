## REMOVED Requirements

### Requirement: Tracked device persistence

**Reason**: Ownership is tracked per product with variant child rows (`dgm-product-tracking`); `dgm_tracked_devices` is migrated into `dgm_tracked_products` + `dgm_tracked_variants` and dropped. The acquisition date is not carried over.

**Migration**: `20260913000001_restructure_dgm_products.sql` converts rows through a device-id → product-id map and fails loudly on any unmapped id.

### Requirement: Device roster hook

**Reason**: Replaced by `useProducts` in `dgm-product-tracking`.

**Migration**: `useDevices.ts` and its test are deleted.

### Requirement: Device page

**Reason**: Replaced by the product page requirement in `dgm-product-tracking` (same layout, product cards, add-product modal).

**Migration**: `DigimonPage.tsx` is rewritten.

### Requirement: Device card

**Reason**: Replaced by `ProductCard`; variant status and condition move into the product editor's Variants tab; the acquired date input is dropped.

**Migration**: `DeviceCard.tsx/.css/.test.tsx` are deleted; status-chip and line-badge CSS tints move to `ProductCard.css`.

### Requirement: Add device modal

**Reason**: Replaced by `AddProductModal`, which picks a product; variants are set afterwards in the editor.

**Migration**: `AddDeviceModal.tsx` and its test are deleted.
