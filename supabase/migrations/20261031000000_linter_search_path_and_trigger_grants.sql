-- Supabase database linter follow-ups (report of 2026-10-31).
--
-- 0011 function_search_path_mutable — assert_game_table, insert_json_rows.
-- Both helpers were created without SET search_path. In practice they only
-- run inside replace_preference_rows / upsert_equipment_slot / save_party,
-- which pin search_path = public and pass that setting down the call stack,
-- so the unqualified names they touch already resolved safely. The linter
-- evaluates each function on its own, though, and a direct call would
-- resolve names through the caller's search_path. Pin it on the helpers so
-- they are safe standalone and the dependency on the entry points is gone.
--
-- 0028 / 0029 anon|authenticated_security_definer_function_executable —
-- handle_new_user. The migration that created it revoked EXECUTE from
-- PUBLIC, but Supabase's default privileges on the public schema grant
-- EXECUTE on every new function to anon, authenticated, and service_role
-- explicitly, and REVOKE ... FROM PUBLIC does not touch explicit grants. The
-- trigger function therefore stayed reachable at /rest/v1/rpc/handle_new_user.
-- Calling it there can do nothing (Postgres refuses to run a trigger function
-- outside a trigger: "trigger functions can only be called as triggers"),
-- but a SECURITY DEFINER function has no business being on the API surface.
-- Revoking from the API roles cannot break sign-up: EXECUTE on a trigger
-- function is checked when the trigger is created, not when it fires.

ALTER FUNCTION public.assert_game_table(text) SET search_path = public;
ALTER FUNCTION public.insert_json_rows(text, jsonb) SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, service_role;
