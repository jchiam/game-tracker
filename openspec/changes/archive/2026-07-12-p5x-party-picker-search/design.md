## Context

The P5X catalog is searched from two surfaces:

- **Roster tab** — `useThieves.getFilteredRoster` → `useRoster.filterRoster`, which runs `new Fuse(entities, { keys: config.fuseKeys, threshold: 0.3 })` with `fuseKeys = ['name', 'codename', 'personaName', 'role', 'element']`.
- **Create-party picker** — `PartyEditorModal.filteredEntities`, which runs `e.name.toLowerCase().includes(searchTerm.toLowerCase())`.

These diverge on two axes: **fields** (5 keys vs `name` only) and **engine** (Fuse fuzzy vs exact substring). A search for a codename like "Joker" succeeds in the roster and fails in the picker.

`PartyEditorModal` is an L3 shared component (`src/components/parties/`) used by every game's `PartiesTab` through `PartiesView`. Its config object is `PartyViewConfig`, which already mirrors the roster hook's config shape (nouns, image resolvers, slot definitions). The picker already layers two filters onto its result: an already-added exclusion and the active slot's optional `entityFilter`.

## Goals / Non-Goals

**Goals:**

- Make the P5X party picker match thieves by codename (and the other roster fields), consistent with the roster tab.
- Add the capability as a reusable, opt-in seam on `PartyViewConfig` rather than a P5X special case.
- Preserve the existing exclusion + per-slot `entityFilter` behaviour.

**Non-Goals:**

- Unifying the roster and picker into a single search module. They stay separate; only the field set and engine are aligned.
- Per-slot search key sets (thief slots vs persona slots searching different fields). A single config-level `searchKeys` applies to the picker; Fuse ignores keys absent on a given entity, so persona slots degrade gracefully.
- Changing roster search behaviour.

## Decisions

**Decision: Add `searchKeys?: string[]` to `PartyViewConfig`; picker searches via Fuse.**

`PartiesView` passes `config.searchKeys` down to `PartyEditorModal`. The modal replaces its substring filter with:

1. If a search term is present, `new Fuse(entities, { keys: searchKeys ?? ['name'], threshold: 0.3 })` and take the matched entities; otherwise use all entities.
2. Apply the existing exclusion (`!members.some(m => m.entityId === e.id)`) and slot `entityFilter` as post-filters over the Fuse result.

Fuse is instantiated inside the existing `useMemo`, keyed on `entities`, `searchTerm`, `members`, `activeSlotConfig` (unchanged deps plus the stable `searchKeys` from config). Rebuild cost is trivial at picker catalog sizes.

_Alternatives considered:_

- **Per-slot `searchKeys` on `SlotConfig`** — more precise but adds config surface for no current need; deferred (listed as a Non-Goal).
- **A `matchEntity: (e, term) => boolean` predicate seam** — maximally flexible but pushes the Fuse/threshold decision into every game and loses the roster-parity default. Rejected in favour of the declarative key list that mirrors `fuseKeys`.

**Decision: Default to `['name']` when `searchKeys` omitted; always route through Fuse.**

Keeping a single code path (always Fuse) avoids a substring-vs-fuzzy branch. Games that don't opt in get fuzzy name matching instead of exact substring. This is a minor behavioural shift, judged an improvement and consistent with each game's roster search (all use Fuse).

**Decision: P5X `searchKeys = ['name', 'codename', 'personaName', 'role', 'element']`.**

Full parity with `useThieves` `fuseKeys` (the user chose full roster parity over a name+codename minimum). Persona-slot entities lack `codename`/`role`/`element`; Fuse skips missing keys per entity.

## Risks / Trade-offs

- **Behavioural shift for HSR / R1999 / N2E / AE pickers** (substring → fuzzy name) → No config change on their part, and roster search already uses Fuse, so users see consistent behaviour. Threshold `0.3` is conservative. Documented as BREAKING (behavioural) in the proposal.
- **Fuzzy match may surface loosely-related entities in small pickers** → Threshold `0.3` matches the roster's own tuning; if a game finds it too loose it can constrain via slot `entityFilter` or a future per-slot key set.
- **Fuse rebuilt on each keystroke** → Same pattern the roster already uses; catalog sizes (tens of entities) make this negligible.
- **`searchKeys` referencing a field absent on all entities** → Fuse returns no matches for that key; harmless, no error.
