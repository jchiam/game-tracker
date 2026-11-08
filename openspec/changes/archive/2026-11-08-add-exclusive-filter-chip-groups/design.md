## Context

See proposal.md — Why. Filter chips are declared as data (`RosterFilterChip`) and owned by `useRosterView` (`src/hooks/useRosterView.ts`): active keys live in a `ReadonlySet<string>`, every toggle yields a fresh Set (the projection-change signal), active chips compose as a logical AND, the held-card ghost tag names the first failing active chip in declaration order, and the no-match copy is chip-owned for one active chip and generic for two or more. `RosterPageLayout` renders the row from the hook's `filters` descriptor as a flat list of `<button class="filter-chip">` inside a `.filter-row` that wraps. The toolbar is capped at `max-width: 600px`.

P5X's Mindscape and Skills fields are twins (design of `2026-08-10-p5x-mindscape-outer-inner`): ordered 0/1/2 milestones where `1` gates `2`. The useful roster questions are "who hasn't started" (`0`) and "who is stuck at the first milestone" (`1`) — disjoint sets. A plain second chip would be AND-composed with the first, so both active = empty roster. Exclusivity must be behavioural.

A first cut of this change (uncommitted, on `feat/exclusive-filter-chip-groups`) added a `group` key and rendered groups as joined pills in the flat row. Review showed the flat row does not scale to eight chips: the dimension was carried only by prefix glyphs (`◈`, `MS`, `🌹`), joining signalled exclusivity but read as category, and four threshold spellings (`<5★`, `Lv <80`, `<5`, `<Lv8`) coexisted. The missing unit is the dimension itself.

Constraints that shape the approach:

- Projection-stability invariants (Projection Stability in `CONTEXT.md`) must survive: a toggle is exactly one fresh `Set`, `filterRoster` identity stays stable, held detection stays gated on "any chip active".
- R1999 and ZZZ declare one or two bare chips and must render exactly as today.
- `calculateRevelationScore` decides "insufficient data" via an inline `hasPreferences` closure; the `No build` chip must share that definition.
- CSS is token-only; `.filter-chip` already enumerates its transitions.

## Goals / Non-Goals

**Goals:**

- One declarative unit for a filter dimension that carries its label and, when the states are disjoint, its exclusivity.
- A row the eye can parse without tooltips: dimension label once, short chips that complete it.
- P5X exposes every grindable progression bottleneck, in the card's own order, with one vocabulary.
- Zero visual or behavioural change for games that declare bare chips.

**Non-Goals:**

- OR composition across arbitrary chips, multi-select within a `one` facet, or persisted chip state.
- Per-facet dropdowns / selects — the chip pattern keeps active state visible.
- Collapsing the filter block; it is always open while tracked entities exist.
- Adopting facets in ZZZ, HSR, N2E, AE, DGM.
- Changes to the held-card affordance, exit animation, or `GameCardShell`.
- Chips for gacha-bound dimensions (awareness, forge), level (`Lv` sort), or revelation score (`★` sort).

## Decisions

### D1 — Facets nest chips; the list is `(chip | facet)[]`

```
RosterFilterFacet<T> {
  key: string
  label: string                   // 'Mindscape' — rendered when chips.length >= 2
  mode: 'any' | 'one'             // independent toggles | radio-exclusive
  chips: RosterFilterChip<T>[]
}
RosterFilterChip<T>  — unchanged fields (key, label, predicate, onTitle, offTitle?, noMatch?); no `group`
RosterViewConfig.filterChips?: (RosterFilterChip<T> | RosterFilterFacet<T>)[]
```

The hook flattens the list once per render (`allChips`, declaration order) and keeps a `facetOf(chipKey)` map. State (`activeKeys`), predicate composition, no-match selection, and held detection operate on the flat list exactly as today. Chip keys must be unique across the whole list.

