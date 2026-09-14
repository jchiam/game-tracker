## Why

A Digimon variant row holds one `status` (owned or wishlist) and one `condition`, so the tracker can only say "I have one of this colourway". Collectors routinely hold more than one copy of the same variant in different conditions (one sealed on the shelf, one loose in play) and sometimes several in the same condition, and may still want another copy of a variant they already own. The current shape cannot express any of that, and it gates game progress on "owned" even when the only copy is sealed and therefore unplayable.

## What Changes

- **BREAKING (schema)** — `dgm_tracked_variants` drops `status` and `condition` and gains `wishlist BOOLEAN` plus three non-negative copy counters `sealed`, `boxed`, `loose`. A row exists only while it is wishlisted or holds at least one copy (enforced by a CHECK). A new migration backfills existing rows: `status = 'wishlist'` → `wishlist = true`; `status = 'owned'` → one copy in its `condition` bucket, with a NULL condition counted as `loose`.
- `DgmTrackedVariant` becomes `{ wishlist: boolean; copies: { sealed, boxed, loose } }`; `DgmVariantStatus` is removed. Wishlist is orthogonal to ownership: a variant can be owned and still wishlisted.
- The product roster hook replaces `setVariantStatus` / `setVariantCondition` with `setVariantCopies(productId, variantId, condition, count)` and `setVariantWishlist(productId, variantId, wishlist)`; a write that leaves the variant with no copies and no wishlist deletes the row.
- Ownership derivation gains **playable**: a variant is owned when it has any copy, playable when it has a boxed or loose copy. Product ownership stays owned > wishlist > interested; the picture is the first variant with a copy.
- Game progress (card badge, card bars, editor track tabs) is gated on a playable copy instead of on ownership. A product whose only copies are sealed shows an editor hint instead of the track tabs.
- The product editor's Variants tab replaces the Owned / Wishlist and Sealed / Boxed / Loose button rows with three copy steppers (Sealed, Boxed, Loose) and a Wishlist toggle chip. The wishlist marker is editor-only; the card's ownership chip and dot line stay ownership-first.
- The product card adds a copies chip (`{n} copies`, hidden at zero) next to the variants chip; the Completion view's secondary readout adds the copy total per line.
- New shared L3 primitive `Stepper` (`src/components/Stepper.tsx`, styles in `controls.css`, Storybook story, `ControlPatterns` entry) — a labelled `− n +` integer control with a lower bound.
- `CONTEXT.md` gains **Copy** / **Condition** / **Playable** definitions (sealed = shrink-wrap intact, never opened; boxed = opened, box kept; loose = device only) and updates Variant, Ownership, and Game Progress.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `dgm-product-tracking`: variant persistence becomes wishlist + per-condition copy counts; migration backfill; hook API (`setVariantCopies`, `setVariantWishlist`); derived ownership adds playable and copy count; card gains the copies chip; editor Variants tab uses steppers and a wishlist toggle.
- `dgm-game-progress`: progress surfaces gate on a playable copy (boxed or loose), not on ownership; sealed-only products get an editor hint.
- `dgm-completion-view`: a variant counts as owned when it has any copy; rows add a copy total to the secondary readout.
- `shared-ui-components`: adds the `Stepper` primitive requirement.

## Impact

- **Schema**: new migration `supabase/migrations/20260914000000_dgm_variant_copies.sql`; existing remote rows are transformed in place (no data loss beyond the NULL-condition → loose assumption). Must be verified with the throwaway `postgres:16` harness before `db push` (user go required).
- **Types**: `src/types.ts` (`DgmTrackedVariant`, `DgmCondition` kept, `DgmVariantStatus` removed, new `DgmCopyCounts`).
- **Service / hook**: `src/services/digimon/productService.ts` (extras select fragment, `upsertVariant` payload), `src/hooks/digimon/useProducts.ts`.
- **Pure modules**: `src/pages/digimon/ownership.ts` (`variantOwned`, `variantPlayable`, `isPlayable`, `copyCount`), `src/pages/digimon/completion.ts` (copies total).
- **UI**: `ProductEditorModal`, `ProductCard`, `CompletionView`, `DigimonPage` wiring; new `Stepper` component + CSS + story; `ControlPatterns.stories.tsx`.
- **Docs**: `CONTEXT.md`, `CLAUDE.md` (primitive table row for `Stepper`).
- **Tests**: every colocated test above plus `src/test` fixtures; e2e has no Digimon variant coverage to update.
