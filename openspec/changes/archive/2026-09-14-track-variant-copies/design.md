## Context

`dgm_tracked_variants` holds one row per (tracked product, variant) with an exclusive `status` (`owned` | `wishlist`) and a nullable `condition` (`sealed` | `boxed` | `loose`). That encodes "at most one copy per variant" and "you cannot want what you already have". The collector in question owns multiple copies of one variant in mixed conditions (sealed + loose), sometimes several in the same condition, and may still want another. The current gate for Game Progress is `deriveOwnership === 'owned'`, which enables the checklist for a product whose only copy is sealed and cannot be played.

Constraints: the row-per-variant shape, the Extras Adapter join, the single-row `upsertVariant` / `deleteVariant` writers through `queueAction`, RLS through the parent row, and the "row exists only while meaningful" invariant all stay. No per-copy attributes (acquired date, price, serial) are wanted now or later. The remote DB already carries real rows for this schema, applied by hand from `20260913000001`.

## Goals / Non-Goals

**Goals:**

- Record any number of copies per variant, bucketed by condition.
- Make wishlist orthogonal to ownership.
- Gate Game Progress on a _playable_ copy (boxed or loose).
- Migrate existing rows in place with one stated assumption (NULL condition = loose).
- Surface the copy total on the card and the Completion view; keep the wishlist marker editor-only.
- Add the missing shared integer-stepper primitive rather than hand-rolling buttons in the Digimon editor.

**Non-Goals:**

- Per-copy identity or metadata (no copy rows, no acquired date, no price).
- A wishlist target condition ("want one sealed").
- Changing product-level ownership semantics (owned > wishlist > interested) or the catalog seed.
- A down migration; the project convention is forward-only migrations.

## Decisions

### D1 — Counts per condition, not copy rows or a condition set

Three shapes were weighed:

| Shape                       | 1 sealed + 1 loose | 2 sealed | Unknown condition | Per-copy fields later | Row shape                         |
| --------------------------- | ------------------ | -------- | ----------------- | --------------------- | --------------------------------- |
| A. one row per copy         | yes                | yes      | nullable column   | natural               | unique constraint dropped, n rows |
| **B. counts per condition** | yes                | yes      | needs a rule      | no                    | one row, 3 ints                   |
| C. `condition text[]`       | yes                | **no**   | empty set         | no                    | one row                           |

C is out because "more than one of any condition" is a real case. A is only better than B when per-copy fields are wanted, which the user ruled out. B keeps the unique `(tracked_product_id, variant_id)` row, the Extras Adapter, and the one-row writer unchanged — smallest blast radius. The "unknown condition" rule is D3.

### D2 — Wishlist is a boolean column beside the counters

`status` collapsed desire and possession into one slot. Splitting `wishlist BOOLEAN` out lets a variant be owned and wanted. The row invariant becomes `wishlist OR sealed + boxed + loose > 0`, expressed as a CHECK so the DB, not only the client, rejects an empty row. The hook deletes the row when a write would violate it.

### D3 — Existing NULL-condition owned rows become one loose copy

Counters have no "unknown" bucket, and adding one would leak the old limbo state into the new model. The stepper tap _is_ the condition from now on, so no new NULL can arise. For the backfill, `loose` is the lowest completeness tier and the only one that neither over-claims (sealed / boxed) nor hides the copy; it also keeps such products playable, matching what the old model allowed. The user accepted this mapping. The migration applies it as a single `UPDATE … CASE` before dropping the old columns.

### D4 — Playable is a separate derivation, not a change to ownership

`variantOwned = sealed + boxed + loose > 0`, `variantPlayable = boxed + loose > 0`, `isPlayable(tracked) = any variant playable`. Product ownership keeps reading `variantOwned`, so the card chip, dot line, Completion counts, and representative picture do not shift meaning. Only the Game Progress gate switches from ownership to `isPlayable`. All of it lives in `src/pages/digimon/ownership.ts`, so there is still one function family to read.

### D5 — Editor controls: three steppers and one wishlist pill

