# Game Tracker

Multi-game roster and party tracker. React 19 + Vite + Supabase + Vercel. Currently tracks **Honkai Star Rail**, **Reverse: 1999**, and **Neverness to Everness**.

## Tech Stack

- **Frontend:** React 19 + TypeScript (strict) + Vite 8 + React Router 7
- **Backend:** Supabase (PostgreSQL + Google OAuth + RLS)
- **Images:** ImageKit CDN with on-the-fly transforms; local paths as fallback
- **Styling:** CSS per component + Style Dictionary design tokens (`src/styles/design-tokens.json` → `tokens.css`)
- **Testing:** Vitest + React Testing Library (unit), Playwright (e2e), MSW (API mocking)
- **CI/CD:** GitHub Actions → Vercel (auto-deploy on main)
- **Data updates:** Automated scripts (`scripts/update-*-data.mjs`) + weekly GitHub Actions workflows

## Commands

```bash
npm run dev          # Vite dev server on :5173 + Style Dictionary watch
npm run build        # TypeScript check + Vite build (runs build:tokens first)
npm run lint         # ESLint
npm run format       # Prettier (write)
npm run format:check # Prettier (check — used in CI)
npm test             # Vitest unit tests
npm run test:e2e     # Playwright e2e tests
npm run verify:csp   # Verify CSP connect-src matches Supabase URL
npm run storybook    # Storybook dev server on :6006
npm run build:storybook # Build static Storybook
```

Pre-commit hook (Husky) runs: `openspec validate --all`.
Pre-push hook (Husky) runs: `format:check`, `lint`, `test`, `build`, `test:e2e`.

## Git

- Always use `git -c commit.gpgsign=false` — GPG signing is not configured in this environment.
- Conventional Commits style: `feat(r1999):`, `fix(hsr):`, `chore(n2e):`, `test:`, `refactor:`, `style:`.
- Game-scoped commits use the short game ID: `hsr`, `r1999`, `n2e`.
- **Always run `npx openspec validate --all` before committing** when openspec specs or changes were modified. The pre-commit hook enforces this, but verify manually if unsure.

## Code Conventions

- **Components**: `export function Foo()` — named declaration, never default export (except `App`)
- **Props**: `interface FooProps {}` defined directly above the component in the same file
- **Hooks**: `use` prefix, camelCase filename (`useParties.ts`)
- **Services**: `<entity>Service.ts`, plain functional exports, no classes
- **Files**: PascalCase for components/pages; camelCase for hooks, services, utils
- **CSS**: one `.css` file per component, kebab-case class names, always use CSS variables from design tokens — no hardcoded colour/spacing values
- **Imports**: always use `@/` alias (never relative paths); use `import type` for type-only imports
- **Types**: defined manually in `src/types.ts` — never run `supabase gen types`

## Design System

The design system is organised in 4 layers. Higher layers build on lower ones.

```
L1  Design Tokens     src/styles/design-tokens.json → tokens.css
L2  Shared Styles     src/styles/card.css, controls.css, animations.css
L3  Shared Components src/components/ (Modal, GameSwitcher, AuthGate, …)
L4  Game Components   src/pages/{game}/components/ (game-unique only)
```

### L1 — Design Tokens

Tokens live in `src/styles/design-tokens.json` and are compiled to `src/styles/tokens.css` via Style Dictionary (`npm run build:tokens`). Never edit `tokens.css` directly.

- **Token-first CSS** — All color, spacing, radius, shadow, transition, duration, and z-index values MUST reference tokens. If a needed token doesn't exist, add it to `design-tokens.json` first, run `npm run build:tokens`, then reference it.
- **Game-specific colours** — Live under `color.{gameId}` in `design-tokens.json` (e.g., `color.hsr`, `color.r1999`, `color.n2e`).
- **Duration vs Transition tokens** — `--duration-*` for `animation` durations, `--transition-*` for CSS `transition` properties. Duration = time only; transition = time + easing.
- **Canonical names only** — `--color-brand-primary` not `--color-primary`, `--border-radius-md` not `--radius-md`.
- **Known gap: rgba() badge backgrounds** — Badge `background` and `border-color` use `rgba(base, opacity)` because tokens can't express "same hue at X% opacity" yet. The text `color:` must still use a token.

