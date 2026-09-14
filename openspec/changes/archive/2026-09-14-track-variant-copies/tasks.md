## 1. Shared Stepper primitive

- [x] 1.1 Add `Stepper` to `src/components/Stepper.tsx` (`label`, `value`, `onChange`, `min` default 0, `max`, `disabled`, `size`, `className`; `role="group"`, `.stepper-btn` buttons named "Decrease {label}" / "Increase {label}", `.stepper-value` readout, bound-disabled buttons) with `.stepper`, `.stepper-btn`, `.stepper-value`, `.compact` rules in `src/styles/controls.css` using tokens only
- [x] 1.2 Add `src/components/Stepper.test.tsx` (increment, decrement, min/max disabling, disabled, accessible names)
- [x] 1.3 Add `src/components/Stepper.stories.tsx` (default, at-min, at-max, compact, disabled) and a Stepper entry in `src/styles/ControlPatterns.stories.tsx`
- [x] 1.4 Add the `Stepper` row to the build-preference primitives table in `CLAUDE.md`

## 2. Types and pure modules

- [x] 2.1 In `src/types.ts` replace `DgmTrackedVariant` with `{ wishlist: boolean; copies: DgmCopyCounts }`, add `DgmCopyCounts = Record<DgmCondition, number>`, remove `DgmVariantStatus`, update the doc comment
- [x] 2.2 In `src/pages/digimon/ownership.ts` add `variantOwned`, `variantPlayable`, `isPlayable`, `copyCount`; rewrite `deriveOwnership`, `ownedVariantCount`, `representativeVariant` over copies; update `ownership.test.ts` (interested, owned-and-wishlisted, mixed copies, sealed-only not playable)
- [x] 2.3 In `src/pages/digimon/completion.ts` count a variant on any copy and add `copiesOwned` to `CompletionRow`; update `completion.test.ts`

## 3. Migration

- [x] 3.1 Write `supabase/migrations/20260914000000_dgm_variant_copies.sql` (add `wishlist` + three counters with `>= 0` checks, backfill by CASE with NULL condition → `loose`, drop `status` / `condition`, add `dgm_tracked_variants_meaningful` CHECK; header comment stating the NULL → loose assumption)
- [x] 3.2 Verify on the throwaway `postgres:16` harness: seed (owned, sealed), (owned, boxed), (owned, NULL), (wishlist, NULL) rows, apply full history, assert counters, assert an all-zero non-wishlist insert is rejected, assert RLS through the parent still applies

## 4. Service and hook

- [x] 4.1 In `src/services/digimon/productService.ts` change the extras select fragment to `dgm_tracked_variants ( variant_id, wishlist, sealed, boxed, loose )`, map rows to `{ wishlist, copies }` (coerce non-numbers to 0), and make `upsertVariant` write `wishlist`, `sealed`, `boxed`, `loose`; update `productService.test.ts` (load mapping, upsert payload, delete, DB-disabled, error paths)
- [x] 4.2 In `src/hooks/digimon/useProducts.ts` replace `setVariantStatus` / `setVariantCondition` with `setVariantCopies` (clamp `>= 0`) and `setVariantWishlist`; `writeVariant` deletes when the next state has no copies and is not wishlisted; update `useProducts.test.ts` (set count, last copy removed → delete, wishlist keeps row, wishlist off → delete, rollback)

## 5. UI

- [x] 5.1 Rewrite the Variants tab in `src/pages/digimon/components/ProductEditorModal.tsx`: three compact `Stepper`s (Sealed / Boxed / Loose) + compact single-option `ToggleChips` "Wishlist" per row; gate track tabs on `isPlayable`; render `.product-editor-hint` "Open a copy to track progress." when owned but not playable; new callbacks `onSetVariantCopies`, `onSetVariantWishlist`; update `ProductEditorModal.css` (row layout, hint) and `ProductEditorModal.test.tsx`
- [x] 5.2 Update `src/pages/digimon/components/ProductCard.tsx`: `isPlayable` gate for badge and bars, `{copies} copies` chip when `copyCount > 0`, dot glyph from copies / wishlist, forward the two new callbacks; update `ProductCard.test.tsx`
- [x] 5.3 Update `src/pages/digimon/components/CompletionView.tsx` secondary readout to `… variants · {copiesOwned} copies`; update `CompletionView.test.tsx`
- [x] 5.4 Wire `setVariantCopies` / `setVariantWishlist` through `src/pages/digimon/DigimonPage.tsx`; update `DigimonPage.test.tsx`

## 6. Docs and specs

- [x] 6.1 Update `CONTEXT.md`: Variant (wishlist + copy counters, row invariant), Ownership (`variantOwned`, `isPlayable`, `copyCount`), Game Progress (playable gate, editor hint); add **Copy**, **Condition** (sealed / boxed / loose definitions), and **Playable** entries; update the `dgm` row in the games table
- [x] 6.2 Update the `dgm` bullet in `CLAUDE.md` if it names variant status / condition
- [x] 6.3 Run `npx openspec validate --all`

## 7. Verification

- [x] 7.1 `npm run lint && npm run format:check && npm test && npm run build`
- [x] 7.2 `npm run test:e2e`
- [x] 7.3 Manual check in `npm run dev`: add copies across two conditions on one variant, confirm the card chip reads the copy total, sealed-only disables track tabs with the hint, and wishlist on an owned variant shows only in the editor