Per variant row: `Sealed − n +`, `Boxed − n +`, `Loose − n +`, then a single-option `ToggleChips` ("Wishlist") carrying `aria-pressed`. No "Owned" button remains — owned is implied by any counter above zero. `ToggleChips` already models an independent boolean pill; it is reused rather than a one-off toggle. `Stepper` is new (see D6). When the product is owned but not playable, the Variants tab shows a `.product-editor-hint` line ("Open a copy to track progress.") and the track tabs stay disabled.

### D6 — Stepper is a shared L3 primitive

No integer stepper exists among the build-preference primitives (`Select`, `LevelSlider`, `SegmentedButtons`, `ToggleChips`, …). Hand-rolling minus / plus buttons in the Digimon editor would violate the "compose the primitives" rule and leave the next game to reinvent it. `Stepper` takes `label`, `value`, `onChange(next)`, `min` (default 0), optional `max`, `disabled`, `size`; renders `role="group"` with the label, two self-styled `.stepper-btn` buttons (aria-labels "Decrease {label}" / "Increase {label}", disabled at the bounds) and a `.stepper-value` readout. Styles live in `controls.css`; a story in `src/components/Stepper.stories.tsx` and a `ControlPatterns` entry document it; the primitive table in `CLAUDE.md` gains a row.

### D7 — Card and Completion readouts

Card `summaryStats`: ownership chip, `{ownedVariants} / {total}` chip (unchanged), a new `{copies} copies` chip rendered only when the copy total is above zero, then the year chip. The dot line keeps three glyphs: filled when the variant has a copy, half when wishlisted with no copy, hollow otherwise — owned-and-wishlisted renders filled, since the wishlist marker is editor-only by decision. The Completion row's secondary readout becomes `{variantsOwned} / {variantsTotal} variants · {copies} copies`; `computeCompletion` gains `copiesOwned`.

### D8 — Hook API

`setVariantCopies(productId, variantId, condition, count)` clamps `count` to zero or above, builds the next state from the current one, and calls the existing `writeVariant`; `setVariantWishlist(productId, variantId, wishlist)` likewise. `writeVariant` maps "no copies and not wishlisted" to `null` (delete) — the same optimistic set / `queueAction` / rollback path as today. `upsertVariant` writes the full row (`wishlist`, `sealed`, `boxed`, `loose`) on conflict of the same key.

## Risks / Trade-offs

- [Backfill assumption is wrong for some row] → NULL → loose is the least-claiming bucket, the user confirmed it, and every count is one tap away in the editor.
- [CHECK rejects a client write that would leave an empty row] → the hook never issues such an upsert; it deletes instead. A test covers each path.
- [Counters drift negative through a stale optimistic state] → clamp in the hook and `CHECK (>= 0)` in the DB.
- [Remote already on `20260913000001`; a second hand-applied migration] → the new file takes the next version; verify on the throwaway `postgres:16` harness (RLS via parent, CHECK, backfill of all four old states) before any `db push`, which needs an explicit go.
- [Stepper adds a shared component surface] → small, single-purpose, documented in Storybook and the primitive table; no game-specific colour.

## Migration Plan

1. `20260914000000_dgm_variant_copies.sql`: add `wishlist BOOLEAN NOT NULL DEFAULT false` and `sealed`, `boxed`, `loose` as `INTEGER NOT NULL DEFAULT 0 CHECK (>= 0)`; backfill with `wishlist = (status = 'wishlist')`, `sealed = 1` when `status = 'owned' AND condition = 'sealed'` (boxed likewise), `loose = 1` when `status = 'owned' AND (condition = 'loose' OR condition IS NULL)`, else 0; drop `status` and `condition`; add `CONSTRAINT dgm_tracked_variants_meaningful CHECK (wishlist OR sealed + boxed + loose > 0)`. RLS policies, unique key, and index are untouched.
2. Run the Docker harness with seeded rows for all four old states (wishlist, owned+sealed, owned+boxed, owned+NULL) and assert the resulting counters and that an all-zero, non-wishlist insert is rejected.
3. Ship code and migration in one PR; the user applies `supabase db push` after an explicit go.
4. Rollback = revert the PR and hand-write the inverse (`status` from counters, `condition` from the single non-zero bucket) — only lossless while every variant has at most one copy, which is why it is not shipped.

## Open Questions

None. Copy semantics, wishlist placement, card readout, and the NULL mapping were settled in exploration.
