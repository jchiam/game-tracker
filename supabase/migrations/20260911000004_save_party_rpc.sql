-- Atomic party save (party row + member rows) via one RPC.
--
-- createPartyPersistence's saveParty ran the party insert/update, the member
-- delete, and the member insert as three sequential PostgREST calls with no
-- transaction — the last "non-atomic" write in CLAUDE.md Known Limitations. A
-- failure between the member delete and reinsert left the party empty. This
-- function performs the same steps inside one statement and returns the
-- party id, so the client pays one round trip and the save is all-or-nothing.
--
-- SECURITY INVOKER keeps the caller's RLS in force: an update to a party the
-- caller does not own matches no row and raises. Table names go through the
-- same assert_game_table allowlist and %I quoting as the other RPCs.

-- p_parties_table: e.g. hsr_parties
-- p_members_table: e.g. hsr_party_members
-- p_profile_id:    owner id written on create; ignored on update (RLS scopes the row)
-- p_party_id:      null to create, else the party row to update
-- p_party_row:     name/notes plus any game extras (tier, bangboo_id, …)
-- p_members:       member rows WITHOUT party_id; it is filled in from the saved id
CREATE OR REPLACE FUNCTION save_party(
  p_parties_table text,
  p_members_table text,
  p_profile_id text,
  p_party_id uuid,
  p_party_row jsonb,
  p_members jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  affected integer;
  cols text;
  set_clause text;
  party_id uuid;
  member_rows jsonb;
BEGIN
  PERFORM assert_game_table(p_parties_table);
  PERFORM assert_game_table(p_members_table);

  IF p_party_row IS NULL OR jsonb_typeof(p_party_row) <> 'object' THEN
    RAISE EXCEPTION 'p_party_row must be a JSON object' USING ERRCODE = '22023';
  END IF;

  IF p_party_id IS NULL THEN
    SELECT string_agg(format('%I', k), ', ')
      INTO cols
      FROM jsonb_object_keys(p_party_row || jsonb_build_object('profile_id', p_profile_id)) k;
    EXECUTE format(
      'INSERT INTO %I (%s) SELECT %s FROM jsonb_populate_record(NULL::%I, $1) RETURNING id',
      p_parties_table, cols, cols, p_parties_table
    ) INTO party_id USING p_party_row || jsonb_build_object('profile_id', p_profile_id);
  ELSE
    SELECT string_agg(format('%I = r.%I', k, k), ', ')
      INTO set_clause
      FROM jsonb_object_keys(p_party_row) k;
    EXECUTE format(
      'UPDATE %I t SET %s FROM jsonb_populate_record(NULL::%I, $1) r WHERE t.id = $2',
      p_parties_table, set_clause, p_parties_table
    ) USING p_party_row, p_party_id;
    GET DIAGNOSTICS affected = ROW_COUNT;
    IF affected = 0 THEN
      RAISE EXCEPTION 'party % not found in %', p_party_id, p_parties_table
        USING ERRCODE = 'P0002';
    END IF;
    party_id := p_party_id;
    EXECUTE format('DELETE FROM %I WHERE party_id = $1', p_members_table) USING party_id;
  END IF;

  IF p_members IS NOT NULL AND jsonb_typeof(p_members) = 'array' AND jsonb_array_length(p_members) > 0 THEN
    SELECT jsonb_agg(e || jsonb_build_object('party_id', party_id))
      INTO member_rows
      FROM jsonb_array_elements(p_members) e;
    PERFORM insert_json_rows(p_members_table, member_rows);
  END IF;

  RETURN party_id;
END;
$$;

REVOKE ALL ON FUNCTION save_party(text, text, text, uuid, jsonb, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION save_party(text, text, text, uuid, jsonb, jsonb) TO authenticated;
