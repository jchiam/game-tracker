# Tasks

## 1. Shared component

- [x] 1.1 Create `src/components/AddEntityModal.tsx` — generic picker: Fuse.js search (threshold 0.3, per-game keys), id-based tracked exclusion, alphabetical default sort, `getAvatarUrl` avatars with ui-avatars error fallback, `GameBadge` descriptor rendering, empty state with configured noun
- [x] 1.2 Create `src/components/AddEntityModal.test.tsx` — generic behaviour against a synthetic fixture: list render, exclusion, fuzzy + blank search, add callback, empty state, image fallback
- [x] 1.3 Create `src/components/AddEntityModal.stories.tsx` — L3 shared-component story with Controls

## 2. Per-game wrappers

- [x] 2.1 HSR `AddCharacterModal.tsx` → wrapper: keys `name/element/path`, element + conditional path badges (path modifier whitespace→dash); picker avatars now via `getAvatarUrl`
- [x] 2.2 R1999 `AddArcanistModal.tsx` → wrapper: keys `name/afflatus/damageType`, afflatus + damage badges
- [x] 2.3 N2E `AddCharacterModal.tsx` → wrapper: keys `name/esperType/arcType/roles`, esper + arc badges, title "Add Esper", noun "espers"
- [x] 2.4 AE `AddOperatorModal.tsx` → wrapper: keys `name/class/element/weapon`, ae-class + ae-element badges

## 3. Collapse per-game tests

- [x] 3.1 Each wrapper test keeps: title, badge classes, secondary-key search hit, tracked exclusion, add passthrough; drops empty-state / image-fallback / input-mechanics duplicates

## 4. Verification

- [x] 4.1 `npm test`, `npm run lint`, `npm run format:check` green; note LOC delta
- [x] 4.2 `npm run test:e2e` add-entity flows green (fuzzy-search unification touched UI behaviour)
