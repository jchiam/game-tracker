## 1. Core factory

- [x] 1.1 Add `PartyPersistenceConfig<TParty, TMember>` + `createPartyPersistence` to `src/services/rosterPersistence.ts`: uniform select (`id, profile_id, name, notes, created_at` + optional `extraSelect` + `membersTable ( * )`), load ordered by `created_at` desc with members sorted by `slot_index`, create-or-update save (shared row: `name || defaultName`, `notes ?? null`, spread `extraToRow`), delete-then-reinsert members, delete, generic `is_favorited` toggle; unified error semantics (load throws; save returns null on party-row error, logs and returns id on member error; delete/toggle return false)
- [x] 1.2 Add `createPartyPersistence` suite to `src/services/rosterPersistence.test.ts` against a synthetic config: DB-disabled early returns, load query/order/mapping/member-sort/extras merge, save create (insert payload + default name + member rows + returned id), save update (row update, member clear, reinsert), empty-members skip, party-row error → null, member error → id + log, delete + toggle success/failure

## 2. Adapters (each game's suite green after its rewrite)

- [x] 2.1 Rewrite `src/services/honkai-star-rail/partyService.ts` as adapter (hsr_parties / hsr_party_members / 'New Party' / character_id); rewrite `partyService.test.ts` to config wiring on shared `createBuilder`
- [x] 2.2 Rewrite `src/services/arknights-endfield/partyService.ts` as adapter (ae_parties / ae_party_members / 'New Squad' / operator_id); rewrite its test
- [x] 2.3 Rewrite `src/services/reverse1999/partyService.ts` as adapter with extras (`tier`, `is_favorited` incl. write-back) + `toggleFavoriteParty` re-export ('New Lineup' / arcanist_id); rewrite its test
- [x] 2.4 Rewrite `src/services/neverness-to-everness/partyService.ts` as adapter with extras (`tier` select/write, `is_favorited` select-only) + `toggleFavoriteParty` re-export ('New Party' / character_id); rewrite its test

## 3. Verification & docs

- [x] 3.1 Full gate: `npm test`, `npm run lint`, `npm run format:check`, `npm run build`, `npm run test:e2e`
- [x] 3.2 Update CLAUDE.md: service-layer party description in Layer Responsibilities, Key Files row for `rosterPersistence.ts`, Known Limitations note that party member replacement shares the non-atomic delete-then-reinsert pattern
- [x] 3.3 `npx openspec validate --all`
