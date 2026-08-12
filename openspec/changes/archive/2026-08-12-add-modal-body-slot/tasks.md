# Tasks: add-modal-body-slot

## 1. Modal API

- [x] 1.1 `Modal.tsx`: add optional `bodyClassName` prop — when set, wrap `children` in `<div className={bodyClassName}>`; doc comment names `"modal-body"` as the canonical value and bare children as the full-bleed opt-out
- [x] 1.2 `Modal.css`: add the canonical `.modal-body` rule (padding, column flex + gap, `overflow-y: auto`, `max-height: 50vh`, ≤600px variant)
- [x] 1.3 `Modal.test.tsx`: slot wraps children under `.modal-content > .modal-body`; no injected div when the prop is omitted

## 2. Migrate direct compositions

- [x] 2.1 `LightConeEditorModal`: use the slot (`bodyClassName="modal-body light-cone-editor-body"` or plain `modal-body` if no override remains); shrink/delete `LightConeEditorModal.css`; update its structural test
- [x] 2.2 `PartyEditorModal`: same treatment for `.party-editor-body`; keep only override declarations in `PartyEditorModal.css`
- [x] 2.3 `EquipmentEditorShell`: internal body div class becomes `modal-body <bodyClassName>`; delete duplicated padding/scroll declarations from `RelicEditorModal.css` and the other game editor CSS files; shell tests updated
- [x] 2.4 Confirm `AddEntityModal` untouched (bare children, full-bleed) — add a structural test pinning the absence of an injected wrapper

## 3. Docs & Storybook

- [x] 3.1 CLAUDE.md: rewrite the "Modal body convention" paragraph to the new rule (pass `bodyClassName` — usually `modal-body` — unless deliberately full-bleed)
- [x] 3.2 `Modal.stories.tsx`: add a body-slot variant story (Controls for `bodyClassName`)

## 4. Verify

- [x] 4.1 `npx openspec validate --all` passes
- [x] 4.2 `npm run lint && npm run format:check && npm test && npm run build` pass
- [x] 4.3 Visual pass in dev/Storybook across all dialog families (relic/cartridge/revelation editors, party editor, cone dialog, add-entity pickers) — zero visual change expected