_Why nesting instead of a `group`/`facet` key on the chip:_ a label and a mode are facts about the dimension, not about each chip; repeating them per chip invites drift, and adjacency becomes structural so the dev-time guard from the first cut is deleted. _Why a union list instead of "every chip must be in a facet":_ R1999 and ZZZ stay one-line declarations.

### D2 — `one` mode resolves in `toggleChip`

```
next = new Set(prev)
if next.has(key):            next.delete(key)
else:
  f = facetOf(key)
  if f?.mode === 'one':      for c in f.chips: next.delete(c.key)
  next.add(key)
```

One fresh `Set` per click, so `activeKeys` identity remains the sole projection-change signal. Because a `one` facet never has two active members, "AND across all active chips" is already correct across facets.

### D3 — Chips drop their prefix; copy composes the facet label where it matters

Chip labels are short completions of the facet label (`No Inner`, `Open slots`). Three places need the dimension back:

| surface            | composition                                                                                                        |
| ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| chip button text   | chip label only — the facet label sits in the same row                                                             |
| accessible context | facet row is `role="group" aria-label={facet.label}`; screen readers announce it on entry                          |
| held ghost tag     | `no longer matches {facet.label} · {chip.label}` when the facet is labelled, else `no longer matches {chip.label}` |

Tooltips (`onTitle`) and single-chip no-match copy stay per chip and already read as full sentences. The descriptor exposes `heldLabel` per chip so the layout never composes copy.

### D4 — Matrix layout: one row per facet, aligned label column

```
WEAPON        (Sub-5★) (Under Lv 80)
MINDSCAPE     [No Outer | No Inner]
REVELATIONS   (Open slots) (No build)
SKILLS        [Under Lv 8 | 🌹 Rose-gated]
```

`filters.rows: { key, label?: string, mode: 'any' | 'one', chips: RenderableChip[] }[]`. The hook emits one row per facet and coalesces each run of consecutive bare chips into one unlabelled `any` row, so a game with only bare chips gets exactly one row — today's output. A facet with a single chip is emitted as a row without a label (rule: label only at two or more chips).

Markup per row:

```html
<div class="filter-facet" role="group" aria-label="Mindscape">
  <span class="filter-facet-label" aria-hidden="true">Mindscape</span>
  <div class="filter-facet-chips mode-one">
    <button class="filter-chip active" aria-pressed="true">No Outer</button>
    <button class="filter-chip" aria-pressed="false">No Inner</button>
  </div>
</div>
```

Unlabelled rows omit `role`/`aria-label` and the label span; their chips cell spans both columns.

_Why B (matrix) over inline clusters:_ at 600px the inline form wraps into a two-line jumble on desktop and a four-line one on phones anyway; the matrix pays its height once, stays legible at every width, and the aligned label column is what makes the dimensions scannable. _Why not `display: contents` for the row:_ it has a history of stripping `role="group"` semantics; subgrid keeps the row element real.

### D5 — CSS: subgrid matrix, joined pill only for `one`

`controls.css`:

```
.filter-row              { display: grid; grid-template-columns: max-content 1fr;
                           column-gap: var(--spacing-sm); row-gap: var(--spacing-xs); width: 100%; }
.filter-facet            { display: grid; grid-column: 1 / -1; grid-template-columns: subgrid;
                           align-items: center; }
.filter-facet-label      { font-family: display; font-size: var(--typography-font-size-xs);
                           text-transform: uppercase; letter-spacing: 0.1em;
                           color: var(--color-text-secondary); text-align: end; }   /* .card-section-group-header idiom; end-aligned, flush against the chips */
.filter-facet-chips      { display: flex; flex-wrap: wrap; gap: var(--spacing-xs); grid-column: 2; }
.filter-facet.is-unlabelled .filter-facet-chips { grid-column: 1 / -1; }
.filter-facet-chips.mode-one                     { flex-wrap: nowrap; gap: 0; }
.filter-facet-chips.mode-one .filter-chip        { border-radius: 0; }
.filter-facet-chips.mode-one .filter-chip:first-child { border-start-start-radius / border-end-start-radius: var(--border-radius-full); }
.filter-facet-chips.mode-one .filter-chip:last-child  { border-start-end-radius / border-end-end-radius: var(--border-radius-full); }
.filter-facet-chips.mode-one .filter-chip + .filter-chip { margin-inline-start: -1px; }
.filter-facet-chips.mode-one .filter-chip:hover,
.filter-facet-chips.mode-one .filter-chip.active { position: relative; z-index: 1; }
```

