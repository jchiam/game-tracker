## 1. Shared hook — chip facets

- [x] 1.1 In `src/hooks/useRosterView.ts`, add `RosterFilterFacet<T>` (`key`, `label`, `mode: 'any' | 'one'`, `chips`), widen `filterChips` to `(RosterFilterChip<T> | RosterFilterFacet<T>)[]`, remove the `group` field from `RosterFilterChip` and the descriptor chip, and delete the dev-only adjacency guard from the first cut
- [x] 1.2 Flatten the declared list once per render (`allChips` in declaration order + `facetOf(key)`); every existing use of the chip list (projection memo, held detection, no-match copy, descriptor) reads the flat list
- [x] 1.3 Make `toggleChip` mode-aware: active → delete; inactive in a `one` facet → delete every sibling key, then add; still one fresh `Set` per toggle
- [x] 1.4 Compose the held ghost tag as `no longer matches {facet.label} · {chip.label}` when the chip's facet is labelled (two or more chips), else `no longer matches {chip.label}`
- [x] 1.5 Replace `filters.chips` with `filters.rows: { key, label?, mode, chips }[]` — one row per facet (label only when `chips.length >= 2`), one unlabelled `any` row per run of consecutive bare chips; keep `accent`
- [x] 1.6 Hook tests in `src/hooks/useRosterView.test.ts`: replace the first-cut group tests with facet tests — `one` sibling swap in one update; clicking the active member clears the facet; `any` facet chips toggle independently; `one` member ANDs with a bare chip and never with its sibling; rows descriptor (labelled facet, single-chip facet unlabelled, bare-chip run coalesced); ghost tag composes the facet label; bare-chip ghost tag unchanged; existing chip tests pass against `rows`

## 2. Layout and styles — facet matrix

- [x] 2.1 In `src/components/RosterPageLayout.tsx`, render `filters.rows` as `.filter-facet` rows: labelled rows get `role="group"`, `aria-label`, and a `.filter-facet-label` span; unlabelled rows get `.is-unlabelled`; chips live in `.filter-facet-chips` with `mode-one` / `mode-any`; every chip button carries `aria-pressed`; delete the first-cut `bucketChips` / `.filter-chip-group` markup
- [x] 2.2 In `src/styles/controls.css`, replace the `.filter-chip-group` rules with the matrix: `.filter-row` as a `max-content 1fr` grid, `.filter-facet` as a subgrid row, `.filter-facet-label` in the uppercase-muted idiom (`--typography-font-size-xs`, display font, `--color-text-secondary`), `.filter-facet-chips` wrapping flex in column 2 (spanning both columns under `.is-unlabelled`), and the joined-pill rules under `.filter-facet-chips.mode-one`; token-only, no new transitions
- [x] 2.3 Update `src/styles/ControlPatterns.stories.tsx` `FilterChips` story to a facet matrix: a labelled `any` row, a labelled `one` row with one member active, and an unlabelled bare-chip row
- [x] 2.4 Update `src/components/RosterPageLayout.stories.tsx` `FilterChips` story to the P5X four-facet `rows` descriptor
- [x] 2.5 Verify in Storybook: label column aligns across rows; `one` rows render as joined pills with the active member's accent border winning the overlap in both positions; `any` rows wrap inside their chips cell at 420px without moving the label column; R1999-style bare chips render as one unlabelled row

## 3. Revelation preference helper

- [x] 3.1 Extract `export function hasRevelationPreferences(prefs: P5xRevelationPreferences): boolean` in `src/utils/revelationScoring.ts` (heavens set, space set, any sub-stat, or any Moon/Star/Sky main chain); point the `createEquipmentScore` config's `hasPreferences` at it
- [x] 3.2 Tests in `src/utils/revelationScoring.test.ts`: helper true for each single signal, false for the empty preference shape; scorer still returns `-1` when the helper is false

## 4. P5X facets

