## Context

See proposal.md — Why. Three roster pages hand-wire filter chips today (P5X: 2, R1999: 2, ZZZ: 1), each repeating the same four pieces: a `useState` per chip, an AND-composed predicate closed into the `filterRoster` adapter, a `describeHeld` ladder that names the first failing chip, and a no-match ternary. `useRosterView` (`src/hooks/useRosterView.ts`) already owns the rest of the view state and treats `filterRoster` identity as the "projection changed" signal (Projection Stability in `CONTEXT.md`); `RosterPageLayout` takes the finished row as a `filterRow: ReactNode` slot. The `roster-predicate-filter` spec describes the pattern game-agnostically but leaves the composition to each page.

Constraints that shape the approach:

- Per-game `getFilteredRoster` signatures differ — P5X `(search, sort, predicate?, entities?)`, ZZZ `(search, sort, scoreFn, predicate?, entities?)`, R1999 `(search, sort, predicate?, entities?)` — so the hook cannot call them directly; a one-line page adapter stays.
- Held-card detection costs an extra projection pass and is gated on "any chip active" today; that gate must survive the lift.
- Existing page tests assert chip-specific empty copy (`No rose-gated thieves found.`, `No thieves with a sub-5★ weapon.`) and ghost-tag copy (`no longer matches 🌹 Gated`). Both formats are kept so those assertions keep passing.
- The hook is already generic over `SortKey` and `TEntity`; chip predicates are typed over `TEntity`.

## Goals / Non-Goals

**Goals:**

- One place (the hook) owns chip state and everything derived from it; pages pass a chip list.
- Adding a chip to any game is one array entry plus one spec requirement.
- Zero behaviour change for R1999 and ZZZ beyond the new wrap rule.

**Non-Goals:**

- Persisting chip state (URL or DB) — remains page-local per `roster-predicate-filter`.
- OR-composition, chip groups, or exclusive chips.
- Adding chips to HSR / N2E / AE / DGM.
- Changing the held-card affordance or exit animation.

## Decisions

### D1 — Chip descriptor lives in `useRosterView` config, not in `RosterPageLayout`

```
RosterFilterChip<T> {
  key: string            // stable, used for state and React keys
  label: string          // '🌹 Gated' — chip text AND ghost-tag suffix
  predicate: (t: T) => boolean
  onTitle: string        // tooltip while inactive: 'Show only rose-gated thieves'
  offTitle?: string      // tooltip while active; default `Show all ${nounPlural}`
  noMatch?: string       // single-active empty copy; default generic
}

RosterViewConfig gains:
  filterChips?: RosterFilterChip<TEntity>[]
  filterAccent?: string      // CSS value for --filter-chip-accent
  nounPlural: string         // 'thieves' — tooltip + generic no-match copy
  filterRoster: (search, sort, predicate: ((t: TEntity) => boolean) | undefined, entities?) => TEntity[]
```

The hook returns `filters: { accent, chips: [{ key, label, active, title, toggle }] } | undefined` and `noMatchMessage: string`.

_Why the hook:_ chip state is projection state — toggling a chip is a refresh-all release point, and `describeHeld` needs the same predicates. Keeping it beside `filterRoster` avoids threading predicates through props. _Alternative:_ a separate `useFilterChips` hook composed by the page. Rejected — the page would still hand-wire `filterRoster` identity and `describeHeld`, which is exactly the boilerplate being removed.

### D2 — Predicate is injected into the page's `filterRoster` adapter

The hook builds `predicate` (AND over active chips, `undefined` when none) and passes it as the third argument. Pages keep a one-line adapter: `(s, sort, pred, ents) => getFilteredRoster(s, sort, pred, ents)` (ZZZ inserts its score function). The adapter closes over nothing chip-related, so its identity is stable across chip toggles; the hook adds `activeKeys` to its own projection key so a toggle still counts as a projection change.

_Alternative:_ hook calls a game-supplied `getFilteredRoster` with a fixed signature. Rejected — would force ZZZ's score-function parameter into the shared signature or a second adapter layer.

### D3 — `activeKeys` state is a `Set<string>` keyed by chip key

