-- Atomic replacement of preference rows via one RPC.
--
-- savePreferenceRows in src/services/rosterPersistence.ts used to issue up to
-- five sequential PostgREST calls (delete per child table, parent update,
-- insert per child table) with no transaction — the "non-atomic preference
-- saves" entry in CLAUDE.md Known Limitations. A failure between the delete
-- and the insert left the rows half-wiped. This function does the same steps
-- inside one statement, so they commit or roll back together, and the client
-- pays one round trip instead of five.
--
-- SECURITY INVOKER: it runs as the calling role, so every table access still
-- goes through the caller's RLS policies exactly as the direct calls did.
-- Table names arrive as data because the shape is shared by four games; they
-- are validated against an allowlist of game-prefixed public tables and
-- quoted with %I, so no untrusted SQL is ever assembled.

-- Reject anything that is not an existing public table with a game prefix.
CREATE OR REPLACE FUNCTION assert_game_table(p_table text)
RETURNS void
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF p_table IS NULL
     OR p_table !~ '^(hsr|r1999|n2e|ae|p5x|zzz)_[a-z0-9_]+$'
     OR to_regclass(format('public.%I', p_table)) IS NULL THEN
    RAISE EXCEPTION 'not a game table: %', p_table USING ERRCODE = '42P01';
  END IF;
END;
$$;

-- Insert the given jsonb array of rows into p_table, writing only the columns
-- the rows actually carry so column defaults (id, created_at) still apply.
CREATE OR REPLACE FUNCTION insert_json_rows(p_table text, p_rows jsonb)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  cols text;
BEGIN
  PERFORM assert_game_table(p_table);
  IF p_rows IS NULL OR jsonb_typeof(p_rows) <> 'array' OR jsonb_array_length(p_rows) = 0 THEN
    RETURN;
  END IF;

  SELECT string_agg(format('%I', k), ', ')
    INTO cols
    FROM (SELECT DISTINCT jsonb_object_keys(e) AS k FROM jsonb_array_elements(p_rows) e) keys;

  EXECUTE format(
    'INSERT INTO %I (%s) SELECT %s FROM jsonb_populate_recordset(NULL::%I, $1)',
    p_table, cols, cols, p_table
  ) USING p_rows;
END;
$$;

-- p_delete_from:   [{"table": "...", "fk_column": "..."}]  rows where fk = parent id are removed
-- p_parent_update: {"table": "...", "row": {...}} or null   columns applied to the parent by id
-- p_inserts:       [{"table": "...", "rows": [{...}]}]      ordered rows to insert (fk included)
CREATE OR REPLACE FUNCTION replace_preference_rows(
  p_parent_id uuid,
  p_delete_from jsonb,
  p_parent_update jsonb,
  p_inserts jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  affected integer;
  target jsonb;
  parent_table text;
  set_clause text;
BEGIN
  FOR target IN SELECT * FROM jsonb_array_elements(coalesce(p_delete_from, '[]'::jsonb)) LOOP
    PERFORM assert_game_table(target->>'table');
    EXECUTE format('DELETE FROM %I WHERE %I = $1', target->>'table', target->>'fk_column')
      USING p_parent_id;
  END LOOP;

  IF p_parent_update IS NOT NULL AND jsonb_typeof(p_parent_update) = 'object' THEN
    parent_table := p_parent_update->>'table';
    PERFORM assert_game_table(parent_table);
    SELECT string_agg(format('%I = r.%I', k, k), ', ')
      INTO set_clause
      FROM jsonb_object_keys(p_parent_update->'row') k;
    IF set_clause IS NOT NULL THEN
      EXECUTE format(
        'UPDATE %I t SET %s FROM jsonb_populate_record(NULL::%I, $1) r WHERE t.id = $2',
        parent_table, set_clause, parent_table
      ) USING p_parent_update->'row', p_parent_id;
      GET DIAGNOSTICS affected = ROW_COUNT;
      IF affected = 0 THEN
        RAISE EXCEPTION 'parent row % not found in %', p_parent_id, parent_table
          USING ERRCODE = 'P0002';
      END IF;
    END IF;
  END IF;

  FOR target IN SELECT * FROM jsonb_array_elements(coalesce(p_inserts, '[]'::jsonb)) LOOP
    PERFORM insert_json_rows(target->>'table', target->'rows');
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION assert_game_table(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION insert_json_rows(text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION replace_preference_rows(uuid, jsonb, jsonb, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION replace_preference_rows(uuid, jsonb, jsonb, jsonb) TO authenticated;
-- The helpers are only reachable through the RPC entry points, which is why
-- authenticated gets EXECUTE on them too (plpgsql resolves grants per call).
GRANT EXECUTE ON FUNCTION assert_game_table(text) TO authenticated;
GRANT EXECUTE ON FUNCTION insert_json_rows(text, jsonb) TO authenticated;
