# Proposal: add-modal-body-slot

## Why

The base `Modal` renders `children` bare into `.modal-content` (a flex column with `overflow: hidden`) and provides no body padding or scrolling — every composer must remember to add a per-modal body div, and forgetting ships a visually broken dialog (most recently the HSR Light Cone preferences dialog; the miss has recurred). The convention is now documented in CLAUDE.md, but the API still permits the mistake. Moving the wrapper into `Modal` itself deletes the trap instead of documenting it.

## What Changes

- Add an optional `bodyClassName` prop to the shared `Modal`: when provided, `Modal` wraps `children` in `<div className={bodyClassName}>`; when omitted, children render bare (preserved for full-bleed layouts like the entity picker's search + list).
- Add a canonical `.modal-body` base rule to `Modal.css` — padding, column flex + gap, `overflow-y: auto`, `max-height: 50vh`, mobile media variant — so composers pass `bodyClassName="modal-body"` (optionally extended: `"modal-body relic-editor-body"` for per-modal overrides such as a different max-height).
- Migrate the direct compositions that currently hand-roll the wrapper: `EquipmentEditorShell` (its `bodyClassName` prop forwards to `Modal` instead of rendering its own div), `PartyEditorModal` (`.party-editor-body`), and HSR `LightConeEditorModal` (`.light-cone-editor-body`). Per-modal CSS keeps only overrides; duplicated padding/scroll declarations are deleted.
- `AddEntityModal` stays bare-children by design (full-bleed search bar + result list) — the documented exception.
- Update the CLAUDE.md "Modal body convention" paragraph: the rule becomes "pass `bodyClassName` (usually `modal-body`) unless the dialog is deliberately full-bleed".

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `shared-ui-components`: the "Modal provides the canonical overlay shell" requirement gains the body-slot contract (`bodyClassName` wrapping, `.modal-body` base styling, bare-children as the explicit full-bleed opt-out).

## Impact

- **Components**: `Modal.tsx` (prop + wrapper), `EquipmentEditorShell.tsx` (forward instead of wrap), `PartyEditorModal.tsx`, `LightConeEditorModal.tsx`.
- **CSS**: `Modal.css` gains `.modal-body`; `RelicEditorModal.css`, `PartyEditorModal.css`, `LightConeEditorModal.css` shrink to overrides (or empty and are deleted).
- **Behaviour**: none intended — pure structural refactor; every migrated dialog renders identically.
- **Tests**: `Modal.test.tsx` covers the wrap/bare branch; migrated modals' structural tests updated to the new class composition; Storybook `Modal` story gains the body-slot variant (design-system change → Storybook rule).
- **Docs**: CLAUDE.md convention paragraph rewritten to the new, shorter rule.
