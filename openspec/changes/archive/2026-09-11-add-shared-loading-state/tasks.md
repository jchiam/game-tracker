## 1. LoadingState component

- [x] 1.1 Create `src/components/LoadingState.tsx` — `.loading-state` container, `role="status"`, `aria-live="polite"`, `aria-hidden` `.loading-state-dots` row of three `.spinner-dot`s, `label` prop (design D1)
- [x] 1.2 Add `.loading-state` / `.loading-state-dots` rules to `src/styles/controls.css` beside `.spinner-dot` — grid-span, centered, borderless, existing tokens only (design D2)
- [x] 1.3 Create `src/components/LoadingState.test.tsx` — label renders, `role="status"` + `aria-live`, three dots aria-hidden
- [x] 1.4 Create `src/components/LoadingState.stories.tsx` — Controls-editable `label`, representative labels

## 2. Roster ladder + selection page + Suspense

- [x] 2.1 `RosterPageLayout.tsx`: swap both loading branches to `<LoadingState label="Checking sign-in…" />` / `<LoadingState label="Loading your roster…" />`
- [x] 2.2 `SelectionPage.tsx`: auth branch renders `<LoadingState label="Checking sign-in…" />`
- [x] 2.3 `App.tsx`: `Suspense` fallback `null` → `<LoadingState label="Loading…" />`
- [x] 2.4 Sweep tests asserting old copy ("Authenticating...", "Loading database sync...", "Checking authentication...") across six game page tests + `SelectionPage.test.tsx` + any layout stories (`RosterPageLayout.stories.tsx`); assert new copy or `role="status"`

## 3. PartiesView initial load

- [x] 3.1 `PartiesView.tsx`: add optional `isInitialLoad` prop (default false); when true and signed in, render `<LoadingState label={`Loading your ${nouns.partiesLower}…`} />` in place of grid contents, header/create button stay visible (design D4)
- [x] 3.2 Forward `isInitialLoad` through all six `PartiesTab.tsx` adapters and their page wiring (HSR, R1999, N2E, AE, P5X, ZZZ)
- [x] 3.3 PartiesView test: initial load shows loader not false empty; loaded-empty still shows `.empty-state`; adapter config-wiring tests updated if prop asserted

## 4. Verify

- [x] 4.1 `npm test` green
- [x] 4.2 `npm run lint && npm run format:check && npm run build`
- [x] 4.3 `npx openspec validate --all`
