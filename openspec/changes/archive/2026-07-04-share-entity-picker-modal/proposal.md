## Why

The four add-entity picker modals (`AddCharacterModal` ×2, `AddArcanistModal`, `AddOperatorModal` — 380 component LOC + 650 test LOC) are ~90% identical: same `Modal` shell, search input, filtered list, avatar with ui-avatars fallback, two badges, `+` button, empty state. The differences are pure config (title, search noun, search keys, badge descriptors) plus three accidental inconsistencies: HSR/R1999 use substring name search while N2E/AE use Fuse.js fuzzy multi-key search; HSR/R1999 exclude tracked entities by `name` while N2E/AE use `id`; and HSR passes the raw local `imageUrl` (`/assets/...`) to `<img>` — those files are not in the repo, so the HSR picker silently falls back to ui-avatars in production instead of showing ImageKit avatars. This was identified as candidate 3 (Strong) in the 2026-07-04 architecture review.

## What Changes

- New shared `AddEntityModal` component in `src/components/AddEntityModal.tsx` (next to the existing `AddEntityModal.css` it already shares). Generic over the catalog entity type; owns search state, Fuse.js filtering, tracked-exclusion, avatar resolution, list rendering, empty state.
- The four per-game modals become thin config wrappers (same file names, same prop interfaces — zero page churn), each passing: `title`, `entityNoun` (placeholder + empty message), `searchKeys` (Fuse keys), and `getBadges` (badge descriptor list rendered via the shared `GameBadge`).
- Behaviour unifications (all deliberate upgrades):
  - **Search**: HSR and R1999 upgrade from substring name-match to Fuse.js fuzzy multi-key search (HSR: name/element/path; R1999: name/afflatus/damageType), matching N2E/AE.
  - **Tracked exclusion**: by catalog `id` everywhere (HSR/R1999 previously by `name` — equivalent for current catalogs, `id` is the actual key).
  - **Images**: all pickers resolve through `getAvatarUrl` — fixes the HSR raw-local-path bug (its comment already says "modal list items").
  - **Badges**: rendered via `GameBadge` descriptors instead of hand-built spans — markup output unchanged (`game-badge {variant}-badge {variant}-{modifier}`).
- Tests: new `AddEntityModal.test.tsx` covers the generic behaviour once (render, fuzzy search, exclusion, add callback, empty state, image fallback); per-game modal tests collapse to config wiring (title, badge classes, secondary-key search proving `searchKeys`, add passthrough).
- Storybook: new `AddEntityModal.stories.tsx` (L3 shared component rule).

## Capabilities

### New Capabilities

- `shared-entity-picker`: the shared add-entity picker modal contract — search, exclusion, avatar, badges, add flow — plus the per-game wrapper convention.

### Modified Capabilities

- `shared-card-badges`: the "Directly-rendered badges include the base class" requirement is removed — its only subjects were the picker modals' hand-built badge spans, which now render via `GameBadge`. No hand-rendered `game-badge` spans remain in the codebase.

## Impact

- **Added:** `src/components/AddEntityModal.tsx`, `.test.tsx`, `.stories.tsx`.
- **Modified:** the four per-game `Add*Modal.tsx` (each shrinks to a ~30-line config wrapper) and their four test files (collapse to config wiring).
- **Unchanged:** pages, hooks, services, `AddEntityModal.css`, DB schema, e2e flows (add-entity e2e still passes through the same titles/placeholders).
- **Risk:** low-moderate — UI behaviour changes are the three deliberate unifications above; the HSR image fix is strictly better; fuzzy search may rank results differently than substring match but the e2e + per-game wiring tests gate regressions.
