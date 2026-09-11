-- Atomic equipped-slot upsert (item row + substat rows) via one RPC.
--
-- upsertRelic (HSR) and upsertDisc (ZZZ) each ran three sequential PostgREST
-- calls: upsert the slot row returning its id, delete its substat rows, insert
-- the new substat rows — no transaction, so a failure between the delete and
-- the insert left the slot with no substats. This function performs the same
-- steps inside one statement and returns the slot row id.
--
-- SECURITY INVOKER keeps the caller's RLS in force. Table and column names are
-- data (two games share the shape) and go through the same assert_game_table
-- allowlist and %I quoting as replace_preference_rows.

-- p_table:            equipped-item table, e.g. hsr_equipped_relics
-- p_row:              the slot row's columns, including its FK to the tracked row and the slot key
-- p_conflict_columns: the unique key the upsert resolves on, e.g. {tracked_character_id, slot}
-- p_substat_table:    child substat table, e.g. hsr_relic_substats
-- p_substat_fk:       the child column that references the slot row id, e.g. relic_id
-- p_substats:         child rows WITHOUT the FK; it is filled in from the upserted id
CREATE OR REPLACE FUNCTION upsert_equipment_slot(
  p_table text,
  p_row jsonb,
  p_conflict_columns text[],
  p_substat_table text,
  p_substat_fk text,
  p_substats jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  cols text;
  set_clause text;
  conflict_cols text;
  slot_id uuid;
  child_rows jsonb;
BEGIN
  PERFORM assert_game_table(p_table);
  PERFORM assert_game_table(p_substat_table);

  IF p_row IS NULL OR jsonb_typeof(p_row) <> 'object' THEN
    RAISE EXCEPTION 'p_row must be a JSON object' USING ERRCODE = '22023';
  END IF;
  IF p_conflict_columns IS NULL OR cardinality(p_conflict_columns) = 0 THEN
    RAISE EXCEPTION 'p_conflict_columns must name at least one column' USING ERRCODE = '22023';
  END IF;

  SELECT string_agg(format('%I', k), ', '), string_agg(format('%I = EXCLUDED.%I', k, k), ', ')
    INTO cols, set_clause
    FROM jsonb_object_keys(p_row) k;
  SELECT string_agg(format('%I', c), ', ') INTO conflict_cols FROM unnest(p_conflict_columns) c;

  EXECUTE format(
    'INSERT INTO %I (%s) SELECT %s FROM jsonb_populate_record(NULL::%I, $1) '
    || 'ON CONFLICT (%s) DO UPDATE SET %s RETURNING id',
    p_table, cols, cols, p_table, conflict_cols, set_clause
  ) INTO slot_id USING p_row;

  EXECUTE format('DELETE FROM %I WHERE %I = $1', p_substat_table, p_substat_fk) USING slot_id;

  IF p_substats IS NOT NULL AND jsonb_typeof(p_substats) = 'array' AND jsonb_array_length(p_substats) > 0 THEN
    SELECT jsonb_agg(e || jsonb_build_object(p_substat_fk, slot_id))
      INTO child_rows
      FROM jsonb_array_elements(p_substats) e;
    PERFORM insert_json_rows(p_substat_table, child_rows);
  END IF;

  RETURN slot_id;
END;
$$;

REVOKE ALL ON FUNCTION upsert_equipment_slot(text, jsonb, text[], text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION upsert_equipment_slot(text, jsonb, text[], text, text, jsonb) TO authenticated;
