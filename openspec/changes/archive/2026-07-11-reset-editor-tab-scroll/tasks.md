# Tasks — Reset Editor Tab Scroll

## 1. Shell scroll reset

- [x] 1.1 Add `bodyRef` + skip-first-mount reset effect on `activeTab` change to `EquipmentEditorShell` (`bodyRef.current?.scrollTo?.({ top: 0 })`), attach ref to the body wrapper div
- [x] 1.2 Add shell tests: tab switch calls `scrollTo({ top: 0 })` on the body wrapper (both directions); no `scrollTo` on initial mount; missing `scrollTo` (jsdom default) does not throw

## 2. Verification

- [x] 2.1 Confirm no per-game modal changes needed (HSR/P5X anchor behaviour: open-time anchor preserved, tab-return lands top — covered by shell reset ordering)
- [x] 2.2 Run `npm test`, `npm run lint`, `npm run format:check`
- [x] 2.3 `npx openspec validate --all`