The joined-pill rules from the first cut carry over under the new selector; `.filter-chip-group` is removed. Subgrid support (Chrome 117+, Firefox 71+, Safari 16+) matches the app's existing baseline (`color-mix`). No new tokens; the accent still flows from `--filter-chip-accent` on `.filter-row`.

### D6 — `hasRevelationPreferences` becomes a shared named export

Unchanged from the first cut: extract the `hasPreferences` closure from the `createEquipmentScore` config in `src/utils/revelationScoring.ts` into `export function hasRevelationPreferences(prefs)`; the scorer references it; the `No build` chip predicate is `!hasRevelationPreferences(t.revelationPreferences)`. Independent of equipped cards — a Target Build is set before farming.

### D7 — P5X facets and vocabulary

| facet       | mode | key               | label           | predicate                                          | onTitle                                                      | noMatch                                       |
| ----------- | ---- | ----------------- | --------------- | -------------------------------------------------- | ------------------------------------------------------------ | --------------------------------------------- |
| Weapon      | any  | `weapon`          | `Sub-5★`        | `weaponRarity < 5`                                 | Show only thieves with a sub-5★ weapon                       | No thieves with a sub-5★ weapon.              |
| Weapon      | any  | `weaponLevel`     | `Under Lv 80`   | `weaponLevel < 80`                                 | Show only thieves with a weapon below Lv 80                  | No thieves with a weapon below Lv 80.         |
| Mindscape   | one  | `mindscapeOuter`  | `No Outer`      | `mindscapeProgress === 0`                          | Show only thieves without Outer Mindscape                    | No thieves without Outer Mindscape.           |
| Mindscape   | one  | `mindscapeInner`  | `No Inner`      | `mindscapeProgress === 1`                          | Show only thieves with Outer Mindscape done but Inner not    | No thieves with Outer done and Inner pending. |
| Revelations | any  | `revelations`     | `Open slots`    | `countEquippedRevelations(revelations) < 5`        | Show only thieves with open revelation slots                 | No thieves with open revelation slots.        |
| Revelations | any  | `revelationPrefs` | `No build`      | `!hasRevelationPreferences(revelationPreferences)` | Show only thieves with no revelation Target Build set        | No thieves without a revelation Target Build. |
| Skills      | one  | `skillsBase`      | `Under Lv 8`    | `skillProgress === 0`                              | Show only thieves whose skills are below the Lv8 incense cap | No thieves with skills below Lv8.             |
| Skills      | one  | `rose`            | `🌹 Rose-gated` | `skillProgress === 1`                              | Show only rose-gated thieves                                 | No rose-gated thieves found.                  |

Every label is a noun phrase naming the gap; no `<`, `✗`, or abbreviation. `🌹` stays on Rose-gated because the card's own summary chip uses it. Facet order is the card summary's Weapon → Mindscape → Revelations → Skills. Chip keys are page-local and never persisted, so renaming `mindscape` → `mindscapeOuter` has no data impact. Existing page tests that assert `🌹 Gated` / `⚔ <5★` / `MS ✗` / `◈ Rev <5` are updated to the new labels.

### D8 — Collapsible block with a removable active summary

The matrix is ~140px tall (four rows at a 36px pitch) and the toolbar is not sticky, so on a phone the first card lands around mid-viewport. Mitigation chosen over a horizontal strip, a mobile bottom sheet, and a denser matrix: a disclosure.

