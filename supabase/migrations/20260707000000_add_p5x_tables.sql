-- Persona 5: The Phantom X (P5X) tracked thieves, parties, and party members.

-- Tracked thieves
CREATE TABLE p5x_tracked_thieves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  thief_id TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1 AND level <= 80),
  awareness INTEGER NOT NULL DEFAULT 0 CHECK (awareness >= 0 AND awareness <= 6),
  is_favorited BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (profile_id, thief_id)
);

CREATE INDEX idx_p5x_tracked_thieves_profile ON p5x_tracked_thieves(profile_id);

ALTER TABLE p5x_tracked_thieves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tracked thieves"
  ON p5x_tracked_thieves FOR SELECT
  USING (profile_id = auth.uid()::text);

CREATE POLICY "Users can insert own tracked thieves"
  ON p5x_tracked_thieves FOR INSERT
  WITH CHECK (profile_id = auth.uid()::text);

CREATE POLICY "Users can update own tracked thieves"
  ON p5x_tracked_thieves FOR UPDATE
  USING (profile_id = auth.uid()::text);

CREATE POLICY "Users can delete own tracked thieves"
  ON p5x_tracked_thieves FOR DELETE
  USING (profile_id = auth.uid()::text);

-- Parties
CREATE TABLE p5x_parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'New Team',
  notes TEXT,
  tier TEXT,
  is_favorited BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_p5x_parties_profile ON p5x_parties(profile_id);

ALTER TABLE p5x_parties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own parties"
  ON p5x_parties FOR SELECT
  USING (profile_id = auth.uid()::text);

CREATE POLICY "Users can insert own parties"
  ON p5x_parties FOR INSERT
  WITH CHECK (profile_id = auth.uid()::text);

CREATE POLICY "Users can update own parties"
  ON p5x_parties FOR UPDATE
  USING (profile_id = auth.uid()::text);

CREATE POLICY "Users can delete own parties"
  ON p5x_parties FOR DELETE
  USING (profile_id = auth.uid()::text);

-- Party members
CREATE TABLE p5x_party_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID NOT NULL REFERENCES p5x_parties(id) ON DELETE CASCADE,
  thief_id TEXT NOT NULL,
  slot_index INTEGER NOT NULL CHECK (slot_index >= 0 AND slot_index <= 3),
  UNIQUE (party_id, slot_index)
);

CREATE INDEX idx_p5x_party_members_party ON p5x_party_members(party_id);

ALTER TABLE p5x_party_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own party members"
  ON p5x_party_members FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM p5x_parties WHERE id = party_id AND profile_id = auth.uid()::text
  ));

CREATE POLICY "Users can insert own party members"
  ON p5x_party_members FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM p5x_parties WHERE id = party_id AND profile_id = auth.uid()::text
  ));

CREATE POLICY "Users can update own party members"
  ON p5x_party_members FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM p5x_parties WHERE id = party_id AND profile_id = auth.uid()::text
  ));

CREATE POLICY "Users can delete own party members"
  ON p5x_party_members FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM p5x_parties WHERE id = party_id AND profile_id = auth.uid()::text
  ));
