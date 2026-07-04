## Why

The set of games is declared four times: a `GAMES` array in `GameSwitcher.tsx` (id,
name, path, icon, color), a differently-shaped `GAMES` array in `SelectionPage.tsx`
(slug id, name, path, bgClass, imageUrl, description, tag), and per-game lazy imports +
`<Route>` blocks in `App.tsx`. Adding a game means editing three code files with
near-identical information (the CLAUDE.md wiring checklist steps 2–4 exist only because
of this). The declarations can drift — nothing ties a switcher entry to an actual
route.

## What Changes

- Add `src/lib/games.ts`: single `GAMES` registry — one entry per game carrying `id`,
  `name`, `path`, `developer`, `description`, `icon`, `color`, `coverImage`, `bgClass`,
  and a lazy `Page` component — plus the shared `GamePageProps` interface all game
  pages implement.
- `App.tsx` maps `GAMES` to routes generically; `GameSwitcher.tsx` and
  `SelectionPage.tsx` drop their local arrays and read the registry.
- Add `src/lib/games.test.ts` asserting registry invariants (unique ids/paths, complete
  fields, four games).
- CLAUDE.md wiring checklist collapses steps 2–4 into "add one entry to
  `src/lib/games.ts`".
- No behaviour change: same routes, same lazy code-splitting, same rendered markup.

## Capabilities

### New Capabilities

- `shared-game-registry`: the single source of truth for the game roster — route,
  switcher, and selection-page metadata plus the lazy page component.

### Modified Capabilities

- `shared-ui-components`: GameSwitcher requirement now references the shared registry
  instead of a component-local `GAMES` array.

## Impact

- **New code**: `src/lib/games.ts`, `src/lib/games.test.ts`.
- **Modified code**: `src/App.tsx`, `src/components/GameSwitcher.tsx`,
  `src/pages/SelectionPage.tsx`, `CLAUDE.md`.
- **Untouched**: game pages, hooks, services, e2e tests (behaviour identical),
  `index.css` bg classes, CSP.
