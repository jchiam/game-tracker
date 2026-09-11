## 1. Database read path

- [x] 1.1 Migration `20260911000000`: `CREATE INDEX IF NOT EXISTS idx_hsr_relic_substats_relic_id ON hsr_relic_substats(relic_id)`; verify `pg_indexes` lists it after applying
- [x] 1.2 Migration `20260911000001`: `DO` block over `pg_policies` rewriting bare `auth.uid()` to `(SELECT auth.uid())` via `ALTER POLICY`, skipping already-wrapped policies (design D1); verify 108/108 wrapped, 0 bare, re-run leaves no double wrapping, `EXPLAIN` under `authenticated` shows an InitPlan

## 2. Connection and image path

- [x] 2.1 `index.html`: `<link rel="preconnect">` for `%VITE_SUPABASE_URL%` (crossorigin) and `%VITE_IMAGEKIT_URL_ENDPOINT%` (design D2); verify `dist/index.html` shows the substituted origins after `vite build`
- [x] 2.2 `src/lib/imagekit.ts`: `MUGSHOT_CROP = 'tr:fo-top,ar-1-1:w-480,c-at_max'` shared by `getMugshotUrl` and `getPersonaMugshotUrl` (design D3); update `imagekit.test.ts`; verify R1999 148 KB → 48 KB and HSR byte-identical against the live CDN
- [x] 2.3 `GameCardShell.tsx` header `<img>`: `loading="lazy"`, `decoding="async"`; verify `GameCardShell.test.tsx`

## 3. Atomic writes

- [x] 3.1 Migration `20260911000002`: `assert_game_table`, `insert_json_rows`, `replace_preference_rows` (design D4); `savePreferenceRows` maps its options onto one `supabase.rpc` call, dropping empty insert sets; rewrite the shared and four per-game preference-save tests to assert the RPC payload; verify on throwaway Postgres: happy path, bad-column rollback, non-owner raises, allowlist rejects `user_profiles` and an injection-shaped name
- [x] 3.2 Migration `20260911000003`: `upsert_equipment_slot`; new `upsertEquipmentSlot` helper in `rosterPersistence.ts`; `upsertRelic` / `upsertDisc` become config adapters over it; rewrite their tests; verify on throwaway Postgres: insert-then-update keeps one row and replaces substats, empty list clears, ZZZ integer slot, bad-column rollback, non-owner refused
- [x] 3.3 Migration `20260911000004`: `save_party`; `createPartyPersistence.saveParty` is one RPC resolving `{ partyId }`; `PartySaveResult` drops `membersSaved` (design D5); `useParties` drops the warning toast; update every test/story stubbing the result; verify on throwaway Postgres: create, update replacing members, update clearing members, ZZZ `bangboo_id` and P5X `member_type`, duplicate `slot_index` rolls back, non-owner update by id raises, spoofed `profile_id` refused
- [x] 3.4 Fix: read `GET DIAGNOSTICS ROW_COUNT` instead of `IF NOT FOUND` after dynamic `UPDATE` in `replace_preference_rows` and `save_party`; verify the non-owner cases raise

## 4. Profile provisioning

- [x] 4.1 Migration `20260911000005`: `handle_new_user()` trigger on `auth.users` + backfill (design D6); remove the `user_profiles` upsert from the roster insert path; update the insert test and the MSW handler list; verify on throwaway Postgres with a stub `auth.users`: backfill adds only the missing profile, a new user gets one from the trigger, a bare tracked insert succeeds

## 5. Docs and specs

- [x] 5.1 `CLAUDE.md`: service-layer paragraph (RPC helpers, trigger-provisioned profiles), Known Limitations rewritten to the RPC verification practice (design D7); `CONTEXT.md`: Roster Persistence, Preference Rows, new Equipment Slot, Party Persistence Factory + error semantics, cross-references
- [x] 5.2 OpenSpec deltas for the nine affected specs; `npx openspec validate --all`

## 6. Verify

- [x] 6.1 `npm test`, `npm run lint`, `npm run format:check`, `npx tsc -b` green on every commit
- [x] 6.2 Migrations applied to the hosted project
- [ ] 6.3 Post-deploy: DevTools Network TTFB on the first `/rest/v1/*` request vs later ones; decide whether the deferred child-table `profile_id` denormalisation is still needed