- [x] 4.1 Replace `FILTER_CHIPS` in `src/pages/persona-5-phantom-x/P5xPage.tsx` with the four facets from design D7 — Weapon (`any`: `Sub-5★`, `Under Lv 80`), Mindscape (`one`: `No Outer`, `No Inner`), Revelations (`any`: `Open slots`, `No build`), Skills (`one`: `Under Lv 8`, `🌹 Rose-gated`); update the header comment
- [x] 4.2 Update `src/pages/persona-5-phantom-x/P5xPage.test.tsx` to the new labels and matrix: four `role="group"` rows named Weapon / Mindscape / Revelations / Skills with their chips in order; joined pill only on Mindscape and Skills; predicate tests for all eight chips; `any` independence (Weapon pair both active); `one` exclusivity through the UI for both pairs (swap, clear, `aria-pressed`); `No build` agrees with the score sentinel; single-chip no-match copy per chip; held-card tests for `No Outer`, `No Inner`, `Open slots`, `No build` with facet-composed ghost tags

## 5. Collapsible block

- [x] 5.1 In `src/hooks/useRosterView.ts`, add disclosure state: `open` initialised once from `window.matchMedia('(min-width: 600px)')` (open when it matches or `matchMedia` is absent), `toggleOpen`; extend `filters` with `collapsible` (rows ≥ 2), `open`, `toggleOpen`, `activeCount`, `active: { key, label, remove }[]` (facet-composed label via the ghost-tag helper, `remove` = the chip's toggle); add `fullLabel` to each descriptor chip; the open state is not part of the projection key
- [x] 5.2 Hook tests: `collapsible` false for one row, true for two; default open with and without a matching `matchMedia`; `toggleOpen` flips `open` without re-running `filterRoster` or clearing a held card; `active` lists active chips in declaration order with facet-composed labels; `remove` clears the chip
- [x] 5.3 In `src/components/RosterPageLayout.tsx`, when `filters.collapsible`, render a header row: `.filter-chip.filter-toggle` button (`Filters`, chevron, count when non-zero, `aria-expanded`, `aria-controls`) followed, while collapsed, by one `.filter-chip.filter-summary` button per `filters.active` (`{label} ×`, `aria-label="Remove filter {label}"`, click → `remove`); render the matrix (with the controlled id) only while open; non-collapsible blocks render as today
- [x] 5.4 In `src/styles/controls.css`, add `.filter-block` (column wrapper), `.filter-header` (wrapping flex row), `.filter-toggle` chevron rotation under `[aria-expanded="true"]`, `.filter-toggle-count`, and `.filter-summary` (accent fill like an active chip, trailing `×` glyph); token-only, enumerated transitions
- [x] 5.5 Update `ControlPatterns.stories.tsx` with a collapsed header + summary pills example and `RosterPageLayout.stories.tsx` with `collapsible` open and collapsed variants
- [x] 5.6 `P5xPage.test.tsx`: header renders with four rows; collapsed by default under a narrow `matchMedia` mock, open under a wide one; collapsing hides the matrix and shows `Mindscape · No Outer` as a removable pill; removing it clears the chip; a held card survives a disclosure toggle. R1999 / ZZZ page tests: no `Filters` button
- [x] 5.7 Verify in Storybook at 420px: collapsed header is one 32px line with pills wrapping beneath it when needed; expanded matrix unchanged

## 6. Documentation and verification

- [x] 6.1 `CONTEXT.md` Roster View entry: replace the first-cut Chip Group sentence with Chip Facet (labelled dimension nesting chips, `any` / `one` mode, radio within `one`, AND elsewhere, label only at two or more chips, matrix rows, ghost-tag composition) and the collapsible block (disclosure at two or more rows, removable facet-labelled summary pills while collapsed, viewport-dependent default)
- [x] 6.2 Run `npm run lint && npm run format:check && npm test && npm run build`
- [x] 6.3 Run `npx openspec validate --all`
- [x] 6.4 Close verify warnings: page tests for the zero-count header, the unlabelled bare-chip row (no `role="group"`), a chip composing with search + LEVEL sort, and deactivating a chip restoring the roster
- [x] 6.5 `CLAUDE.md` L2 table: list the roster filter block classes on the `controls.css` row
