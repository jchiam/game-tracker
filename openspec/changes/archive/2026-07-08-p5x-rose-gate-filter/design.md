## Context

P5X tracks two coupled booleans (`skillsLeveled`, `roseMaxed`) per thief. The
derived "rose-gated" state (`skillsLeveled && !roseMaxed`) already surfaces as a
summary chip on ThiefCard. Users want to filter the roster down to only
rose-gated thieves to answer "what do I need to farm roses for?"

No game currently has predicate filtering. The existing filter path is Fuse.js
text search only, composed with a sort comparator via `filterRoster`.

## Goals / Non-Goals

**Goals:**
- P5X roster has a toggle chip that narrows to rose-gated thieves
- Pattern is documented so future games can adopt without re-inventing
- Composes cleanly with existing search + sort

**Non-Goals:**
- Multi-filter (multiple simultaneous predicates) — one chip is enough for now
- Shared hook abstraction — the predicate is a simple `.filter()` call, no new hook needed
- URL-persisted or DB-persisted filter state
- Filters for HSR/AE — they don't have item-gate bottlenecks requiring this

## Decisions

**Where the predicate lives:** In `getFilteredRoster`. The P5X hook's wrapper
already translates sort keys → comparators; it gains an optional `filter`
parameter that pre-filters `trackedEntities` before passing to the shared
`filterRoster`. No change to the shared `useRoster`/`filterRoster` — the
predicate runs in game-specific code.

**Filter state management:** A single `roseGateFilter: boolean` state in
`P5xPage.tsx`, passed to `getFilteredRoster`. Page-local, resets on unmount.

**Layout:** A new `.roster-toolbar` wrapper (flex column) contains both
`.roster-controls` (search/sort/add row) and a `.filter-row` as siblings. The
toolbar wrapper is centered, max-width 600px, with `spacing-sm` gap between
children — tight enough to read as one cluster, distinct enough to separate
pill-shaped filter chips from square action buttons. The `filterRow` ReactNode
slot on `RosterPageLayout` is rendered inside this wrapper, below the controls
row, only when tracked entities exist.

**Chip styling:** Pill-shaped (`.filter-chip`, `border-radius: full`). Active
state uses P5X fire-red (`--color-p5x-element-fire`) at badge-fill opacity via
`color-mix()`. Self-styled, not `.btn`.

**Empty state:** When filter is active but no matches, show a contextual message
inside the existing empty-state area: "No rose-gated thieves" rather than the
default "No phantom thieves tracked yet."

## Risks / Trade-offs

- **Precedent-setting:** First filter chip in the app. Future games may want
  their own. Keeping it in game-specific code (not a shared abstraction) means
  each game implements its own chip — acceptable for 1-2 games, may need
  extraction if 3+ games adopt it.
- **Toolbar crowding:** One chip alongside search + sort toggle is fine. If P5X
  later gets more filters, may need a filter row or popover.
- **Discoverability:** Users may not notice the chip. Acceptable — power-user
  feature, not critical path.
