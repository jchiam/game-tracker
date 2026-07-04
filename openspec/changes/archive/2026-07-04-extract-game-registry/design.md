## Context

Three call sites consume game metadata with overlapping-but-different shapes.
`GameSwitcher` keys entries on the short game id (`hsr`), `SelectionPage` on the route
slug (`honkai-star-rail`), and `App.tsx` hardcodes each route. Game pages already share
an identical props shape (`session`, `isAuthLoading`, `onSignIn`).

## Decisions

### 1. Registry lives at `src/lib/games.ts`

Not `src/data/` — that directory is generated-only by guard rail. `src/lib/` already
holds hand-authored infrastructure glue (`supabase.ts`, `imagekit.ts`). The registry
contains `lazy()` component references, which is infrastructure, not catalog data.

### 2. One entry shape, superset of all three consumers

`id` (short: `hsr`), `name`, `path`, `developer` (SelectionPage `tag`), `description`,
`icon` + `color` (switcher), `coverImage` + `bgClass` (selection card), `Page`
(`LazyExoticComponent`). The long slug ids disappear — `path` covers routing and
`id` covers keys. `bgClass` stays an explicit field rather than being derived from
`id` because existing CSS classes are inconsistent (`bg-honkai-star-rail-sel` vs
`bg-r1999-sel`); renaming CSS is out of scope.

### 3. Lazy pages move into the registry

`lazy(() => import(...))` calls relocate from `App.tsx` to the registry entries.
Vite's code-splitting is unchanged — chunks are created per dynamic `import()`, and the
lazy wrappers are still constructed once at module scope (previously `App.tsx` module
scope, now `games.ts` module scope, which `App.tsx` imports). No render-time `lazy()`
creation. `GamePageProps` is exported from the registry and matches the four pages'
existing prop interfaces verbatim; pages keep their own local interfaces (no forced
import churn) — the registry type simply structurally matches them.

### 4. App keeps SelectionPage route explicit

`/` renders `SelectionPage`, which takes different props (`signInWithGoogle` with a
path argument) and is not a "game". Only game routes are generated from the registry.

### 5. Tests

Existing `GameSwitcher.test.tsx` / `SelectionPage.test.tsx` are behavioural (assert
rendered names, hrefs, badges) and pass unchanged — that is the regression check.
New `games.test.ts` asserts registry invariants: four entries, unique `id`s and
`path`s, every `path` starts with `/`, all string fields non-empty. It does not render
the lazy pages (that would drag the full per-game module graph into a unit test; the
route rendering is already covered by e2e).

### 6. Spec placement

New `shared-game-registry` capability owns the registry requirement. The existing
`shared-ui-components` GameSwitcher requirement is MODIFIED only in its rationale
("driven by the shared `GAMES` registry"); its scenarios are unchanged.
