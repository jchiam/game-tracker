## Why

P5X's `mindscapeProgress` and `skillProgress` are monotone 0/1/2 milestone fields whose "not started" (`0`) and "stuck at milestone 1" (`1`) states are disjoint, yet the roster exposes only one chip per dimension (`MS ✗` for Mindscape `0`, `🌹 Gated` for Skills `1`). Adding the missing sibling as an ordinary chip would let both be active at once and — under the shared AND composition — produce an empty roster with the generic no-match copy: a silent, confusing failure. Growing the row to every grindable bottleneck also exposes a second problem: a flat row of glyph-prefixed chips (`◈ Rev <5`, `MS ✗`, `🌹 Gated`) never says which dimension a chip belongs to, and the only visual grouping available (adjacency) breaks the moment the row wraps inside the 600px toolbar. The shared filter-chip pattern needs a unit for "dimension" that carries both the label and, where the states are disjoint, the exclusivity.

## What Changes

- **Chip facets in the shared roster view.** The chip list may nest chips under a facet — a labelled dimension with a `mode`: `any` (independent toggles) or `one` (radio-exclusive: activating a member deactivates its siblings; clicking the active member clears the facet). Bare chips remain valid. Across facets and bare chips, composition stays logical AND. Predicate composition and no-match selection are unchanged; the held-card ghost tag composes the facet label in front of the chip label when the facet is labelled.
- **Matrix filter row.** `RosterPageLayout` renders the filter row as aligned rows: one per facet (label column + chips cell) and one per run of consecutive bare chips (no label, chips span the row). A facet's label renders only when it holds two or more chips. A `one`-mode facet's chips render as a joined segmented pill; `any`-mode chips stay spaced pills. Each facet row is `role="group"` labelled by the facet. Every chip gains `aria-pressed`.
- **P5X chip set grows from four to eight**, organised into four facets in the card summary's order, with a uniform "what is missing" vocabulary that drops the glyph prefixes and `<` / `✗` symbols:
  - **Weapon** (`any`): `Sub-5★` (`weaponRarity < 5`) · **new** `Under Lv 80` (`weaponLevel < 80`)
  - **Mindscape** (`one`): `No Outer` (`mindscapeProgress === 0`, replaces `MS ✗`) · **new** `No Inner` (`mindscapeProgress === 1`)
  - **Revelations** (`any`): `Open slots` (replaces `◈ Rev <5`) · **new** `No build` (no revelation Target Build set)
  - **Skills** (`one`): **new** `Under Lv 8` (`skillProgress === 0`) · `🌹 Rose-gated` (replaces `🌹 Gated`)
- **Collapsible filter block.** When the matrix has two or more rows, the layout renders a disclosure header (`Filters` with the active count) and the matrix under it. Collapsed, the header row also shows every active chip as a removable summary pill labelled with its facet (`Mindscape · No Outer ×`), so the roster's projection stays visible and editable without opening the block. Open by default at or above the toolbar width, closed below; page-local like chip state. Single-row games (R1999, ZZZ) render no disclosure.
- **Shared preference-presence helper.** The `hasPreferences` closure inside `calculateRevelationScore` becomes the named export `hasRevelationPreferences`, used by both the scorer and the `No build` chip so the two can never disagree.
- Reverses the "no exclusive chips / chip groups" non-goal recorded in `2026-09-17-add-p5x-progress-filter-chips`.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `roster-predicate-filter`: chips may be nested under a labelled facet with `any` / `one` mode (radio semantics within a `one` facet, AND everywhere else); the layout renders a matrix of facet rows with an aligned label column, a `one` facet as a joined segment, labels only for facets of two or more chips, and `role="group"` per facet; a multi-row block is collapsible behind a disclosure header whose collapsed state shows active chips as removable summary pills; the held-card copy composes the facet label; every chip exposes `aria-pressed`.
- `p5x-thief-detail`: the roster filter requirements are replaced by the four-facet, eight-chip set above with the new vocabulary.
- `shared-roster`: the view hook's enumerated responsibilities extend to facet flattening, `one`-mode exclusive toggling, and the block's open/closed disclosure state.

## Impact

- `src/hooks/useRosterView.ts` (+ test): facet entries in `filterChips`, flattening, mode-aware `toggleChip`, `filters.rows` descriptor, facet-aware ghost tag, disclosure state (`open` / `toggleOpen`), active-chip summary.
- `src/components/RosterPageLayout.tsx` (+ stories): matrix rendering from `filters.rows`; disclosure header and collapsed summary pills; `aria-pressed` on chips.
- `src/styles/controls.css`: `.filter-row` matrix grid, `.filter-facet` / `.filter-facet-label` / `.filter-facet-chips` (+ joined `one` variant), `.filter-toggle` header and `.filter-summary` pills; `ControlPatterns.stories.tsx` facet matrix and collapsed-summary variants.
- `src/utils/revelationScoring.ts` (+ test): export `hasRevelationPreferences`.
- `src/pages/persona-5-phantom-x/P5xPage.tsx` (+ test): four-facet declaration; tests asserting the old labels and order are updated.
- `CONTEXT.md` Roster View entry: Filter Chip gains the Chip Facet term.
- No DB, service, catalog, or other-game changes: R1999 and ZZZ declare bare chips and render exactly as today. ZZZ's `skillProgress` has the same shape and can adopt a `Skills` facet in a follow-up.
