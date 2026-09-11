-- Provision user_profiles rows from auth.users instead of on every insert.
--
-- The roster insert path upserted user_profiles before each tracked-entity
-- insert so the FK would hold — two sequential round trips per "add", and the
-- upsert's error was never checked. A profile row only needs to exist once
-- per user, so create it when the auth user is created (the standard Supabase
-- handle_new_user pattern) and backfill everyone who already exists. The
-- client then does a single insert.
--
-- SECURITY DEFINER: the trigger runs during sign-up, before the user has a
-- session, so it must be able to write public.user_profiles regardless of
-- the invoking role's RLS. search_path is pinned so the unqualified names
-- inside cannot be redirected.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id) VALUES (NEW.id::text)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Everyone who signed up before the trigger existed.
INSERT INTO public.user_profiles (id)
SELECT id::text FROM auth.users
ON CONFLICT (id) DO NOTHING;
