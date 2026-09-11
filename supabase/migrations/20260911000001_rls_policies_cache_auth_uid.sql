-- Rewrite every RLS policy so auth.uid() is evaluated once per statement.
--
-- Every policy so far compares against a bare `auth.uid()::text`. Postgres
-- treats the call as volatile-per-row and re-runs it for each row the policy
-- inspects; the child-table policies (relics, substats, preference rows, party
-- members) additionally wrap it in an EXISTS join back to the owning row, so
-- a roster load pays the call for every embedded row. Wrapping the call as a
-- scalar subquery `(select auth.uid())` lets the planner hoist it into an
-- InitPlan and evaluate it once — the pattern Supabase's RLS performance
-- guidance recommends.
--
-- Done generically over pg_policies rather than as ~120 hand-written
-- DROP/CREATE pairs: the deparsed USING / WITH CHECK expressions are read
-- back, `auth.uid()` is replaced with the subquery form, and ALTER POLICY
-- re-applies them. Policy names, commands, and roles are untouched. Policies
-- that already contain the subquery form are skipped, so the migration is
-- idempotent and safe for tables added later that use the wrapped form.

DO $$
DECLARE
  p RECORD;
  new_qual TEXT;
  new_check TEXT;
BEGIN
  FOR p IN
    SELECT schemaname, tablename, policyname, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (
        (qual IS NOT NULL AND qual LIKE '%auth.uid()%' AND qual NOT LIKE '%SELECT auth.uid()%')
        OR
        (with_check IS NOT NULL AND with_check LIKE '%auth.uid()%' AND with_check NOT LIKE '%SELECT auth.uid()%')
      )
  LOOP
    new_qual := CASE
      WHEN p.qual IS NULL THEN NULL
      ELSE replace(p.qual, 'auth.uid()', '(SELECT auth.uid())')
    END;
    new_check := CASE
      WHEN p.with_check IS NULL THEN NULL
      ELSE replace(p.with_check, 'auth.uid()', '(SELECT auth.uid())')
    END;

    EXECUTE format(
      'ALTER POLICY %I ON %I.%I%s%s',
      p.policyname,
      p.schemaname,
      p.tablename,
      CASE WHEN new_qual IS NULL THEN '' ELSE ' USING (' || new_qual || ')' END,
      CASE WHEN new_check IS NULL THEN '' ELSE ' WITH CHECK (' || new_check || ')' END
    );
  END LOOP;
END
$$;
