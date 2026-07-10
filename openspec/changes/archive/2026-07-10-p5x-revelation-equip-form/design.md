# Design

## Context

`RevelationEditorModal`'s `EquipTab` maps `REVELATION_SLOTS` and, per slot, renders one
`FormGroup` labeled with only the slot name, then stacks three controls with no inner labels:
the Set `Select`, the main-stat control (a `Select` for variable slots, `.rev-fixed-main` spans
for fixed slots), and the `SubStatList` (whose `label` prop is left unset). Result: on Moon/Star/Sky
the main-stat select is indistinguishable from a substat select.

HSR (`RelicEditorModal`) and N2E (`CartridgeEditorModal`) already wrap every control in a labeled
`FormGroup` and pass a `label` to `SubStatList`; they edit one slot per modal so nothing stacks.
This change brings P5X onto that convention and adds the grouping/gating the stacked layout needs.
All changes are display-only — no data model, hook, or persistence change.

## Goals / Non-goals

**Goals**

- Every equip control labeled (Set / Main Stat / Substats), including fixed-main slots.
- Each slot a bordered, slot-named card so five stacked slots stay scannable.
- Main Stat + Substats set-gated (dimmed + disabled until a Set is chosen).
- A shared `.readonly-stat` class introduced for the read-only fixed-main display.

**Non-goals**

- HSR / N2E changes (gating extension + HSR inline-style migration) — deferred to the follow-up
  `standardise-equip-editor-form` change.
- Build Preferences tab — unchanged.
- Any change to what is stored or how it is saved.

## Decisions

### D1 — Label every control via the existing `FormGroup` / `SubStatList` label seam

Wrap the Set select in `FormGroup label="Set"`, the variable-main select in
`FormGroup label="Main Stat"`, and pass `label="Substats"` to `SubStatList`. For fixed-main slots,
wrap the read-only display in `FormGroup label="Main Stat"` too. No new labeling primitive — this is
exactly the HSR/N2E pattern applied to P5X.

### D2 — Slot card grouping (P5X-only, L4 CSS)

Replace the per-slot outer `FormGroup` (currently carrying the slot name) with a `.rev-slot-card`
container: a bordered block with a `.rev-slot-header` showing the slot name, holding the labeled
FormGroups. Styling lives in `RevelationEditorModal.css` (game-unique, L4) using tokens only. Only
P5X needs this because only P5X stacks all five slots in one modal.

### D3 — Set-gating: disable + dim in place (no collapse)

When `card?.setId` is falsy, render the Main Stat and Substats FormGroups with a disabled/dimmed
state (a `.is-gated` modifier that lowers opacity and blocks interaction), rather than hiding them.
Disable-in-place keeps each slot card's height stable and avoids reflow as sets are picked/cleared.
Both `Select` and `SubStatList` already accept/pass a `disabled` path via the shared controls; the
dim is a CSS wrapper class. The Set select itself is never gated.

### D4 — Shared `.readonly-stat` class in `controls.css`

Promote the read-only fixed-stat treatment to a shared `.readonly-stat` class in `controls.css`
(token-based surface/border/text). P5X's fixed-main chips switch from `.rev-fixed-main` to
`.readonly-stat`. This lands the shared class now; the HSR inline-style migration onto it is the
follow-up change's job. Not yet pinned in `shared-ui-components` spec — that standardisation is
deferred to change 2, which specs "editors share `.readonly-stat` + set-gating" across all games.

## Risks

- **Low** — display-only. Main risk is the `disabled` seam on `Select` / `SubStatList`: verify both
  honor a disabled/dimmed state (add the prop if missing) rather than relying on CSS
  `pointer-events` alone. Existing P5X equip tests update for the new labels and gating.
