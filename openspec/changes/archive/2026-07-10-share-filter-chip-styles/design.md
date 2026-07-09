## Context

`add-r1999-resonance-gate` (archived) delivered R1999's gate with a page-local `Reverse1999Page.css`
copy of `.filter-row` / `.filter-chip`, mirroring P5X's existing page-local copy in `P5xPage.css`.
Both are the canonical roster-filter classes (per `roster-predicate-filter`). Pages are lazy /
route-split, so the duplicate copies don't collide at runtime — but they violate the L2 "canonical
rules declared once" principle and grow linearly with each new game that adds a gate. This change
consolidates them, deferred from the R1999 work.

## Goals / Non-Goals

**Goals:**

- One definition of `.filter-row` / `.filter-chip`, in `controls.css` (L2).
- Per-game accent kept, supplied without a shared-file per-game selector.
- Zero visual/behavior change; existing P5X + R1999 tests stay green.

**Non-Goals:**

- No change to the `roster-predicate-filter` behavior (predicate signature, page-local filter
  state, chip toggle semantics all unchanged).
- No new tokens; reuse `--color-p5x-element-fire` and `--color-r1999-accent`.
- No new games or gates.

## Decisions

**Decision: Accent via `--filter-chip-accent` set inline on the `.filter-row` element.**
The shared `.filter-chip` base uses `var(--filter-chip-accent)` in its hover/active rules. The page
sets the property on the `.filter-row` div it renders (`style={{ '--filter-chip-accent': 'var(--color-r1999-accent)' }}`),
and it inherits to the chips inside. Chosen over per-game modifier classes (`.filter-row--p5x`)
because a modifier class would have to live _somewhere_ — either in the shared file (leaking
per-game specifics into L2) or in a page CSS file (the exact files this change deletes). An inline
custom property referencing a design token (not a hardcoded hue) keeps L2 game-agnostic, lets both
page CSS files be removed entirely, and is collision-free by construction (value lives on the
element instance, no global selector). Inline `style` here carries only a token reference, which the
token-first rule permits.

**Decision: Delete `P5xPage.css` and `Reverse1999Page.css` and their imports.** Each file's only
content is the filter rules being hoisted. Once removed the files are empty, so delete them and drop
the `import './…​.css'` line rather than leaving empty stylesheets.

**Decision: Base rules move byte-for-byte.** The hoisted `.filter-row` / `.filter-chip` rules are
copied verbatim from `P5xPage.css`, with only the two accent colours swapped for
`var(--filter-chip-accent)`. This guarantees the "visual parity" scenario for both games.

## Risks / Trade-offs

- **P5X visual regression** → Base rules are moved verbatim and P5X's accent (`element-fire`) is
  re-supplied via the custom property; verify the P5X gate chip hover/active look unchanged after
  the move.
- **TypeScript on the inline custom property** → `style={{ ['--filter-chip-accent' as string]: … }}`
  or a typed cast; a `CSSProperties` object doesn't allow arbitrary custom-property keys without it.
  Handle with a small local cast, consistent with any existing custom-property inline styles.
- **Test coupling to class location** → Page tests query the chip by role/text, not by CSS source,
  so hoisting shouldn't break them; re-run both suites to confirm.
