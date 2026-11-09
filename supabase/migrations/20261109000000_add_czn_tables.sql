-- Chaos Zero Nightmare tracked combatants, parties, and party members.

-- Tracked combatants
CREATE TABLE czn_tracked_combatants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  combatant_id TEXT NOT NULL,
  -- 62 = base cap 60 + 2 from Unconscious Awakening; the slider max is paired with this CHECK.
  level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1 AND level <= 62),
  -- Manifest Ego rank: 0 base, 1–6 dupe unlocks (shown as T0–T6).
  ego INTEGER NOT NULL DEFAULT 0 CHECK (ego >= 0 AND ego <= 6),
  -- Whole Potential tree unlocked (HSR traces_attained shape); nodes are not tracked.
  potential_attained BOOLEAN NOT NULL DEFAULT false,
  is_favorited BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (profile_id, combatant_id)
);

CREATE INDEX idx_czn_tracked_combatants_profile ON czn_tracked_combatants(profile_id);

ALTER TABLE czn_tracked_combatants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tracked combatants"
  ON czn_tracked_combatants FOR SELECT
  USING (profile_id = auth.uid()::text);

CREATE POLICY "Users can insert own tracked combatants"
  ON czn_tracked_combatants FOR INSERT
  WITH CHECK (profile_id = auth.uid()::text);

CREATE POLICY "Users can update own tracked combatants"
  ON czn_tracked_combatants FOR UPDATE
  USING (profile_id = auth.uid()::text);

CREATE POLICY "Users can delete own tracked combatants"
  ON czn_tracked_combatants FOR DELETE
  USING (profile_id = auth.uid()::text);

-- Parties
CREATE TABLE czn_parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'New Party',
  notes TEXT,
  tier TEXT,
  is_favorited BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_czn_parties_profile ON czn_parties(profile_id);

ALTER TABLE czn_parties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own parties"
  ON czn_parties FOR SELECT
  USING (profile_id = auth.uid()::text);

CREATE POLICY "Users can insert own parties"
  ON czn_parties FOR INSERT
  WITH CHECK (profile_id = auth.uid()::text);

CREATE POLICY "Users can update own parties"
  ON czn_parties FOR UPDATE
  USING (profile_id = auth.uid()::text);

CREATE POLICY "Users can delete own parties"
  ON czn_parties FOR DELETE
  USING (profile_id = auth.uid()::text);

-- Party members (3-combatant teams: slots 0-2)
CREATE TABLE czn_party_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID NOT NULL REFERENCES czn_parties(id) ON DELETE CASCADE,
  combatant_id TEXT NOT NULL,
  slot_index INTEGER NOT NULL CHECK (slot_index >= 0 AND slot_index <= 2),
  UNIQUE (party_id, slot_index)
);

CREATE INDEX idx_czn_party_members_party ON czn_party_members(party_id);

ALTER TABLE czn_party_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own party members"
  ON czn_party_members FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM czn_parties WHERE id = party_id AND profile_id = auth.uid()::text
  ));

CREATE POLICY "Users can insert own party members"
  ON czn_party_members FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM czn_parties WHERE id = party_id AND profile_id = auth.uid()::text
  ));

CREATE POLICY "Users can update own party members"
  ON czn_party_members FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM czn_parties WHERE id = party_id AND profile_id = auth.uid()::text
  ));

CREATE POLICY "Users can delete own party members"
  ON czn_party_members FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM czn_parties WHERE id = party_id AND profile_id = auth.uid()::text
  ));

-- RPC allowlist: save_party (and the other multi-row RPCs) gate every table
-- name through assert_game_table, whose regex enumerates the game prefixes.
-- Without `czn` here, saving a CZN party fails with "not a game table".
-- Same body as 20260911000002, plus the prefix; search_path pinned as in
-- 20261031000000 and the REVOKE/GRANT pair re-applied.
CREATE OR REPLACE FUNCTION assert_game_table(p_table text)
RETURNS void
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  IF p_table IS NULL
     OR p_table !~ '^(hsr|r1999|n2e|ae|p5x|zzz|czn)_[a-z0-9_]+$'
     OR to_regclass(format('public.%I', p_table)) IS NULL THEN
    RAISE EXCEPTION 'not a game table: %', p_table USING ERRCODE = '42P01';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION assert_game_table(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION assert_game_table(text) TO authenticated;