Toggle = add/delete from a new Set. The projection key compares the Set by identity — every toggle yields a fresh Set, so a toggle is a projection change and nothing else is. The chip list itself is read through a ref inside the projection memo, so an inline (per-render) chip array never counts as a projection change on its own; pages still declare chips at module scope, and a chip key absent from the declared list is simply ignored.

### D4 — `describeHeld` is derived, gated on any active chip

`describeHeld` = first active chip (declaration order) whose predicate fails → `no longer matches ${label}`. The hook passes it into the projection only when `activeKeys.size > 0`, preserving today's "no extra pass when no gate is on" rule. The per-game `describeHeld` config seam is removed — no game declares held copy any other way.

### D5 — No-match copy: chip-owned for one, generic for many

| active chips | message                                                          |
| ------------ | ---------------------------------------------------------------- |
| 0            | game's `noMatchMessage` config (`No thieves match your search.`) |
| 1            | `chip.noMatch ?? generic`                                        |
| ≥ 2          | `No ${nounPlural} match the active filters.`                     |

_Why:_ keeps every existing single-chip string (test assertions untouched), matches the wording R1999 already uses for both-active, and stops the 2ⁿ growth. _Alternative:_ join active labels (`No thieves match 🌹 Gated · MS ✗`). Rejected — emoji in prose, and users see the active chips right above the message.

### D6 — `RosterPageLayout` renders the row from the descriptor

`filterRow: ReactNode` → `filters?: { accent: string; chips: RenderableChip[] }`. The layout renders `<div class="filter-row" style="--filter-chip-accent: …">` with one `<button class="filter-chip">` per chip, still behind `hasTracked`. The `.filter-row` / `.filter-chip` classes and the accent custom property are unchanged, so `controls.css` and `ControlPatterns.stories.tsx` markup stay valid; `RosterPageLayout.stories.tsx` gets a `filters` control.

### D7 — `.filter-row` wraps

`flex-wrap: wrap` added to `.filter-row` in `controls.css`. Chips keep `flex-shrink: 0` so they never squash; a fourth chip drops to a second line on narrow toolbars. Shared style, all chip games affected identically.

### D8 — P5X chip definitions

| key           | label      | predicate                                                          | onTitle                                      | noMatch                                |
| ------------- | ---------- | ------------------------------------------------------------------ | -------------------------------------------- | -------------------------------------- |
| `rose`        | `🌹 Gated` | `skillProgress === 1`                                              | Show only rose-gated thieves                 | No rose-gated thieves found.           |
| `weapon`      | `⚔ <5★`    | `weaponRarity < 5`                                                 | Show only thieves with a sub-5★ weapon       | No thieves with a sub-5★ weapon.       |
| `mindscape`   | `MS ✗`     | `mindscapeProgress === 0`                                          | Show only thieves without Outer Mindscape    | No thieves without Outer Mindscape.    |
| `revelations` | `◈ Rev <5` | `REVELATION_SLOTS.filter(s => t.revelations[s]?.setId).length < 5` | Show only thieves with open revelation slots | No thieves with open revelation slots. |

The revelation count reuses the card's truthy-`setId` test (extract a small `countEquippedRevelations` helper next to `getRevelationSummary` in `revelations.ts` so card and chip share it). Order mirrors the card summary chips: Weapon → Mindscape → Revelations.

## Risks / Trade-offs

- [Hook grows another concern] → Chip logic is ~40 lines and purely derived from config; the hook already owns the projection key it must feed. Tested in `useRosterView.test.ts`, page tests shrink to wiring.
- [Migrating three pages in one change] → All three have chip tests today; run them unchanged first (they assert labels, predicates, copy), then delete only the tests that covered now-shared mechanics.
- [`filterRoster` adapter identity] → With predicates no longer closed into the adapter, pages must keep it in `useCallback([getFilteredRoster])`; a fresh identity per render would refresh all bases every render and break held cards. Covered by the existing "entity edit does not re-project" hook test.
- [Wrapped filter row changes toolbar height] → Only when chips overflow; `.roster-toolbar` is a flex column so the grid shifts down cleanly.
- [Ghost tag "MS ✗" reads terse] → Same register as the chip; label is the single source so tag and chip can never drift.
