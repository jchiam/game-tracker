## 1. ErrorState primitive

- [ ] 1.1 Add `.error-state` (+ `.error-state-glyph`, `.error-state-message`) to `src/styles/controls.css` beside `.loading-state` — grid span, centered column, solid `color-mix` danger border, `--color-ui-danger-bg` fill, primary text, existing tokens only (design D1); verify `npm run build:tokens` unchanged and no hardcoded hue
- [ ] 1.2 Create `src/components/ErrorState.tsx` — `message`, optional `onRetry`, optional `retryLabel` (default "Retry"), `role="alert"`, `aria-hidden` glyph, retry `className="btn primary-action"`; verify it renders in a scratch story
- [ ] 1.3 Create `src/components/ErrorState.test.tsx` — message inside `role="alert"`, retry click invokes handler, no button without handler, custom label, container lacks `empty-state` / `loading-state` classes; verify `npx vitest run src/components/ErrorState`
- [ ] 1.4 Create `src/components/ErrorState.stories.tsx` — Controls for `message` / `retryLabel`, stories WithRetry / NoRetry / ReloadLabel; verify `npm run build:storybook` succeeds
- [ ] 1.5 Delete `src/components/LoadErrorState.tsx`, `.test.tsx`, `.stories.tsx`; delete `.retry-button` rules from `src/components/RosterPageLayout.css`; verify `grep -rn "LoadErrorState\|retry-button" src` returns nothing

## 2. Roster ladder

- [ ] 2.1 `RosterPageLayout.tsx`: error branch renders `<ErrorState message="Couldn't load your roster." onRetry={onRetry} />`; verify `RosterPageLayout.stories.tsx` `LoadError` story (renamed to `LoadError` → keep name, update copy) renders the new box
- [ ] 2.2 Sweep the six page tests (`HsrPage`, `Reverse1999Page`, `N2ePage`, `ArknightsEndfieldPage`, `P5xPage`, `ZzzPage`) asserting "Failed to load data" — assert new copy, `role="alert"`, and absence of `.empty-state` in the error branch; verify `npx vitest run src/pages`

## 3. Party hook parity and mutation feedback

- [ ] 3.1 `src/types.ts`: add `PartySaveResult { partyId: string | null; membersSaved: boolean }`; verify `npx tsc --noEmit` compiles after 3.2
- [ ] 3.2 `rosterPersistence.ts` `createPartyPersistence.saveParty`: resolve `{ partyId, membersSaved }` per design D4 (row failure → `{ null, false }`, member failure → `{ id, false }`, success or no members → `{ id, true }`); verify `rosterPersistence.test.ts` new cases for all three shapes pass
- [ ] 3.3 `src/hooks/useParties.ts`: rename `isLoading` → `isInitialLoad`; add `isLoadError`, `retryLoad`, retry counter in the load effect; add `nouns: { party: string; parties: string }` to `PartyConfig`; implement every feedback row of design D5 via `addToast`; `saveParty` returns `PartySaveResult`; verify new `src/hooks/useParties.test.ts` (hoisted-mock pattern) covers load error, retry, save null → toast + no reload, membersSaved false → warning toast, reload rejection → error toast + `isLoadError`, delete false → toast, favorite revert → toast, refresh rejection → toast + `isLoadError`
- [ ] 3.4 Update six per-game `src/hooks/{game}/useParties.ts` wrappers — pass nouns, forward `isInitialLoad` / `isLoadError` / `retryLoad`; verify `npx tsc --noEmit`
- [ ] 3.5 Update per-game `partyService.test.ts` files and any page tests whose `saveParty` mocks resolve a string — resolve a `PartySaveResult`; verify `npx vitest run src/services src/pages`

## 4. Parties view

