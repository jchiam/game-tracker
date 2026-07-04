## Context

Candidates 1–2 (archived 2026-07-04) established the pattern: shared core + thin per-game config adapters, with per-game tests covering only the config. Candidate 3 applies the same shape one layer up, to the four add-entity picker modals. All four already import the same `AddEntityModal.css` and `Modal`; only the component logic is quadruplicated.

## Goals / Non-Goals

**Goals**

- One implementation of the picker: search state, filtering, exclusion, avatar, list, empty state, add flow.
- Per-game files reduced to declarative config (title, noun, search keys, badge descriptors).
- Fix the HSR picker image bug (raw local path bypasses ImageKit).
- Unify search and exclusion semantics across games.

**Non-Goals**

- No visual redesign — `AddEntityModal.css` untouched, markup structure preserved.
- No page changes — wrappers keep their existing names and prop interfaces.
- PartyEditorModal member pickers are out of scope (different layout and selection semantics; party persistence is candidate 4).

## Decisions

### Decision 1: Thin per-game wrappers, not direct page use

Pages keep importing `AddCharacterModal` / `AddArcanistModal` / `AddOperatorModal` with unchanged props. The wrapper is where game display config lives (badge variants, search keys), mirroring the service-adapter precedent — and it keeps per-game config unit-testable without rendering a whole page. Deleting the wrappers would save ~30 lines per game but push badge config into pages and lose the config-wiring test seam.

### Decision 2: Fuse.js everywhere, exclusion by `id`

N2E/AE behaviour (fuzzy multi-key search, id-based exclusion) is the newer, better convention; HSR/R1999 upgrade to it rather than the shared component supporting both modes. A `matchMode` prop would preserve substring behaviour nobody chose deliberately. Fuse keys per game: HSR `name/element/path`, R1999 `name/afflatus/damageType`, N2E `name/esperType/arcType/roles` (unchanged), AE `name/class/element/weapon` (unchanged). Threshold stays 0.3.

### Decision 3: Badge descriptors rendered via `GameBadge`, not a render prop

`getBadges(entity)` returns `{ label, variant, modifier }[]`; the shared component maps them through `GameBadge`. A render prop would allow arbitrary markup — exactly what let the four copies drift into hand-built spans. Descriptors keep output on the canonical class list and let the `shared-card-badges` "hand-rendered badges" requirement be removed. HSR's optional path badge and its `\s+` → `-` modifier munging live in the HSR wrapper's descriptor function.

### Decision 4: `getAvatarUrl` hardcoded in the shared component

No `getImageUrl` prop. `getAvatarUrl`'s own comment designates it for "small … avatar (e.g. modal list items)", three of four games already use it, and the fourth (HSR) only diverges by accident — its raw `/assets/...` path 404s in production (images are not in the repo) and every HSR picker row falls back to ui-avatars. Fixing by unification beats preserving the bug behind a prop.

### Decision 5: Test split follows candidate 2

`AddEntityModal.test.tsx` proves generic behaviour once against a synthetic entity fixture. Per-game tests keep: title renders, badge descriptor classes appear, search by a secondary key returns the entity (proves `searchKeys` wiring), add callback passes the full entity, tracked entity excluded. Dropped per game: empty-state, image-fallback, search-input mechanics — shared-component behaviour.

## Risks / Trade-offs

- **Fuzzy search ranking differs from substring** for HSR/R1999 — mitigated by threshold 0.3 (same as N2E/AE, no complaints) and e2e add-flow coverage.
- **`name` → `id` exclusion** would change behaviour only if a tracked row's id diverged from its catalog id — impossible via the app (tracked entities are created from catalog entries).
- **Generic typing**: the shared component constrains `T extends { id: string; name: string; imageUrl: string }`; all four catalog interfaces satisfy it structurally.
