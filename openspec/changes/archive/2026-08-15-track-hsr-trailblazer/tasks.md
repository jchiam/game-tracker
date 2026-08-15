# Tasks — track-hsr-trailblazer

## 1. Update script — Trailblazer catalog generation

- [x] 1.1 Inspect live StarRailRes character data: confirm `{NICKNAME}` placeholder, enumerate Trailblazer source-ID pairs per path (incl. Elation), verify gender↔ID parity assumption from design D3 (fallback: key gender off icon path)
- [x] 1.2 In `scripts/update-hsr-data.mjs` pass 1, special-case `{NICKNAME}` entries: map name to `Trailblazer (<Path>)`, group gender pairs per path, emit one raw entry per form carrying both icons (Stelle default, Caelus alt)
- [x] 1.3 Assign stable IDs `trailblazer_<path-slug>`; download/upload both portraits per form via `ensureAsset` (`trailblazer_<slug>.webp` + `trailblazer_<slug>_alt.webp`), idempotent
- [x] 1.4 Extend codegen: `Character` interface gains optional `altImageUrl`; Trailblazer entries emit it; other entries unchanged
- [x] 1.5 Run the update script; verify regenerated `characters.ts` has exactly 5 Trailblazer entries with correct names/elements/paths and CDN assets exist; non-Trailblazer placeholders still excluded

## 2. Persistence — display-portrait toggle

- [x] 2.1 Migration `supabase/migrations/<ts>_add_hsr_use_alt_portrait.sql`: `ALTER TABLE hsr_tracked_characters ADD COLUMN use_alt_portrait BOOLEAN NOT NULL DEFAULT false;`
- [x] 2.2 `src/types.ts`: add `useAltPortrait: boolean` to `HsrTrackedCharacter`
- [x] 2.3 `characterService.ts`: column-map + insert-default wiring for `use_alt_portrait`; extend service tests (config wiring only)
- [x] 2.4 `useCharacters.ts`: data-declared Field Updater for `useAltPortrait` (no custom body); extend hook tests per hoisted-mock pattern

## 3. Card UI — gender toggle + portrait resolution

- [x] 3.1 `CharacterCard.tsx`: header image resolves `useAltPortrait && char.altImageUrl ? altImageUrl : imageUrl`
- [x] 3.2 Add Stelle/Caelus `SegmentedButtons` in edit sections, rendered only when `char.altImageUrl` present; wire to Field Updater
- [x] 3.3 Component tests: toggle hidden on regular characters, shown on Trailblazer, portrait swaps on toggle, cosmetic-only (other fields untouched)

## 4. Shared parties — exclusion-group seam

- [x] 4.1 `PartiesView.tsx`: add `exclusionGroup?: (entity: E) => string | null` to `PartyViewConfig` (doc comment per existing style)
- [x] 4.2 `PartyEditorModal.tsx`: extend `filteredEntities` to exclude entities whose non-null group matches any selected member's entity group
- [x] 4.3 Shared parties tests: conflicting entity hidden, reappears after removal, ungrouped entities unaffected, games without config unchanged

## 5. HSR wiring — parties

- [x] 5.1 `PartiesTab.tsx` (HSR): config `exclusionGroup: (char) => char.id.startsWith('trailblazer_') ? 'trailblazer' : null`
- [x] 5.2 HSR page: map tracked `useAltPortrait` onto party entities (substitute `imageUrl` with `altImageUrl`) before passing to `PartiesTab`; untracked forms default Stelle
- [x] 5.3 PartiesTab config-wiring tests for both

## 6. Verify

- [x] 6.1 `npx openspec validate --all`
- [x] 6.2 `npm run lint && npm run format:check && npm test && npm run build` (+ `npm run test:e2e`: 66 passed)
- [x] 6.3 Manual smoke: add two Trailblazer forms, toggle gender on one, build party — second form hidden in picker while first selected (user-confirmed pass; automated pre-checks: REST column check 200, unauth page render clean)
