## Context

The canonical controls already exist and are documented; the games simply predate them
(or were never migrated when they were extracted). Three control families duplicate
canonical rules. HSR is already clean (it uses `.level-slider` and has no toggle-button
rows), and R1999's _main level_ slider already uses `.level-slider` — so the residue is
R1999's secondary sliders / buttons / select and N2E's whole control set.

The shared primitives live in `src/styles/controls.css`: `.toggle-btn`, `.level-slider`
(+ `::-webkit-slider-thumb` consuming `--slider-fill-color` / `--slider-fill-glow`), and
`.game-select`. They are globally imported via `src/index.css`, so no route-split-CSS
cold-load hazard exists once a card references them.

## Goals / Non-Goals

**Goals:**

- One definition per control family; games reference canonical classes and keep only
  game-unique modifiers.
- Express the compact toggle-button size as a canonical `.toggle-btn.compact` modifier
  rather than a duplicated rule.
- Pixel-identical result (this is a dedupe, not a restyle).

**Non-Goals:**

- No visual redesign of any control.
- No change to HSR (already canonical) or to badges, relic grid, cartridge slot visuals.
- No new design tokens, no DB/hook/service/type changes.

## Decisions

**Add `.toggle-btn.compact` rather than keeping `.arc-tier-btn` / `.amplify-btn`.**
The two compact buttons differ from `.toggle-btn` only in `padding` (`5px 4px` vs
`var(--spacing-3)`) and `font-size` (`0.78rem` vs `--typography-font-size-sm`). A
`.toggle-btn.compact` modifier captures exactly that delta and inherits the rest
(border, background, hover, active, `::before` reset). Markup becomes
`class="toggle-btn compact"`. Rationale: the standard/compact split is a real
design-system distinction; encoding it as a modifier keeps it in one place.

**Keep game-unique state classes additive, not replaced.** R1999's `.portrait-reset`
(the dimmed P0 button) is a genuine game-specific modifier with no canonical equivalent;
it stays as `class="toggle-btn portrait-reset"` and its rule remains in `ArcanistCard.css`
(scoped to `.portrait-reset`, not re-declaring `.toggle-btn`). Same approach for any
other game-only affordance discovered during apply.

**Migrate sliders to `.level-slider` verbatim; drive fill via existing custom props.**
The bespoke slider rules are identical to `.level-slider` except for the class name, and
all already read `--slider-fill-color` / `--slider-fill-glow`. The inline `style` that
sets those custom properties stays on the element; only the `className` changes. R1999's
resonance/psychube sliders and N2E's `.character-slider` usages all migrate.

**Sequence after `ae-card-collapse-polish`.** That open change owns AE's
`.character-slider` → `.level-slider` migration and states N2E's `.character-slider`
stays put. To avoid two open changes editing the `.character-slider` definition, this
change lands second and is the one that deletes the `.character-slider` rule (after AE no
longer references it and this change repoints N2E off it).

## Risks / Trade-offs

- **Specificity / cascade differences after rename** → The canonical rules and the
  bespoke ones have the same single-class specificity, so swapping names should not shift
  the cascade. Verify hover/active still win in `npm run dev`.
- **Test coupling to bespoke class names** → `CharacterCard.test.tsx` queries
  `.awakening-btn`; update it to `.toggle-btn` (or the retained semantic class). Grep for
  other `.portrait-btn` / `.euphoria-btn` / `.amplify-btn` / `.resonance-slider` /
  `.psychube-*` / `.character-slider` / `.character-select` references in tests before
  deleting CSS.
- **Compact-modifier visual drift** → Confirm `.toggle-btn.compact` renders identically
  to the old `.arc-tier-btn` / `.amplify-btn` (same padding/font), since these sit in a
  tight row and small size changes are noticeable.

## Open Questions

- Whether to also retire R1999's `.portrait-row` / `.euphoria-row` / `.amplification-row`
  flex wrappers in favor of a shared `.toggle-btn-row` — deferred; they are trivial flex
  containers and out of this change's "control primitive" scope unless convergence is
  cheap during apply.
