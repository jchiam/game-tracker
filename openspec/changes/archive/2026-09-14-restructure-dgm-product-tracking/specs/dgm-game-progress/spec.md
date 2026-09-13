## ADDED Requirements

### Requirement: Progress math is a pure module over the product's guide

`src/pages/digimon/gameProgress.ts` SHALL export `computeProgress(guide, progress)` returning `{ overall, tracks }` where each track entry has `id`, `label`, `done` (items whose id is in `progress`), `total`, and integer `percent`; `overall` is the rounded mean of track percentages for `track-mean` and the rounded ratio of all done items over all items for `item-weighted`; zero-item tracks read 0. It SHALL export `toggleProgressItem(guide, progress, itemId)` returning a new array: checking adds the item and, transitively, every id it `requires`; unchecking removes the item and, transitively, every item whose `requires` includes it; unknown ids are dropped; output follows guide item order.

#### Scenario: Track-mean overall

- **WHEN** a `track-mean` guide has tracks at 45%, 26%, and 51%
- **THEN** `overall` is 41

#### Scenario: Item-weighted overall

- **WHEN** an `item-weighted` guide has 58 done of 159 items
- **THEN** `overall` is 36

#### Scenario: Checking pulls prerequisites

- **WHEN** Greymon (`requires` Agumon, which `requires` Koromon) is checked on an empty progress
- **THEN** the result contains Koromon, Agumon, and Greymon

#### Scenario: Unchecking drops dependents

- **WHEN** Agumon is unchecked while Greymon and MetalGreymon are checked
- **THEN** the result contains none of the three

### Requirement: Progress lives on the tracked product and requires an owned variant

Game progress SHALL be stored as `dgm_tracked_products.progress` (checked item ids) and patched whole through `updateProgress`. The page SHALL apply an editor toggle as `updateProgress(id, toggleProgressItem(product.guide, current.progress, itemId))` from the latest tracked entry. Progress surfaces (card badge, card bars, editor track tabs) SHALL render or enable only when the product has a `guide` and `deriveOwnership(tracked) === 'owned'`; stored progress is kept but hidden when ownership drops below owned.

#### Scenario: Toggle merges through the pure module

- **WHEN** the user checks Metal Greymon while Greymon is already checked
- **THEN** `updateProgress('dv-25th-color-evolution', ['partners:taichi-greymon', 'partners:taichi-metal-greymon'])` is issued

#### Scenario: Progress hidden for wishlist

- **WHEN** a product's only variant moves from owned to wishlist
- **THEN** the card badge and bars disappear and the editor's track tabs are disabled, while `progress` is unchanged in state
