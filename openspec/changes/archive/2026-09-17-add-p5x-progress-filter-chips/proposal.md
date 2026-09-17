## Why

P5X players want to spot thieves with unfinished progression at a glance — two more bottlenecks beyond the rose gate and the sub-5★ weapon: the Outer Mindscape half not yet unlocked, and revelation slots still empty. Today every filter chip is hand-wired in the page (two `useState`s, an AND-composed predicate, a `describeHeld` ladder, and a no-match ternary that grows as 2ⁿ − 1 branches); adding two chips to P5X would push that ternary to fifteen branches, so the chip pattern has to become data before the roster grows to four chips.

## What Changes

- Add two P5X roster filter chips:
  - **`MS ✗`** — thieves whose Outer Mindscape is not completed (`mindscapeProgress === 0`).
  - **`◈ Rev <5`** — thieves with at least one empty revelation slot (fewer than five equipped cards, using the same truthy-`setId` count as the card's `Rev n/5` chip).
- Lift the filter-chip pattern into the shared roster view hook: games declare chips as data (key, label, predicate, titles, optional single-chip no-match copy); the hook owns chip state, the AND-composed predicate, the held-card ghost-tag copy, the no-match message, and a `filters` descriptor that `RosterPageLayout` renders itself. Pages stop hand-writing chip state, predicate composition, `describeHeld`, no-match ternaries, and chip JSX.
- **BREAKING (internal)**: `RosterPageLayout`'s `filterRow: ReactNode` prop is replaced by a `filters` descriptor; `useRosterView`'s `filterRoster` config receives the composed predicate as an argument. R1999 and ZZZ pages migrate to the declarative form with no behaviour change.
- No-match copy rule: one active chip shows that chip's own message (when declared), two or more active chips show the generic `No {nounPlural} match the active filters.`
- `.filter-row` wraps onto a second line so four chips fit a narrow viewport.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `roster-predicate-filter`: chips are declared as data and rendered by the shared layout from a descriptor; the AND composition, ghost-tag copy, and no-match message derive from the declared chips; the filter row wraps.
- `shared-roster`: the shared view hook's responsibilities extend to filter-chip state, predicate composition, held-card description, the no-match message, and the `filters` descriptor; pages contain no hand-written chip code.
- `p5x-thief-detail`: two new roster filter chips (Outer Mindscape not completed; revelation slots incomplete), composing with the existing rose-gate and weapon chips.

## Impact

- `src/hooks/useRosterView.ts` (+ test): new `filterChips` / `filterAccent` / `nounPlural` config, chip state, composed predicate, held copy, no-match message, `filters` descriptor.
- `src/components/RosterPageLayout.tsx` (+ stories): `filterRow` → `filters`, renders `.filter-row` / `.filter-chip` itself.
- `src/pages/persona-5-phantom-x/P5xPage.tsx`, `src/pages/reverse1999/Reverse1999Page.tsx`, `src/pages/zenless-zone-zero/ZzzPage.tsx` (+ tests): chip arrays replace hand-wired state; P5X gains two chips.
- `src/styles/controls.css`: `.filter-row { flex-wrap: wrap }`; `ControlPatterns` story unchanged in markup.
- `CONTEXT.md` Roster View entry: chips join the hook's config.
- No DB, service, or catalog changes.
