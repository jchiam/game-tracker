## 1. Shared seam

- [x] 1.1 Add optional `searchKeys?: string[]` to `PartyViewConfig` in `src/components/parties/PartiesView.tsx` (JSDoc: fields the member picker searches; defaults to `['name']`)
- [x] 1.2 Read `config.searchKeys` in `PartyEditorModal` (modal already receives the full `config`, so no redundant separate prop)

## 2. Picker search

- [x] 2.1 In `PartyEditorModal.tsx`, import `Fuse` from `fuse.js`
- [x] 2.2 Replace the name-only substring filter in `filteredEntities` with: when a term is present, `new Fuse(entities, { keys: config.searchKeys ?? ['name'], threshold: 0.3 })` matched results; else all entities — then apply the existing already-added exclusion and slot `entityFilter` as post-filters
- [x] 2.3 Confirm the `useMemo` dependency array covers `searchKeys` (stable from config) alongside existing deps

## 3. P5X wiring

- [x] 3.1 Set `searchKeys: ['name', 'codename', 'personaName', 'role', 'element']` on `P5X_PARTY_VIEW` in `src/pages/persona-5-phantom-x/components/partyConfig.ts`

## 4. Tests

- [x] 4.1 Add a `PartiesView`/`PartyEditorModal` test: picker with `searchKeys` including `codename` lists an entity matched by codename but not name
- [x] 4.2 Add a test: config without `searchKeys` matches on `name` only (default)
- [x] 4.3 Add a test: search composes with slot `entityFilter` + already-added exclusion (extends existing "excludes already-added members and honours the search filter" test)
- [x] 4.4 Run `npm test`, `npm run lint`, `npm run format:check`, `npm run build`

## 5. Docs

- [x] 5.1 Update the shared-parties `PartyViewConfig` description in `CLAUDE.md` / `CONTEXT.md` if either enumerates config fields (note the `searchKeys` seam)
- [x] 5.2 Run `npx openspec validate --all`