- [ ] 4.1 `PartiesView.tsx`: add `isLoadError` (default false) and `onRetry` props; ladder loading → error (`<ErrorState message={`Couldn't load your ${nouns.partiesLower}.`} onRetry={onRetry} />`) → empty → cards; `onSave` closes the modal only when `result.partyId` is non-null; `onSaveParty` typed `Promise<PartySaveResult>`; verify `PartiesView.test.tsx` new cases: error rung shown instead of empty, Retry invokes `onRetry` once, modal stays open with entries intact on `partyId: null`, closes on id
- [ ] 4.2 Forward `isLoadError` / `onRetry` through all six `PartiesTab.tsx` adapters; verify adapter config-wiring tests updated and `npx vitest run src/pages` passes
- [ ] 4.3 Six game pages: destructure `isInitialLoad`, `isLoadError`, `retryLoad` from the party hook; pass the **party** flags to `PartiesTab` (not the roster's `isInitialLoad`); build `retryAll` (roster + parties) for `RosterPageLayout.onRetry` and pass party `retryLoad` to `PartiesTab.onRetry` (design D3); verify a page test asserts roster Retry invokes both retries and the parties tab shows loading while only parties are in flight
- [ ] 4.4 `PartiesView.stories.tsx`: add `LoadError` story; verify `npm run build:storybook`

## 5. Field-save rollback and preference rows

- [ ] 5.1 `src/hooks/useRoster.ts` `applyPatch`: snapshot ref keyed by `dbId` captured on first pending patch, flush wrapper restores only the failed payload's keys and rethrows (design D6); verify `useRoster.test.ts` new cases: failed field reverts + toast still fires, unrelated later field survives, successful flush clears the snapshot
- [ ] 5.2 `savePreferenceRows`: destructure and log + throw on each delete error and the parent-update error before proceeding (design D7); verify `rosterPersistence.test.ts` new cases: delete error throws before insert, parent-update error throws before insert

## 6. Auth and route boundary

- [ ] 6.1 `src/hooks/useAuth.ts`: `.catch` on `getSession()` → `session` null, `isAuthLoading` false, error toast "Couldn't check your sign-in. Please reload."; verify `useAuth.test.ts` new case with `getSession` rejecting
- [ ] 6.2 Create `src/components/RouteErrorBoundary.tsx` (class component, documented exception) rendering `ErrorState` with "Something went wrong loading this page." and a Reload action calling `window.location.reload()`; wrap `Suspense` in `App.tsx` inside `.layout` below `Navbar` / `ToastContainer`; verify `RouteErrorBoundary.test.tsx`: throwing child renders the alert, Reload calls a stubbed `location.reload`, non-throwing child renders normally

## 7. MSW REST 500 coverage

- [ ] 7.1 `src/test/mocks/handlers.ts`: add `createSupabaseRestErrorHandlers(tables: string[], status = 500)` returning `http.all('*/rest/v1/:table', …)` handlers with a PostgREST-shaped error body; verify handler unit-tested indirectly by 7.2
- [ ] 7.2 Create `src/services/rosterPersistence.msw.test.ts`: `vi.stubEnv` Supabase URL/key, dynamic-import the service module, per-file MSW server; assert `load` and `loadParties` reject on 500 with the PostgREST error, `saveParty` resolves `{ partyId: null, membersSaved: false }` on 500, `remove` rejects on 500; verify `npx vitest run src/services/rosterPersistence.msw`

## 8. Docs

- [ ] 8.1 `CLAUDE.md`: L3 table row `LoadErrorState` → `ErrorState` (+ `RouteErrorBoundary` row), Shared Components list entry, note `.error-state` in the `controls.css` L2 row; verify `grep -n LoadErrorState CLAUDE.md` is empty
- [ ] 8.2 `CONTEXT.md` Party Persistence Factory: update error semantics to the `PartySaveResult` contract and note the hook now owns mutation feedback; `src/styles/components.md`: replace `LoadErrorState` entry; verify both greps clean

## 9. Verify

- [ ] 9.1 `npm test` green
- [ ] 9.2 `npm run lint && npm run format:check && npm run build`
- [ ] 9.3 `npm run build:storybook`
- [ ] 9.4 `npx openspec validate --all`
- [ ] 9.5 Manual: with the dev server running, block `*/rest/v1/*` in DevTools (or return 500 via an override) and confirm roster and parties tabs show the danger-bordered alert with Retry, a party save keeps the modal open with an error toast, and unblocking + Retry recovers both tabs
