## Context

The `roster-predicate-filter` capability already defines the reusable boolean-predicate
filter pattern (hook exposes optional predicate → page holds toggle state → toolbar renders
`.filter-row` chip). P5X's rose gate is the reference implementation. R1999 wants the same
mechanism keyed on `resonanceLevel`.

Two structural differences from P5X:

- P5X's gate is derived from two boolean fields (`skillsLeveled`, `roseMaxed`) that had to be
  added to the type/service/DB. R1999's `resonanceLevel: number` (0–15) **already exists** —
  no schema work.
- R1999's current `getFilteredRoster(searchTerm, sortBy)` does **not** accept a predicate; P5X's
  does. So R1999's hook signature must be widened to match the `roster-predicate-filter` contract.

## Goals / Non-Goals

**Goals:**

- Let users narrow the R1999 roster to arcanists with resonance in progress (`> 0 && < 15`).
- Reuse the existing shared filter-row / filter-chip UI and the `roster-predicate-filter` pattern.
- Keep the change page-local: no persistence, no DB, no migration.

**Non-Goals:**

- No generalization of "gate" beyond resonance for R1999 (no euphoria/portrait gates now).
- No change to the shared `roster-predicate-filter` capability itself — R1999 only adopts it.
- No refactor of P5X's page-local filter CSS into a shared home (deferred follow-up).

## Decisions

**Decision: Widen `getFilteredRoster` to accept an optional predicate, mirroring P5X.**
R1999's hook currently forwards only search + sort to the shared `filterRoster`. Add an
optional `filterFn?: (a: R1999TrackedArcanist) => boolean` third parameter that passes straight
through to `filterRoster` (which already supports a predicate — P5X proves the underlying
`useRoster.filterRoster` seam handles it). Chosen over defining the predicate inside the hook
because gate state is page-local per the pattern; the hook stays stateless about filters.

**Decision: Bounds are `> 0` (exclusive) and `< 15` (exclusive).** Confirmed with the user.
`> 0` excludes only fresh-added arcanists (default `resonanceLevel: 0`), so "has progress" means
any level above the add default. `< 15` treats the absolute slider max as "maxed"; levels 10–14
remain gated (10 is only a _recommended_ stop, not a hard cap). Alternative bounds (`> 1`, `< 10`)
were considered and rejected per user answer.

**Decision: Wiring lives in `Reverse1999Page.tsx`, copying the P5X page structure; styling is a new page-local CSS file.**
Local `useState` boolean, `useCallback` wrapping `getFilteredRoster` with the predicate when
active, `filterRow` chip toggling state, gate-aware `noMatchMessage`.

Premise correction discovered during apply: `.filter-row` / `.filter-chip` are NOT shared — they
live page-local in `P5xPage.css` with `--color-p5x-element-fire` baked in. Pages are lazy /
route-split, so a page-local R1999 copy does not collide at runtime with P5X's. Chosen the
page-local copy (mirrors P5X's own approach exactly, zero P5X regression risk) over promoting the
base rules to `controls.css` with a per-game accent variable — the shared refactor touches shipped
P5X code + Storybook and was too invasive to do unsupervised. It is recorded as a follow-up. R1999
gets a dedicated `--color-r1999-accent` (`#deb887`, the brand gold) rather than borrowing an
afflatus token, keeping the accent semantically clean and token-first.

**Decision: Chip label/emoji is R1999-flavoured, not the P5X rose.** Use a distinct emoji (e.g.
💠 or 🎴) with a "Gated" / "In progress" label so the chip reads for resonance, not roses. Exact
glyph is a cosmetic call finalized in implementation.

## Risks / Trade-offs

- **`filterRoster` predicate seam might differ from what P5X relies on** → Verify during
  implementation that R1999's `filterRoster` (from `useRoster`) accepts the same optional
  predicate P5X's does; the shared `useRoster.filterRoster` is common to both, so risk is low.
- **Bound semantics could confuse users who stop at 10** → Accepted per user decision; 10–14
  stay in the gated set intentionally. Documented in the spec scenarios.
- **Empty-state message divergence** → Add a gate-specific `noMatchMessage` so an empty gated set
  doesn't read as "no arcanists match your search."
