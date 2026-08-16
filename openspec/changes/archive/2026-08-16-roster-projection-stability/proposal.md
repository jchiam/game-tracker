## Why

Editing a card in a filtered or sorted roster view mutates the very field the projection keys on, so the card evicts or reorders mid-gesture — e.g. in R1999, maxing a resonance slider while the 💠 Resonating chip is active makes the card vanish under the user's hand. The roster grid is a live projection of mutable data with no commit boundary, which throws users off in all six games.

## What Changes

- **New shared design pattern — projection stability**: eviction/reorder caused by _editing the entity_ is deferred until an explicit release point; eviction/reorder caused by _changing the projection_ (filter chip, search term, sort toggle) stays immediate.
- **Mechanism**: filter-basis snapshot. Each card's _membership and order_ in the grid are evaluated against a per-entity basis snapshot; the _rendered content_ always comes from live state (sliders keep working while held).
- **Release points** that refresh an entity's basis: edit-toggle commit (✓ collapse), equipment-editor modal close, favorite toggle (a completed intent, not a mid-gesture edit), and any projection change (chip/search/sort), view switch, or reload — which refresh all bases.
- **Held affordance**: a card that no longer matches the active filter dims and wears a ghost tag ("no longer matches <filter>"); on release it exits with a fade/collapse animation honouring the existing `prefers-reduced-motion` kill switch.
- **Reorder-under-edit in scope**: order stability under active edit applies to all six games (LEVEL/SCORE sorts re-sorting while a slider is dragged), not just the two games with predicate filters.
- **CONTEXT.md** gains a glossary entry for the pattern (Projection Stability / Held card / Basis snapshot / Release point).

## Capabilities

### New Capabilities

- `roster-projection-stability`: the deferred-eviction/deferred-reorder design pattern — basis snapshots, the edit-vs-projection principle, release points, held-card affordance, and exit animation.

### Modified Capabilities

- `roster-predicate-filter`: predicate evaluation moves from "always against live state" to "against the entity's basis snapshot"; chip toggles still take effect immediately (they refresh all bases).
- `shared-roster`: the memoized filtered roster produced by `useRosterView` gains basis-aware membership/ordering — recomputation semantics change so entity edits no longer immediately re-project; the favorited-first sort's reaction to a favorite toggle stays immediate.

## Impact

- **Code**: `src/hooks/useRosterView.ts` (basis-aware projection — needs the live tracked array for id→entity lookup, so its config grows), `src/hooks/useRoster.ts` (no behaviour change expected; `filterRoster` stays the raw projection primitive), `src/components/GameCardShell.tsx` (optional commit signal on ✓ collapse), all six `*Page.tsx` files (pass tracked array + wire commit signal + held-tag copy), `src/styles/card.css` + `src/styles/animations.css` (held/dim/ghost-tag/exit styles), equipment-editor call sites (modal close = release).
- **Docs**: `CONTEXT.md` glossary entry.
- **No DB, service, or persistence changes** — this is purely view-layer projection semantics.
- **Known limitation accepted**: an entity edited into _newly qualifying_ for an active filter appears only at the next release point that refreshes its basis — in practice invisible cards can't be edited, so this is theoretical, but it is stated behaviour, not a bug.
