# Design

## Context

`p5x-revelation-equip-form` (archived) introduced, as P5X-local code: `FormGroup.className`,
`SubStatList.disabled`, the shared `.readonly-stat` class, an `is-gated` dim, and per-slot grouping
cards — plus set-gating of the editable stat controls. Three of those (the two props and
`.readonly-stat`) are generic and already merged, but the shared-ui-components spec never gained
requirements for them, and its "Build-preference editor modal layout pattern" requirement still
asserts FormGroups are the body's only direct children — which P5X's slot cards now violate. The
HSR relic and N2E cartridge editors, meanwhile, already label every control (they were the reference
for change 1) but do not set-gate, and HSR renders its fixed main with an inline style + hardcoded
`rgba`. This change makes the cross-game standard real: spec catch-up + HSR/N2E behavior.

## Goals / Non-goals

**Goals**

- HSR relic + N2E cartridge editors set-gate their editable stat controls (dim + disable until a
  Set / Cartridge is chosen), matching P5X.
- HSR fixed main (head/hands) migrates onto shared `.readonly-stat`; inline style + `rgba` deleted.
- shared-ui-components spec catches up: `FormGroup.className`, `SubStatList.disabled`,
  `.readonly-stat`, the reconciled layout pattern, and the labeled + set-gated standard.

**Non-goals**

- P5X changes (already shipped in change 1).
- AE weapon editor (no set/main/sub model — out of scope, stated in the standard).
- Any data model, hook, persistence, or scoring change.
- New primitives — `FormGroup.className` and `SubStatList.disabled` already exist. (`LevelSlider`
  gains a small `disabled` prop here, the one primitive tweak this change needs.)

## Decisions

### D1 — Reconcile the layout-pattern requirement (not an exception)

Rather than carve P5X out as a special case, generalize the rule: the editor body's **direct
children** provide inter-field spacing via `gap`, and each child is a `FormGroup`, a per-slot
grouping container (bordered slot card, for multi-slot editors), or a thin state wrapper (an
`is-gated` `<div>` around one primitive). Single-slot editors (HSR, N2E) render `FormGroup`s
directly; multi-slot editors (P5X) group per slot. The two old scenarios that asserted "FormGroups
are direct children / gap only on form groups" are rewritten to this generalized form, so the synced
main spec no longer contradicts shipped P5X. (This is the semantic contradiction `validate --all`
could not catch — it must be fixed in the requirement text, not just code.)

### D2 — HSR set-gating

In `RelicEditorModal`, gate on `currentRelic.setId`. When falsy: the variable-main `Select` gets
`disabled`, the `SubStatList` gets `disabled`, and each editable group is wrapped/marked `is-gated`
for the dim. Head/hands are fixed → their `.readonly-stat` main is never gated. The Relic Set select
is never gated. Preferences tab unchanged.

### D3 — N2E set-gating

In `CartridgeEditorModal`, gate on `currentCartridgeId` (a valid id requires both name and rarity —
N2E already disables the rarity row until a name is chosen; this extends the same gate downstream).
When no cartridge is selected: the Main Stat `Select`, the `LevelSlider`, and the `SubStatList` are
`disabled` + `is-gated`. The Cartridge name select and Rarity row are never stat-gated (rarity keeps
its existing name-gate). N2E has no fixed main, so no `.readonly-stat` here.

### D4 — HSR fixed-main → `.readonly-stat`

Replace the inline-styled `(Fixed)` `<div>` (hardcoded `rgba(255,255,255,0.02)`, inline border/
color) with `<span className="readonly-stat">{HP|ATK}</span>`, matching P5X. Removes the token-rule
violation. The `(Fixed)` affordance can stay as text inside the span or be dropped; keep the stat
label plus a `(Fixed)` suffix for clarity, consistent with the read-only intent.

### D5 — Gating wrapper mechanics reused from P5X

Same as change 1: `is-gated` is opacity-only (in `controls.css`, already added); real interaction
blocking comes from the primitives' `disabled` props. `FormGroup className="is-gated"` for grouped
controls; an `is-gated` `<div>` around `SubStatList`. No new CSS beyond what change 1 shipped.

## Risks

- **Low** — behavior + spec reconciliation, no data path touched. Main risk is a stale HSR/N2E test
  asserting the old always-enabled controls; those update with the gating. Watch that N2E's existing
  rarity name-gate and the new stat-gate compose without double-disabling oddly.