```
collapsed   [Filters ▾ · 2]  (Mindscape · No Outer ×) (Weapon · Sub-5★ ×)
expanded    [Filters ▴ · 2]
                 WEAPON  (Sub-5★)(Under Lv 80)
              MINDSCAPE  [No Outer|No Inner]
            REVELATIONS  (Open slots)(No build)
                 SKILLS  [Under Lv 8|Rose-gated]
```

- **Applies only to multi-row blocks.** With one row (R1999's two bare chips, ZZZ's one) there is nothing to collapse: no header, row always visible, today's rendering byte-for-byte.
- **Header** is a self-styled `.filter-chip.filter-toggle` button: `Filters`, a chevron, and the active count when non-zero; `aria-expanded` + `aria-controls` pointing at the matrix container. Toggling it is view state, not projection state — bases are untouched.
- **Summary pills** render only while collapsed: one `.filter-chip.filter-summary` per active chip, in declaration order, labelled with the same facet-composed text the ghost tag uses (`Mindscape · No Outer`; bare chips just their label) because the facet labels are hidden in this state. Each pill ends in `×` and its click calls the chip's `toggle` (active → cleared), with `aria-label` `Remove filter {label}`. Expanded, the matrix already shows the active chips, so the summary is not duplicated.
- **Default open state** is decided once at mount: open when `matchMedia('(min-width: 600px)')` matches (the toolbar's cap), closed below; environments without `matchMedia` (jsdom) default to open. Page-local like chip state; not persisted, not re-evaluated on resize.
- **Descriptor**: `filters` gains `collapsible: boolean` (rows ≥ 2), `open`, `toggleOpen`, `activeCount`, and `active: { key, label, remove }[]`; each descriptor chip also carries `fullLabel` (facet-composed) so the layout composes no copy.

_Why not a horizontal strip as the collapsed state:_ it needs a second rendering of the rows and pushes facet labels off the right edge, undoing the readability this change is for. _Why not a bottom sheet on mobile:_ same outcome as the disclosure with a heavier container and two render paths. _Why removable pills:_ the user's decision; a display-only summary would force a tap to open before every change.

### D9 — Spec placement

`roster-predicate-filter` owns the generic facet semantics (one ADDED requirement) and the MODIFIED declared-as-data, AND-composition, filter-row, and held-copy requirements. `p5x-thief-detail` replaces its four chip requirements with one consolidated facet requirement (REMOVED × 4 with migration notes, ADDED × 1). `shared-roster` gets its view-hook requirement MODIFIED to name facet flattening, `one`-mode exclusivity, and the disclosure state among the derived chip behaviours. The collapsible block is one further ADDED requirement in `roster-predicate-filter`.

## Risks / Trade-offs

- [Four rows cost ~140px of toolbar height on every P5X visit] → the block collapses to a 32px header below the toolbar width (D8); desktop keeps it open by default. Rows are only rendered while tracked entities exist.
- [Summary pill labels repeat the facet name and can crowd the header on a phone] → the header row wraps; three active pills is the realistic maximum (two `one` facets contribute at most one each).
- [Default open state is evaluated once; rotating the phone keeps the mount-time choice] → acceptable; the toggle is one tap and chip state is unaffected.
- [Subgrid unsupported in an old browser] → the facet row falls back to a plain grid: labels and chips still render in order, only column alignment is lost.
- [Ghost tag composition means the tag text is no longer the chip text] → `heldLabel` is derived once in the hook and tested there; the layout never builds copy.
- [New vocabulary breaks existing P5X test assertions] → updated in the same change; hook-level tests cover facet semantics once so page tests stay wiring-only.
- [`No build` overlaps `Open slots` for fresh thieves] → intentional; AND composition narrows correctly, and the chips answer different questions (set a build vs. equip cards).
- [Unlabelled single-chip facet surprises a declarer] → the rule is in the spec and in the facet's JSDoc; declaring a one-chip facet is pointless but harmless.
