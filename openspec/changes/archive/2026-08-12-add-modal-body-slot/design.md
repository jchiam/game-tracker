# Design: add-modal-body-slot

## Context

See proposal.md — Why. Current direct `Modal` compositions and their body handling:

- `EquipmentEditorShell` — accepts a required `bodyClassName` prop and renders its own `<div className={bodyClassName}>` around the active tab; games style it per-modal (`.relic-editor-body`, etc.).
- `PartyEditorModal` — renders its own `.party-editor-body` div.
- HSR `LightConeEditorModal` — renders its own `.light-cone-editor-body` div (added after this dialog shipped without one).
- `AddEntityModal` — deliberately bare: full-bleed `.modal-search` bar + result list.

Three of four hand-roll the same wrapper shape (padding, column flex, `overflow-y: auto`, `max-height` ~50vh, mobile variant); the CSS is duplicated per modal with only minor divergence.

## Goals / Non-Goals

**Goals:**

- Make the padded/scrollable body the API's easy path — one prop, one canonical class — so a new dialog cannot silently ship without it.
- Collapse the duplicated per-modal body CSS into one `.modal-body` rule; per-modal classes keep only real overrides.
- Zero visual change to existing dialogs.

**Non-Goals:**

- Forcing a wrapper on every modal — `AddEntityModal`'s full-bleed layout stays a first-class citizen via the bare default.
- Any behaviour change to overlay/Escape/footer semantics.
- Touching per-game modal content or the `EquipmentEditorShell` tab scaffold beyond where the wrapper renders.

## Decisions

**D1 — Opt-in `bodyClassName` prop, not an always-on wrapper.**
An unconditional `.modal-body` wrapper would break `AddEntityModal` (full-bleed search + list would gain padding) and force an opt-out class, which the design system forbids ("never add opt-outs; if you need them, the component is inheriting styles it shouldn't"). Opt-in keeps bare-children as the explicit full-bleed statement. The trap shrinks from "remember to build a wrapper div + CSS rule" to "pass one prop whose canonical value is documented in the prop's own doc comment".

**D2 — Canonical `.modal-body` base rule in `Modal.css`; per-modal classes become modifiers.**
`.modal-body` owns padding `var(--spacing-lg)`, column flex + gap, `overflow-y: auto`, `max-height: 50vh`, and the ≤600px variant (padding/gap step down, `max-height: 60vh`) — the shape all three hand-rolled rules share today. Composers pass `"modal-body"` alone or `"modal-body <modifier>"`; a modifier class keeps only genuine divergence (e.g. a different gap). `RelicEditorModal.css` / `PartyEditorModal.css` / `LightConeEditorModal.css` rules shrink accordingly; any file left empty is deleted.

**D3 — `EquipmentEditorShell` forwards its existing `bodyClassName` prop to `Modal`.**
The shell's public API is unchanged (games keep passing `bodyClassName="relic-editor-body"` → becomes `"modal-body relic-editor-body"` at the shell's discretion, or the shell prepends `modal-body` itself). Decision: the shell prepends `modal-body` so game configs stay untouched — one change site instead of four game files. Tabs (`.modal-tabs`) stay outside the body slot (they must not scroll with content), so the shell passes tabs as a sibling — this requires `Modal` to render the body slot after non-body children... resolved by keeping the shell's tab bar inside `children` before the wrapped area is not possible with a single slot. Instead: `Modal` wraps ALL children when `bodyClassName` is set, so the shell keeps rendering tabs itself and does NOT use the Modal slot — it renders `.modal-tabs` + its own body div as today, but the body div's class list gains `modal-body` (reusing the canonical rule, deleting the shell-side duplicate CSS). Net: the slot serves single-region dialogs; the shell reuses the CSS, not the wrapper.

**D4 — `Modal.test.tsx` pins the slot contract; migrated modals pin composition.**
New Modal tests: `bodyClassName` set → children inside `.modal-content > .modal-body`; unset → no injected div. Migrated modal tests assert their content sits inside `.modal-body` (replacing per-modal wrapper assertions). Storybook `Modal` story gains a body-slot variant per the design-system Storybook rule.

## Risks / Trade-offs

- [Two legitimate patterns remain (slot for single-region dialogs, shell-managed div for tabbed editors)] → Acceptable: both share the single `.modal-body` rule, and the shell already owns its structure; the trap existed only for hand-built single-region dialogs, which the slot now covers.
- [Future dialog author omits `bodyClassName` by accident] → The bare default is now a documented, spec-pinned opt-out; CLAUDE.md rule becomes one line ("pass bodyClassName unless full-bleed"), and reviewers have a spec scenario to point at.
- [`max-height` divergence across dialogs (50vh vs party editor's value)] → Modifier classes carry per-modal overrides; no behaviour flattening.

## Migration Plan

1. Add `.modal-body` to `Modal.css` + the `bodyClassName` prop to `Modal.tsx`.
2. Migrate `LightConeEditorModal` and `PartyEditorModal` to the slot; shrink their CSS to modifiers (delete files if empty).
3. Switch `EquipmentEditorShell`'s internal body div to `modal-body <game class>`; delete duplicated declarations from game CSS files.
4. Update CLAUDE.md convention paragraph + memory note; update Storybook.
5. Visual pass across all four dialog families (HSR relic editor, N2E cartridge editor, P5X revelation editor, party editor, cone dialog, add-entity pickers).

Rollback = revert; no data or schema surface.

## Open Questions

None.
