# Design

## Context

`useRosterView` already implements chips, facets, exclusivity, held cards, no-match copy, and the collapsible block (`roster-predicate-filter`). A game declares a `RosterFilterEntry[]` and passes it as `filterChips`. `CznPage` passes `filterAccent` but no chips, so CZN renders no filter block. The R1999 (`Reverse1999Page.tsx`) and P5X (`P5xPage.tsx`) declarations are the templates.

## Goals / Non-Goals

**Goals:** one module-level `FILTER_FACETS` declaration on `CznPage`, covering every grindable CZN bottleneck. The `No build` chip and the ★ score badge share one definition.

**Non-Goals:**

- No fragment set-mismatch chip (deferred).
- No taxonomy facets.
- No changes to the shared hook, layout, CSS, or tokens.
- No DB or type changes.

## Decisions

- **Level is `one`, split at 60.** The base cap is 60 and Unconscious Awakening adds 2, so `Under Lv 60` (`level < 60`) and `Awakening` (`60 <= level < 62`) are disjoint grind stages. Making the facet `one` gives the joined segment and swap-on-activate behaviour for free. The per-combatant cap is not tracked, so a combatant whose real cap is 60 shows under `Awakening` until it reaches 62. This is accepted.
- **Potential is a bare chip**, not a single-chip facet. The layout hides a facet label below two chips, so both forms render the same. Bare is the simpler declaration, matching ZZZ's `Gated` chip.
- **Partner is an `any` facet with `None equipped` exclusive.** This mirrors R1999's Psychube: level and match questions presume a Partner is equipped. Both threshold predicates also guard `partnerId !== null`, so they stay correct if exclusivity ever changes.
- **`Off-build` = not in the preference list at all.** This matches `cznBuildScore`'s `partnerTerm`, where only an unlisted Partner scores 0. A combatant with an empty list is "don't care" and never matches. Rank 2+ is still on-build.
- **`hasFragmentPreferences` is extracted.** The predicate currently lives inline in `calculateFragmentScore`'s `hasPreferences`. Export it from `src/utils/fragmentScoring.ts`, taking `CznFragmentBuildPreferences`, and have the scorer call it. This follows P5X's `hasRevelationPreferences` in `revelationScoring.ts`.
- **`Open slots` counts `fragments[s] != null` over `CZN_FRAGMENT_SLOTS`**, the same test the scorer's `hasEquipment` uses. A piece with a null set still counts as equipped. Equipped-ness is defined by the slot row, not the set.
- **Labels and copy**: noun phrases, no dimension prefix, no `<` glyph (the R1999/P5X rule). The no-match copy is the text in the spec delta. The active-tooltip defaults come from the plural noun `combatants`.

## Risks / Trade-offs

- **The `Awakening` chip includes combatants whose real cap is 60.** The cap isn't tracked, so this is a false positive. Mitigation: the tooltip says "Lv 60–61", so the meaning is explicit.
- **Eight chips on a phone.** The block is already collapsible and starts collapsed below 600px, so this needs no mitigation.
