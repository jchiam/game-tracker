# Design — Network Load Performance

## Context

See `proposal.md` — Why. Measured baseline before any change (curl from this machine, nearby region):

| Probe                                      | Result                            |
| ------------------------------------------ | --------------------------------- |
| Supabase REST, cold / warm / warm          | TTFB 2.81 s / 0.39 s / 0.18 s     |
| TLS to Supabase                            | 55 ms cold, 23 ms warm            |
| R1999 mugshot, `tr:fo-top,ar-1-1`          | 148 KB webp                       |
| R1999 mugshot, `…:w-480,c-at_max`          | 48 KB                             |
| HSR mugshot, either form                   | 28 KB (256 px source, no upscale) |
| RLS policies using bare `auth.uid()::text` | 108 of 108                        |
| FK child columns without an index          | 1 (`hsr_relic_substats.relic_id`) |

Round trips per user action before this change: add entity 2, save relic/disc 3, save Target Build 5, save party 3 + reload.

## Goals / Non-Goals

**Goals:**

- Remove per-row work from every RLS evaluation and the one seq-scan on a growing child table.
- Take connection setup off the first data and image requests.
- Serve card portraits at display size without inflating small sources.
- Make every multi-row write one atomic round trip under the caller's RLS, retiring the Known Limitation.
- Keep every per-game service a config adapter: new behaviour lives once in `rosterPersistence.ts` and once in SQL.

**Non-Goals:**

- Denormalising `profile_id` onto child tables for flat RLS policies — deferred until post-deploy measurement shows the `(select auth.uid())` rewrite is insufficient.
- Returning the joined party row from `save_party` to drop the post-save reload.
- Route-chunk prefetch, bundle splitting, or any change to the debounce window.
- Supabase plan-tier / cold-start behaviour, which no client change affects.

## Decisions

### D1. Rewrite RLS policies generically over `pg_policies`

One `DO` block reads each public policy's deparsed `qual` / `with_check`, replaces `auth.uid()` with `(SELECT auth.uid())`, and re-applies it with `ALTER POLICY`. Names, commands, and roles are untouched; policies already containing the subquery form are skipped, so the migration is idempotent and safe for tables added later. Chosen over ~120 hand-written DROP/CREATE pairs because the transformation is mechanical and a missed policy would silently keep the slow form.

### D2. Preconnect via Vite env substitution, not literals

`index.html` uses `%VITE_SUPABASE_URL%` and `%VITE_IMAGEKIT_URL_ENDPOINT%` so the hint origins cannot drift from the client config or from the CSP that `verify:csp` checks. Supabase gets `crossorigin` (supabase-js fetches with CORS, which uses a separate connection pool); ImageKit serves plain `<img>` loads and does not.

### D3. Mugshot cap is a chained transform with `c-at_max`

`tr:fo-top,ar-1-1:w-480,c-at_max` — crop first, then resize. 480 px covers 2× displays for the 280 px-min card column. `c-at_max` matters: a plain `w-480` upscaled HSR's 256 px sources and doubled their bytes. ZZZ keeps its own resolver (already `w-256`). Party slot avatars and picker rows already use the 128 px avatar transform.

### D4. Three RPCs, table names as data, allowlisted

The write shapes are shared across four games, so per-game SQL functions would multiply. Each function takes table/column names as arguments and:

- validates every table with `assert_game_table` — must match `^(hsr|r1999|n2e|ae|p5x|zzz)_[a-z0-9_]+$` and exist in `public`;
- interpolates identifiers only through `format('%I')`;
- runs as `SECURITY INVOKER` with `search_path = public`, so the caller's RLS applies exactly as it did to the direct calls;
- inserts through `insert_json_rows`, which writes only the columns the JSON rows carry so `id` / `created_at` defaults still apply.

`EXECUTE` does not set `FOUND` for an `UPDATE` without `RETURNING`, so the not-found checks read `GET DIAGNOSTICS … ROW_COUNT` — a non-owner update must raise, not silently succeed.

| Function                  | Replaces                              | Calls before → after |
| ------------------------- | ------------------------------------- | -------------------- |
| `replace_preference_rows` | `savePreferenceRows` sequence         | up to 5 → 1          |
| `upsert_equipment_slot`   | `upsertRelic` / `upsertDisc` sequence | 3 → 1                |
| `save_party`              | `createPartyPersistence.saveParty`    | 3 → 1 (+ reload)     |

`EXECUTE` is granted to `authenticated` only; the helpers are revoked from `PUBLIC`.

### D5. `PartySaveResult` loses `membersSaved`

With an atomic save there is no partial state to report; keeping the flag would be a lie the hook could never act on. The hook keeps its "Couldn't save" toast on `partyId: null` and the post-save reload.

### D6. Profile provisioning moves to an auth trigger

`handle_new_user()` (`SECURITY DEFINER`, pinned `search_path`) inserts the `user_profiles` row `AFTER INSERT ON auth.users`; the migration backfills existing users. This removes the per-insert upsert — whose error the client never checked — without a client-side "ensure profile once" step that would race a fast first add.

### D7. Verification lives in a throwaway Postgres, documented in CLAUDE.md

The mocked service tests only assert RPC payloads. Each function was exercised by applying the full migration history to `postgres:16-alpine` with a stub `auth` schema: happy path, rollback on a bad column or duplicate key, non-owner refusal under RLS, allowlist rejection. There is no CI integration test; the Known Limitations entry now says to re-run this whenever a migration touches an RPC.

## Risks / Trade-offs

- **Generic SQL over table names** widens what a client can ask the DB to do, but only within tables it could already reach through PostgREST under the same RLS; the allowlist and `%I` quoting close the injection surface.
- **Trigger on `auth.users`** runs during sign-up; a failure there fails sign-up. The function is the standard Supabase pattern and `ON CONFLICT DO NOTHING`.
- **Policy rewrite is dynamic SQL** and harder to review than explicit policies; verified by counting bare vs wrapped forms after applying.
