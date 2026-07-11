## Why

The three equipment editor modals (HSR `RelicEditorModal`, N2E `CartridgeEditorModal`, P5X `RevelationEditorModal`) share the interaction contract specced in `shared-equipment-editor`, but each hand-renders the same structure: `Modal` + two-tab `.modal-tabs` scaffold + `activeTab` state + Done footer (~35 lines ×3), and HSR/P5X carry a byte-identical anchor-scroll effect (~10 lines ×2). ~120 LOC of pure structural duplication; the contract holds by convention, not construction — a fourth game could ship a three-tab editor without failing anything. (Architecture review 2026-07-11, finding 5, scope decided by grilling: scaffold only.)

## What Changes

- Add a shared `EquipmentEditorShell` component (L3, `src/components/`) — structural sibling of `GameCardShell`: owns the `Modal`, the two-tab scaffold ("Equip …" / "Build Preferences"), the `activeTab` state, the body wrapper, and the Done footer. Games supply `title`, `equipTabLabel`, `className`/`bodyClassName` (existing per-game CSS keys unchanged), `equipContent`, `preferencesContent`, and optional `equipFooterExtra` (rendered before Done on the Equip tab only — N2E's Un-equip button).
- Add a shared `useScrollAnchor` hook (`src/hooks/`) replacing the identical HSR/P5X anchor-scroll effect; stays inside the per-game equip bodies (the shell knows nothing about slots).
- Adopt in all three modals. Equip/preferences tab bodies, slot cards, validation, and set pickers stay per-game — grilling showed the slot bodies diverge structurally (fixed-main strategies, save shapes, option formats, N2E's staged two-step picker); unifying them would be config-as-wide-as-markup (MOVE, not CONCENTRATE).
- Add "Equipment Editor Shell" to `CONTEXT.md` (sibling of Game Card Shell) and a CLAUDE.md L3 table row; Storybook story + component test per L3 rules.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `shared-equipment-editor`: ADDED requirement — equipment editor modals SHALL be composed from the shared `EquipmentEditorShell`; games SHALL NOT hand-write the modal/tab/footer scaffold. MODIFIED requirement "Unified all-slots editor modal" — the anchor-scroll behaviour SHALL be implemented via the shared `useScrollAnchor` hook.

## Impact

- **Code:** new `src/components/EquipmentEditorShell.tsx` (+ `.test.tsx`, `.stories.tsx`), new `src/hooks/useScrollAnchor.ts`; the three modal files shrink to their tab bodies; `CONTEXT.md`, CLAUDE.md.
- **CSS:** none — `.modal-tabs`/`.tab-btn` and per-game body classes unchanged; class names pass through.
- **Behavior:** none — markup and tab/unmount semantics identical; existing modal tests pass unchanged.