### L2 — Shared Styles

| File                        | Contents                                                                                                                                                                                 |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/styles/card.css`       | `.game-card` wrapper, header, overlay, controls, body, name, `.favorite-btn`, `.remove-btn`, `.edit-toggle-btn`, `.progress-section`, `.section-header`                                  |
| `src/styles/controls.css`   | `.level-slider`/`.level-value`, `.spinner-dot`, `.stat-chip`, `.toggle-btn`, `.game-select`, `.segmented-buttons`, `.substats-section`/`.substat-row`, `.game-card-image` loading states |
| `src/styles/animations.css` | All shared `@keyframes`                                                                                                                                                                  |

**Card class names are canonical** — all games use `.game-card`, `.game-card-header`, `.game-card-image`, `.game-card-overlay`, `.game-card-controls`, `.game-card-body`, `.game-card-name`. Game-specific CSS files only add overrides (padding, hover transforms) and game-unique rules. Never re-declare a rule already in `card.css` or `controls.css`.

### L3 — Shared Components

| Component         | CSS                   | Purpose                                                            |
| ----------------- | --------------------- | ------------------------------------------------------------------ |
| `Modal`           | `Modal.css`           | Base modal + tabs + form-group input/textarea surfaces             |
| `ProgressSection` | uses `card.css`       | `.progress-section` + `.section-header` + `.section-value` wrapper |
| `GameBadge`       | uses game CSS         | Badge with `{variant}-badge {variant}-{modifier}` classes          |
| `StatChip`        | uses `controls.css`   | Compact stat display chip (`.stat-chip`)                           |
| `AuthGate`        | —                     | Sign-in prompt                                                     |
| `LoadErrorState`  | —                     | Retry prompt                                                       |
| `ConfirmCheckbox` | `ConfirmCheckbox.css` | Checkbox with confirmation                                         |
| `GameSwitcher`    | `GameSwitcher.css`    | Game dropdown                                                      |
| `Navbar`          | `Navbar.css`          | Top nav                                                            |
| `SavingToast`     | `SavingToast.css`     | Save indicator                                                     |
| `ToastContainer`  | `ToastContainer.css`  | Notification system                                                |

Shared modal CSS: `AddEntityModal.css` (list patterns), `PartyEditorModal.css` (team builder).

#### Build-preference primitives

Form controls shared across every build-preference / equipment editor (HSR relics, N2E cartridges, AE weapons) and card investment rows. All use `controls.css`.

| Component          | Purpose                                                                                                                                         |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `Select`           | Tokenized `<select>` (`.game-select`) — chevron, gold focus glow, `sm`/`md` size                                                                |
| `FormGroup`        | `.form-group` label + control wrapper                                                                                                           |
| `LevelSlider`      | `.level-slider` with internal `getProgressStyle` fill + optional `.level-value`                                                                 |
| `SegmentedButtons` | Single-exact button row; `coloring="static"` (per-option modifier class) or `"investment"` (active rung takes gradient colour); `allowDeselect` |
| `SubStatList`      | Stat-row list — discriminated `stat-only` (string[]) / `stat-value` ({type,value}[]); add/remove rows                                           |
| `PreferenceChain`  | Ordered preference chain with `>` / `>=` / `OR` operators (StatChain)                                                                           |
| `BuildComments`    | `FormGroup` + free-text textarea                                                                                                                |

**Use shared components for consistency.** All game cards must use `ProgressSection` for stat sections, `GameBadge` for type/element/afflatus badges, and `StatChip` for compact stat displays. All build-preference and equipment editors must compose the build-preference primitives above — `Select` (never a raw `<select>`), `LevelSlider` (never a raw range input), `SegmentedButtons` for discrete tiers/phases, `SubStatList` for stat-row lists, `PreferenceChain` for priority chains, `BuildComments` for notes. Don't re-implement these patterns with raw `<div>`/`<span>`/`<select>`/`<input>` elements.

### L4 — Game Components

Only game-unique UI belongs here. Game card CSS files contain:

- Card body padding/gap overrides
- Game-specific badge color classes (esper, path, afflatus)
- Game-specific equipment UI (relic grid, psychube section, cartridge slot)
- Game-specific score/tier badges
- Game-specific button rows and sliders beyond `.level-slider`

**Adding a new game card:** Use canonical `.game-card-*` class names. Import game-specific CSS for overrides only. Check `card.css` and `controls.css` before declaring any new rule — it may already exist.

### Storybook

Storybook documents L1–L3 of the design system. Run `npm run storybook` to browse.

- **Stories colocated next to source** — `Foo.stories.tsx` lives next to `Foo.tsx`. Token/style stories live in `src/styles/`.
- **Every design system change must update Storybook** — new token → update `DesignTokens.stories.tsx`; new shared style → update `CardPatterns` or `ControlPatterns` stories; new shared component → create a `.stories.tsx` with all variants.
- **Use Controls addon** — all component props should be interactive via Storybook Controls. Use `fn()` from `storybook/test` for action callbacks.
- **Don't create stories for L4 game components** — game-specific components change too frequently and require complex mock data.

## Architecture — Per-Game Module Pattern

Code is organised by game. Each game gets its own subdirectory. Shared code lives in `src/components/`, `src/lib/`, `src/utils/`, `src/types.ts`.

**Data flow:** static `ALL_*` arrays merged at runtime with DB rows → hook state → components.
**Writes:** always go through the service layer; batch/debounce via `usePendingSaves` (1000 ms) — never bypass it for DB mutations.

### Directory Layout

For a game called `{game}` with primary entity `{Entity}` (e.g., "character", "arcanist"):

```
src/
├── data/{game}/
│   ├── {entities}.ts          # Static catalog: interface + ALL_{ENTITIES} array
│   └── {equipment}.ts         # Optional: equippable items catalog
├── services/{game}/
│   ├── {entity}Service.ts     # Supabase CRUD for tracked entities
│   ├── {entity}Service.test.ts
│   ├── partyService.ts        # Supabase CRUD for parties/lineups
│   └── partyService.test.ts
├── hooks/{game}/
│   ├── use{Entities}.ts       # React hook: load, add, remove, update, search/filter
│   ├── use{Entities}.test.ts
│   ├── useParties.ts          # React hook: party CRUD
│   └── useParties.test.ts
├── pages/{game}/
│   ├── {Game}Page.tsx         # Main page: roster view + lineups view toggle
│   ├── {Game}Page.css
│   ├── {Game}Page.test.tsx
│   └── components/
│       ├── {Entity}Card.tsx       # Card component for tracked entity
│       ├── {Entity}Card.css
│       ├── {Entity}Card.test.tsx
│       ├── Add{Entity}Modal.tsx   # Modal to pick entity from catalog
│       ├── Add{Entity}Modal.test.tsx
│       ├── PartyCard.tsx          # Card for a saved party
│       ├── PartyCard.css
│       ├── PartyCard.test.tsx
│       ├── PartyEditorModal.tsx   # Modal to create/edit party
│       ├── PartyEditorModal.test.tsx
│       ├── PartiesTab.tsx         # Lineups tab container
│       ├── PartiesTab.css
│       └── PartiesTab.test.tsx
scripts/
│   └── update-{game}-data.mjs    # Fetches latest entity/equipment data from external sources
supabase/migrations/
│   └── YYYYMMDD000000_add_{game}_tables.sql
.github/workflows/
│   └── update-{game}-data.yml    # Weekly cron to run update script + auto-PR
```

### Layer Responsibilities

1. **Data layer** (`src/data/{game}/`): Static catalog arrays auto-generated by update scripts. Export an interface and a `const ALL_{ENTITIES}` array. Never edit manually — update the script instead.

2. **Service layer** (`src/services/{game}/`): Thin Supabase CRUD. Each function checks `DB_ENABLED` and returns early if Supabase is not configured. Functions: `load{Entities}FromDB`, `insert{Entity}`, `delete{Entity}`, `update{Entity}`. Party service: `loadParties`, `saveParty`, `deleteParty`.

3. **Hook layer** (`src/hooks/{game}/`): React state management. Loads from DB on session change. Optimistic updates with rollback on error. Uses `usePendingSaves` for debounced saves. Exposes `getFilteredRoster` (Fuse.js search) and individual field update functions.

4. **Page layer** (`src/pages/{game}/`): Composes hooks + components. Two views: "Roster" (entity cards grid) and "Lineups" (party tab). Handles auth gating, loading/error states, search, sort.

5. **Update script** (`scripts/update-{game}-data.mjs`): Fetches from external APIs (wikis, GitHub repos), downloads images, uploads to ImageKit, regenerates `src/data/{game}/*.ts` files. Idempotent — skips already-uploaded assets unless `--reupload-*` flags passed. Has a matching `.github/workflows/update-{game}-data.yml` that runs weekly + manual dispatch, auto-creates a PR with changes.

### Wiring a New Game Into the App

After creating the per-game module, connect it in these files:

1. **`src/types.ts`** — Add `{Game}Tracked{Entity}` and `{Game}Party`/`{Game}PartyMember` interfaces.
2. **`src/App.tsx`** — Add lazy-loaded route: `const {Game}Page = lazy(() => import(...))` + `<Route path="/{game-slug}" .../>`.
3. **`src/components/GameSwitcher.tsx`** — Add entry to `GAMES` array (id, name, path, icon, color).
4. **`src/pages/SelectionPage.tsx`** — Add entry to `GAMES` array (id, name, path, bgClass, imageUrl, description, tag).
5. **`src/index.css`** — Add `.game-card-header.bg-{game}-sel` background style.
6. **`vercel.json`** — If new external image domain needed, add to CSP `img-src`.
7. **`.env.template`** — Add any new env vars.

Reference implementation: Reverse: 1999 (`src/hooks/reverse1999/useArcanists.ts`, `src/services/reverse1999/arcanistService.ts`, `src/pages/reverse1999/Reverse1999Page.tsx`).

### Database Conventions

- Table names: `{game_prefix}_tracked_{entities}`, `{game_prefix}_parties`, `{game_prefix}_party_members`.
- All tables use UUID primary keys (`gen_random_uuid()`).
- `profile_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE`.
- Unique constraint on `(profile_id, {entity}_id)` for tracked entity tables.
- Party members: `slot_index INTEGER NOT NULL` with game-appropriate CHECK constraint + `UNIQUE(party_id, slot_index)`.
- Enable RLS on all tables. Use user-scoped policies (`profile_id = auth.uid()::text`).
- Index `profile_id` on main tables, `party_id` on member tables.
- Migration filename: `YYYYMMDD000000_add_{game}_tables.sql`. Incremental schema changes get separate timestamped migrations.
- Never run `supabase gen types` — types are hand-authored in `src/types.ts`.

### Image Pipeline

- Static entity catalogs reference local asset paths: `/assets/{game}/{entity-type}/{id}.webp`.
- Update scripts download images and upload to ImageKit. Images are NOT stored in the repo.
- `src/lib/imagekit.ts` provides `getMugshotUrl()`, `getAvatarUrl()`, etc. to resolve local paths → ImageKit CDN URLs with transforms.
- Add new transform functions to `imagekit.ts` as needed for game-specific image treatments.

### Testing Conventions

- Tests colocated next to source: `Foo.tsx` → `Foo.test.tsx`. E2e tests in `tests/`.
- Service tests: mock `@/lib/supabase` via `vi.doMock`. Test both DB-disabled (returns empty/null) and DB-enabled (correct table queries, error handling) paths.
- Component tests: use `@testing-library/react` `render` with mock data fixtures.
- Use `vi.fn()` for mocks; `userEvent.setup()` for user interactions.
- Use `src/test/mocks/supabase.ts` helpers (`createMockSession`, `createMockUser`) for auth fixtures.
- Run `npm test` before marking any fix or feature complete.

#### Hook tests — hoisted mock pattern (IMPORTANT)

Hook tests **must** use hoisted `vi.mock()` at module level with static imports — **never** `vi.doMock()` + `vi.resetModules()` + dynamic `import()`. The dynamic approach creates a fresh module graph per test, which means React, the hook, and `renderHook` may run in different instances — causing flaky state update races on slow CI runners.

**Correct pattern** (see `src/hooks/honkai-star-rail/useCharacters.test.ts`):

```typescript
// Hoisted mocks — run before any imports
vi.mock('@/services/{game}/{entity}Service', () => ({
  loadFromDB: vi.fn(),
  insert: vi.fn(),
  // ...
}));
vi.mock('@/hooks/usePendingSaves', () => ({
  usePendingSaves: () => ({
    pendingSaveCount: 0,
    queueUpdate: vi.fn((_k, updates, flush) => flush(updates)),
    queueAction: vi.fn((_k, action) => action()),
  }),
}));
vi.mock('@/utils/toast', () => ({ addToast: vi.fn() }));

// Static imports — same module instance throughout
import { useMyHook } from '@/hooks/{game}/useMyHook';
import * as service from '@/services/{game}/{entity}Service';
const mockLoad = vi.mocked(service.loadFromDB);

// Per-test reconfiguration via mock references
beforeEach(() => {
  vi.clearAllMocks();
  mockLoad.mockResolvedValue([]);
});
```

**Why `usePendingSaves` must be mocked**: it installs a `beforeunload` listener and uses `setTimeout` internally. Mocking it with a synchronous `queueUpdate` that calls `flushFn` immediately makes tests deterministic.

**Error-path tests**: use `mockRejectedValue` on the shared mock reference, spy on `console.error` to suppress expected noise:

```typescript
it('sets error on DB failure', async () => {
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
  mockLoad.mockRejectedValue(new Error('DB down'));
  const { result } = renderHook(() => useMyHook(session, false));
  await waitFor(() => expect(result.current.isInitialLoad).toBe(false));
  expect(result.current.isLoadError).toBe(true);
  spy.mockRestore();
});
```

### Known Limitations

- **Non-atomic preference saves.** `saveBuildPrefs` (HSR) and `saveCartridgePreferences` (N2E) persist a variable-length set of preference rows by **deleting all existing rows then re-inserting** — across separate Supabase calls with no transaction. A failure after the delete but before the insert completes leaves the preference rows **half-wiped in the DB**; the loss only surfaces on next reload (local optimistic state retains them until then). Mitigated, not fixed: writes route through `usePendingSaves`, so a failure raises an error toast and the user can retry. A proper fix needs a plpgsql function (atomic delete+insert) called via `supabase.rpc` with `SECURITY INVOKER` to preserve RLS — deferred because it would be the first RPC in the codebase and its atomicity guarantee can't be proven by the mocked unit tests (needs a local-Supabase integration test).

## Shared Components

Reuse these existing shared components — don't recreate them:

- `AuthGate` — shown when user is not logged in
- `LoadErrorState` — retry button for failed DB loads
- `SavingToast` — shows when pendingSaveCount > 0
- `Modal` — base modal with overlay, close button, keyboard handling
- `AddEntityModal.css` — shared modal styles for entity-picker modals
- `ConfirmCheckbox` — checkbox with confirmation dialog
- `GameSwitcher` — dropdown to switch between games (auto-hides on selection page)
- `usePendingSaves` — debounced save queue hook (shared across all games)
- `useAuth` — Google OAuth via Supabase

## Key Files

| File                           | Purpose                                                       |
| ------------------------------ | ------------------------------------------------------------- |
| `src/types.ts`                 | All shared domain types — single source of truth              |
| `src/index.css`                | CSS custom properties (colours, spacing, radii, transitions)  |
| `src/lib/supabase.ts`          | Supabase client (10 s timeout, auto session refresh)          |
| `src/hooks/usePendingSaves.ts` | Debounced DB write queue — reuse for all mutations            |
| `supabase/migrations/`         | Full schema history                                           |
| `.env.template`                | Required env var names (`VITE_SUPABASE_*`, `VITE_IMAGEKIT_*`) |

## Guard Rails

- **Never** run `vercel deploy` or push to Vercel without explicit instruction.
- **Never** `git push` without explicit instruction.
- **Always** run `npm run lint && npm run format:check` before committing.
- **Never** hand-edit `src/data/**` — those files are generated by scripts in `scripts/`.
- **Never** commit `.env.local`.
- Don't add new external domains without updating CSP in `vercel.json` and running `npm run verify:csp`.
- Don't skip RLS on new Supabase tables.
