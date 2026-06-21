-- Arknights: Endfield tracked operators, parties, and party members.

-- Tracked operators
CREATE TABLE endfield_tracked_operators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  operator_id TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1,
  potential INTEGER NOT NULL DEFAULT 0,
  is_favorited BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (profile_id, operator_id)
);

CREATE INDEX idx_endfield_tracked_operators_profile ON endfield_tracked_operators(profile_id);

ALTER TABLE endfield_tracked_operators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tracked operators"
  ON endfield_tracked_operators FOR SELECT
  USING (profile_id = auth.uid()::text);

CREATE POLICY "Users can insert own tracked operators"
  ON endfield_tracked_operators FOR INSERT
  WITH CHECK (profile_id = auth.uid()::text);

CREATE POLICY "Users can update own tracked operators"
  ON endfield_tracked_operators FOR UPDATE
  USING (profile_id = auth.uid()::text);

CREATE POLICY "Users can delete own tracked operators"
  ON endfield_tracked_operators FOR DELETE
  USING (profile_id = auth.uid()::text);

-- Parties
CREATE TABLE endfield_parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'New Squad',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_endfield_parties_profile ON endfield_parties(profile_id);

ALTER TABLE endfield_parties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own parties"
  ON endfield_parties FOR SELECT
  USING (profile_id = auth.uid()::text);

CREATE POLICY "Users can insert own parties"
  ON endfield_parties FOR INSERT
  WITH CHECK (profile_id = auth.uid()::text);

CREATE POLICY "Users can update own parties"
  ON endfield_parties FOR UPDATE
  USING (profile_id = auth.uid()::text);

CREATE POLICY "Users can delete own parties"
  ON endfield_parties FOR DELETE
  USING (profile_id = auth.uid()::text);

-- Party members
CREATE TABLE endfield_party_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID NOT NULL REFERENCES endfield_parties(id) ON DELETE CASCADE,
  operator_id TEXT NOT NULL,
  slot_index INTEGER NOT NULL CHECK (slot_index >= 0 AND slot_index <= 3),
  UNIQUE (party_id, slot_index)
);

CREATE INDEX idx_endfield_party_members_party ON endfield_party_members(party_id);

ALTER TABLE endfield_party_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own party members"
  ON endfield_party_members FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM endfield_parties WHERE id = party_id AND profile_id = auth.uid()::text
  ));

CREATE POLICY "Users can insert own party members"
  ON endfield_party_members FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM endfield_parties WHERE id = party_id AND profile_id = auth.uid()::text
  ));

CREATE POLICY "Users can update own party members"
  ON endfield_party_members FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM endfield_parties WHERE id = party_id AND profile_id = auth.uid()::text
  ));

CREATE POLICY "Users can delete own party members"
  ON endfield_party_members FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM endfield_parties WHERE id = party_id AND profile_id = auth.uid()::text
  ));
