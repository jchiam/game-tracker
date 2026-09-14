## MODIFIED Requirements

### Requirement: Progress lives on the tracked product and requires an owned variant

Game progress SHALL be stored as `dgm_tracked_products.progress` (checked item ids) and patched whole through `updateProgress`. The page SHALL apply an editor toggle as `updateProgress(id, toggleProgressItem(product.guide, current.progress, itemId))` from the latest tracked entry. Progress surfaces (card badge, card bars, editor track tabs) SHALL render or enable only when the product has a `guide` and `isPlayable(tracked)` is true — at least one variant holds a boxed or loose copy; a sealed copy is unopened and cannot be played. Stored progress is kept but hidden when the product stops being playable. While the product is owned but not playable, the editor's Variants tab SHALL show a `.product-editor-hint` reading "Open a copy to track progress."

#### Scenario: Toggle merges through the pure module

- **WHEN** the user checks Metal Greymon while Greymon is already checked
- **THEN** `updateProgress('dv-25th-color-evolution', ['partners:taichi-greymon', 'partners:taichi-metal-greymon'])` is issued

#### Scenario: Progress hidden for wishlist

- **WHEN** a product's only copy is removed and the variant is left wishlisted
- **THEN** the card badge and bars disappear and the editor's track tabs are disabled, while `progress` is unchanged in state

#### Scenario: Sealed-only product is not playable

- **WHEN** a product's only copy is sealed
- **THEN** the card shows no badge or bars, the editor's track tabs are disabled, and the Variants tab shows the hint "Open a copy to track progress."

#### Scenario: Any playable copy enables progress

- **WHEN** a product holds one sealed and one loose copy of the same variant
- **THEN** the card badge, bars, and editor track tabs are enabled
