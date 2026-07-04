## 1. Registry

- [x] 1.1 Create `src/lib/games.ts` with `GamePageProps`, `Game` interface, and the four-entry `GAMES` array (lazy pages included)
- [x] 1.2 Add `src/lib/games.test.ts` invariant tests

## 2. Consumers

- [x] 2.1 `App.tsx`: map `GAMES` to routes, drop per-game lazy consts
- [x] 2.2 `GameSwitcher.tsx`: drop local array, import registry
- [x] 2.3 `SelectionPage.tsx`: drop local array, import registry (tag→developer, imageUrl→coverImage)

## 3. Verify

- [x] 3.1 `npm test`, `npm run lint`, `npm run format:check`, `npm run build` green
- [x] 3.2 `npm run test:e2e` green (route + selection behaviour unchanged)

## 4. Docs and spec sync

- [x] 4.1 CLAUDE.md: collapse wiring checklist steps 2–4 into one registry step
- [x] 4.2 Create `openspec/specs/shared-game-registry/spec.md`, modify GameSwitcher requirement in `shared-ui-components`, archive change, `npx openspec validate --all`
