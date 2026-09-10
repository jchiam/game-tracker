## 1. Pipeline & catalog

- [x] 1.1 Extend `scripts/lib/pipeline.mjs` `fetchJSON` with an optional `init` (RequestInit) parameter — additive, existing GET callers unchanged.
- [x] 1.2 Add the Bangboo section to `scripts/update-zzz-data.mjs`: paginated HoyoLab wiki fetch (menu 15, POST with `Origin`/`Referer`/`X-Rpc-Wiki_app`/`x-rpc-language` headers), map to `{id: entry_page_id, name, rarity from bangboo_rarity | null, icon_url}`, `loadExistingBangboos` + `diffByKey`, `ensureAsset` icon loop to `zenless_zone_zero/bangboos/{id}.png`, `generateBangboosTs` (rarity S → A → untagged, name-alphabetical within bands), `--reupload-bangboos` flag, header comment updated with the new source.
- [x] 1.3 Run the script to generate `src/data/zenless-zone-zero/bangboos.ts` (38 entries) and seed ImageKit icons; verify diff output and Prettier stability.

## 2. DB & persistence

- [x] 2.1 Migration `supabase/migrations/20260819000000_add_zzz_party_bangboo.sql`: `ALTER TABLE zzz_parties ADD COLUMN bangboo_id TEXT;`.
- [x] 2.2 Add `companionId?: string | null` to `Party` in `src/types.ts`.
- [x] 2.3 Wire `bangboo_id` through `src/services/zenless-zone-zero/partyService.ts` extras (`extraSelect`, `extraFromRow`, `extraToRow`); extend `partyService.test.ts` config-wiring tests for the mapping and null round-trip.

## 3. Shared companion slot seam

- [x] 3.1 Add `companionSlot` config to `PartyViewConfig` in `src/components/parties/PartiesView.tsx` (label, entities, image resolvers, optional search placeholder) with seam JSDoc.
- [x] 3.2 `PartyEditorModal.tsx`: companion builder-slot in its own labelled group panel, `activeSlot` widened to `number | 'companion' | null`, picker sources companion entities with name-only Fuse search, save payload spreads `companionId` only when configured.
- [x] 3.3 `PartyCard.tsx`: labelled companion tile after member slots — avatar + name when set, `.empty-plus` placeholder when unset; nothing rendered for games without the config.
- [x] 3.4 Minor styling in `party.css` / `PartyEditorModal.css` for the companion group panel and tile (tokens only).
- [x] 3.5 Tests: `PartiesView.test.tsx` companion pick/clear/round-trip through the editor, card tile set/unset, and a no-config regression (payload has no `companionId`, UI unchanged).
- [x] 3.6 Update `PartiesView.stories.tsx` with a companion-slot variant story.

## 4. ZZZ wiring

- [x] 4.1 Add `getZzzBangbooIconUrl` (`tr:w-128`, local fallback) to `src/lib/imagekit.ts`.
- [x] 4.2 Wire `companionSlot` into `src/pages/zenless-zone-zero/components/PartiesTab.tsx`: label "Bangboo", `ALL_ZZZ_BANGBOOS`, icon resolvers; extend `PartiesTab.test.tsx` config-wiring tests.

## 5. Verification & docs

- [x] 5.1 Full local gate: `npm run lint`, `npm run format:check`, `npm test`, `npm run build`, `npm run test:e2e`.
- [x] 5.2 Update `CONTEXT.md` (companion slot in the Party/Lineup section) and `CLAUDE.md` if the parties table row needs the new seam mentioned.
- [x] 5.3 Apply migration to live Supabase (Jonathan) and manual verification: pick, clear, reload, card tile.
