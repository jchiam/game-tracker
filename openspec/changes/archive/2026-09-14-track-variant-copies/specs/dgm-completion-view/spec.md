## MODIFIED Requirements

### Requirement: Completion view derives per-line progress from the collection

`CompletionView` (`src/pages/digimon/components/CompletionView.tsx`) SHALL render, from `trackedProducts` and `ALL_PRODUCTS` alone, an overall row followed by one row per `DGM_LINES` entry in that order. Each row SHALL show the line name, `productsOwned / productsTotal`, the integer product percentage, a secondary readout `variantsOwned / variantsTotal variants · copiesOwned copies` (`1 copy` at one), and a `.completion-bar` whose `.completion-bar-fill` width equals the product percentage and uses the shared progress gradient. A product counts as **owned** when `deriveOwnership` is `owned`; a variant counts when it holds at least one copy in any condition; `copiesOwned` is the sum of every copy counter across the line's variants; wishlist and interested SHALL NOT count. Totals are catalog counts for the line. `computeCompletion` in `src/pages/digimon/completion.ts` SHALL expose `copiesOwned` on each `CompletionRow`. The view SHALL NOT fetch or persist anything and SHALL render no product cards.

#### Scenario: Owned counts per line

- **WHEN** the catalog has 5 Pendulum products with 12 variants and the user owns variants of 2 products (3 variants, one of them held twice: sealed and loose) and wishlists a third
- **THEN** the Pendulum row reads `2 / 5`, `40%`, `3 / 12 variants · 4 copies`, with fill width `40%`

#### Scenario: Overall row

- **WHEN** the catalog has 43 products and the user owns 10
- **THEN** the overall row reads `10 / 43` and `23%`

#### Scenario: Zero owned

- **WHEN** the user owns nothing in a line
- **THEN** that row still renders with `0 / total`, `0%`, `0 / n variants · 0 copies`, and an empty fill
