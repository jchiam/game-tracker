# Design — AE weapon preferences

Three decisions carry non-obvious consequences. They are captured here so the spec
deltas stay behavioral.

## 1. Reference by `id`, equipped-by-`name` — the resolution bridge

Preferences store weapon **ids** (`AeWeapon.id`, stable kebab slug) for stability
against renames and the future data pipeline. But the _equipped_ weapon is stored as
`weaponName` (display name) per the existing `ae-operator-detail` spec. The match badge
spans both identifier spaces, so it MUST resolve in one direction:

```
equipped weaponName ──lookup in ALL_WEAPONS──▶ equipped id
                                                  │
                          index of equipped id in weaponPreferences[]  ──▶ rank
```

Edge cases the badge must tolerate (all degrade to "no match", never throw):

- `weaponName` not found in `ALL_WEAPONS` (stale name after a catalog rename) → treat
  as not-in-list (off-build).
- Two catalog entries share a display name → resolve to the first; this is a catalog
  data smell, not a badge bug. The weapon-catalog spec already requires class-scoped
  uniqueness in practice; duplicates across classes can't both be equippable on one
  operator anyway (picker is class-filtered).

The preference **editor** works purely in id-space: options come from
`ALL_WEAPONS.filter(w => w.type === operator.weapon)` mapped to
`{ value: w.id, label: "{name} ({rarity}★)" }` — the same label and `.game-select`
control as the equipped-weapon picker, so the two dropdowns read identically.

## 2. Rank → color

The user asked for rank-driven color ("full match for equipping first choice"). Map
rank to the shared `getProgressStyle(value, min, max)` rust→teal language so AE matches
the other games' investment color:

```
listLength = weaponPreferences.length
rank       = index of equipped id (0-based)

equipped is 1st choice (rank 0)      → getProgressStyle(listLength,           0, listLength)  → teal (full)
equipped is a lower listed choice    → getProgressStyle(listLength - rank,    0, listLength)  → steps toward rust
equipped present, not in list        → off-build state, rust (lowest), distinct label e.g. "Off-build"
no preferences set                   → badge not rendered
```

Deliberate call on the advisor's "rank ≠ quality" concern: we **accept** the gradient
because the user explicitly wants first-choice to read full and lower choices to read
lower. The one guard is that _equipped-but-not-listed_ is a separate, clearly-worse
state than "last listed choice" — a listed #3 still reads warmer than an unlisted
weapon. Badge label shows the rank (`#1`, `#2`, …) or `Off-build`, so color is
reinforced by text and never the sole signal.

## 3. Array column, not a child table

HSR/N2E persist stat chains as **rows** (`delete-all-then-reinsert`, the non-atomic
known limitation) because each entry is a 3-field `StatPreference` and HSR has up to
five chains per character. AE weapon preferences are a single flat ordered list of
scalar ids, which a Postgres array expresses exactly:

| Aspect          | Child table (HSR/N2E pattern) | Array column (chosen)           |
| --------------- | ----------------------------- | ------------------------------- |
| Order           | explicit `order_index`        | implicit in array position      |
| Save            | delete + reinsert, no txn     | single column update (atomic)   |
| Non-atomic debt | inherited                     | avoided                         |
| Save path       | new preference service        | reuse `AeOperatorPatch` updater |
| New table + RLS | yes                           | no                              |

So: `weapon_preferences TEXT[] NOT NULL DEFAULT '{}'` on `ae_tracked_operators`,
updated through the same debounced `queueUpdate` path as `weaponName` / `level`.
Dedupe (a weapon id may appear at most once) is enforced in the hook before persisting,
not by a DB constraint (arrays can't express element-uniqueness cheaply).

## 4. Generalising `PreferenceChain` without disturbing HSR/N2E

The component gains a **ranked-list mode** selected by prop; stat-chain mode stays the
default so the relic and cartridge editors are behaviorally unchanged.

| Concern        | Stat-chain mode (existing) | Ranked-list mode (new) |
| -------------- | -------------------------- | ---------------------- |
| Operators      | `>` / `>=` / `OR` between  | none                   |
| Remove         | tail only                  | per-item               |
| Reorder        | none (rebuild)             | up/down on every item  |
| Options        | `string[]` (value=label)   | `{ value, label }[]`   |
| Item value key | `StatPreference.stat`      | bare value string      |

Open implementation question for tasks, not blocking the proposal: whether to widen
the existing `PreferenceChain` with a `variant` prop or extract a shared inner
`OrderedSelectList` that both modes compose. The behavioral contract is the same either
way; the spec describes capability, the task picks the shape. Component keeps the
`PreferenceChain` name (rename across HSR/N2E deferred — not worth the blast radius).

Resolved in implementation: a discriminated-union `variant` prop (default
`'stat-chain'`), so HSR/N2E call sites pass nothing and are untouched.

## 5. Edit-body height: measure, don't budget

The card's edit body is `overflow: hidden` and height-capped via
`--game-card-edit-max-height` to animate expand/collapse. A fixed budget (the sibling
cards' approach) clips once the variable-length weapon-preference editor grows past it.
Rather than pick a larger magic number, the AE card measures the editor's actual
`scrollHeight` (`useLayoutEffect`, remeasured when the weapon count or equipped weapon
changes) and feeds that as the budget. The card lengthens to exactly fit — no clipping
at any weapon count, and the collapse transition stays tight because the cap tracks
real content height instead of an inflated ceiling.
