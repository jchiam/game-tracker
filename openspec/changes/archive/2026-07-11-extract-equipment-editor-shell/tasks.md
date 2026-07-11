## 1. Shared shell + hook

- [x] 1.1 Create `src/components/EquipmentEditorShell.tsx`: props `{ title, equipTabLabel, className?, bodyClassName, equipContent, preferencesContent, equipFooterExtra?, onClose }`; owns `activeTab` state, `.modal-tabs` bar ("{equipTabLabel}" / "Build Preferences"), body wrapper, footer (`equipFooterExtra` before Done, Equip tab only); renders only the active tab's content.
- [x] 1.2 Create `src/hooks/useScrollAnchor.ts`: returns a ref; on mount, optional-chained `scrollIntoView({ block: 'start' })` (jsdom guard preserved).
- [x] 1.3 Add `EquipmentEditorShell.test.tsx`: default tab is Equip, tab switch unmounts inactive content, Done fires `onClose`, `equipFooterExtra` present on Equip tab and absent on Build Preferences.
- [x] 1.4 Add `EquipmentEditorShell.stories.tsx` (L3 rule): default two-tab story with placeholder content, story with `equipFooterExtra`.

## 2. Modal adoption

- [x] 2.1 HSR `RelicEditorModal.tsx`: compose shell (`title`, "Equip Relics", `relic-editor`/`relic-editor-body`); `EquipTab` uses `useScrollAnchor`; delete scaffold code.
- [x] 2.2 P5X `RevelationEditorModal.tsx`: compose shell ("Equip Cards", `revelation-editor-modal`/`revelation-editor-body`); `EquipTab` uses `useScrollAnchor`.
- [x] 2.3 N2E `CartridgeEditorModal.tsx`: compose shell ("Equip Cartridge", `cartridge-editor`/`cartridge-editor-body`); Un-equip button via `equipFooterExtra`.
- [x] 2.4 Add "Equipment Editor Shell" to `CONTEXT.md` (sibling of Game Card Shell) and an `EquipmentEditorShell` row to the CLAUDE.md L3 table.

## 3. Verify

- [x] 3.1 `npm test` — three modal suites pass unchanged (markup identical).
- [x] 3.2 `npm run lint && npm run format:check && npm run build`.
- [x] 3.3 `npx openspec validate --all`.
