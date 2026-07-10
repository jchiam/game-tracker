## Context

R1999 already adopts the `roster-predicate-filter` pattern via the resonance gate. All the
plumbing this change needs already exists in shipped code:

- `getFilteredRoster(searchTerm, sortBy, predicate?)` in `useArcanists.ts` already accepts an
  optional predicate (added by the resonance gate).
- `.filter-row` / `.filter-chip` already live in shared `controls.css`, keyed on the per-game
  `--filter-chip-accent` custom property (promoted by the `share-filter-chip-styles` change).
- `--color-r1999-accent` (`#deb887`) already exists as a token; the `.filter-row` element already
  sets `--filter-chip-accent: var(--color-r1999-accent)`.
- `psychubeName: string | null`, `psychubeLevel`, and `psychubeAmplification: number` (1–5, A1–A5)
  already exist on `R1999TrackedArcanist`. No schema work.

The only genuinely new element is that this is the **first page with two gate chips**, so the page
must compose multiple active gate predicates rather than pass a single one.

## Goals / Non-Goals

**Goals:**

- Let users narrow the R1999 roster to arcanists whose equipped psychube is below max amplification
  (`psychubeName !== null && psychubeAmplification < 5`).
- Make the gluttony gate compose with search, sort, and the existing resonance gate as an
  intersection.
- Keep the change page-local: no persistence, no DB, no migration.

**Non-Goals:**

- No change to the shared `roster-predicate-filter` capability or the `getFilteredRoster` signature.
- No new amplification states — A0 does **not** exist; amplification stays A1–A5, cap A5.
- No gluttony-material inventory tracking; the gate reads the arcanist's amplification only.
- No persistence of which gates are active (page-local, resets on navigation — same as resonance).

## Decisions

**Decision: Predicate is `psychubeName !== null && psychubeAmplification < 5`.**
`< 5` treats A5 as maxed; A1–A4 stay gated. The `psychubeName !== null` guard is the
precondition — Gluttony amplifies an _equipped_ psychube, so an arcanist with no psychube is a
different gap ("needs a psychube") and is excluded, exactly as the resonance gate excludes
`resonanceLevel === 0` (un-started) via `> 0`. Note: some legacy DB rows carry
`psychube_amplification = 0` (a reset-migration artifact; A0 is not a real UI state). `0 < 5` is
true, so such rows are correctly caught as "not maxed" when a psychube is equipped — no special
handling needed.

**Decision: Compose all active gate predicates into one intersection predicate at the page level.**
`getFilteredRoster` takes a single optional predicate. With two toggles, the page builds the list
of active predicates and passes `(a) => predicates.every((p) => p(a))` (or `undefined` when none
active). This keeps the hook seam unchanged and makes gates naturally compose as an intersection.
Chosen over widening `getFilteredRoster` to accept an array — the composition is a page concern,
the hook stays agnostic about how many gates a page has.

**Decision: Both chips share one accent (`--color-r1999-accent`), set once on `.filter-row`.**
The existing `.filter-row` already sets `--filter-chip-accent: var(--color-r1999-accent)`; the new
chip inherits it. No per-chip accent — two differently-coloured chips in one row would add visual
noise without meaning. Distinction between the chips comes from emoji + label, not colour.

**Decision: Chip label/emoji is gluttony-flavoured, distinct from the resonance chip.**
Resonance uses `💠 Resonating`. The gluttony chip uses a distinct glyph + gerund label
(e.g. `🍽️ Amplifying`) so the two chips read as different gates. Exact glyph is a cosmetic call
finalized in implementation.

**Decision: `noMatchMessage` stays per-gate for a single active gate; genericizes only when 2+ gates are active.**
Today it is a resonance-only ternary showing "No arcanists with resonance in progress." The live
`r1999-arcanist-detail` spec requires a _gate-specific_ empty message for the resonance gate, and
`Reverse1999Page.test.tsx` pins that exact text. To avoid silently weakening that requirement (and
red-ing its test), the message logic is:

- resonance only → "No arcanists with resonance in progress." (unchanged)
- gluttony only → a gluttony-specific message (e.g. "No arcanists with un-maxed psychube amplification.")
- both gates → generic "No arcanists match the active filters."
- neither → "No arcanists match your search." (default)

Chosen over collapsing to a single generic string (which would require a MODIFIED delta on the
resonance-chip requirement plus a test update) — the per-gate form keeps the resonance spec and test
intact and is the smaller blast radius.

**Note: the existing "Resonance-gate filter chip" requirement is now slightly stale.**
Its text says the resonance chip composes "with search and sort" — written before a second gate
existed. This change documents cross-gate composition under the new gluttony-chip requirement rather
than re-issuing a MODIFIED delta for the resonance requirement; the resonance requirement is
therefore incomplete (silent on gate-to-gate composition) but not wrong. Flagged here so a future
change can close it.

**Note: the `psychubeName !== null` exclusion is a default, not a confirmed user decision.**
The clarifying question timed out. Excluding no-psychube arcanists is consistent with the user's
framing ("psychubes who are not maxed") and mirrors the resonance gate's `> 0` precondition, so it
proceeds as the default — easy to revisit (drop the `!== null` guard) if the user wants no-psychube
arcanists surfaced too.

## Risks / Trade-offs

- **Two active gates could surprise users with an empty set** → The gate-aware `noMatchMessage`
  signals the filters (not a missing roster) are responsible; both chips remain visibly active so
  the user can toggle either off.
- **Legacy `psychube_amplification = 0` rows** → Handled by the predicate (`0 < 5` is true); called
  out above so it is not mistaken for an A0 feature. No migration needed.
- **Composition regressions on the resonance gate** → Page tests assert both gates together yield
  the intersection and that toggling one off restores the other's behaviour.
