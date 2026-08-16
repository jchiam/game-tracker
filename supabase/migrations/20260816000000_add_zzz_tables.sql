-- Zenless Zone Zero tracked agents, parties, and party members.

-- Tracked agents
CREATE TABLE zzz_tracked_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1 AND level <= 60),
  mindscape INTEGER NOT NULL DEFAULT 0 CHECK (mindscape >= 0 AND mindscape <= 6),
  core_skill INTEGER NOT NULL DEFAULT 0 CHECK (core_skill >= 0 AND core_skill <= 6),
  is_favorited BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (profile_id, agent_id)
);

CREATE INDEX idx_zzz_tracked_agents_profile ON zzz_tracked_agents(profile_id);

ALTER TABLE zzz_tracked_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tracked agents"
  ON zzz_tracked_agents FOR SELECT
  USING (profile_id = auth.uid()::text);

CREATE POLICY "Users can insert own tracked agents"
  ON zzz_tracked_agents FOR INSERT
  WITH CHECK (profile_id = auth.uid()::text);

CREATE POLICY "Users can update own tracked agents"
  ON zzz_tracked_agents FOR UPDATE
  USING (profile_id = auth.uid()::text);

CREATE POLICY "Users can delete own tracked agents"
  ON zzz_tracked_agents FOR DELETE
  USING (profile_id = auth.uid()::text);

-- Parties
CREATE TABLE zzz_parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'New Party',
  notes TEXT,
  tier TEXT,
  is_favorited BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_zzz_parties_profile ON zzz_parties(profile_id);

ALTER TABLE zzz_parties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own parties"
  ON zzz_parties FOR SELECT
  USING (profile_id = auth.uid()::text);

CREATE POLICY "Users can insert own parties"
  ON zzz_parties FOR INSERT
  WITH CHECK (profile_id = auth.uid()::text);

CREATE POLICY "Users can update own parties"
  ON zzz_parties FOR UPDATE
  USING (profile_id = auth.uid()::text);

CREATE POLICY "Users can delete own parties"
  ON zzz_parties FOR DELETE
  USING (profile_id = auth.uid()::text);

-- Party members (3-agent squads: slots 0-2)
CREATE TABLE zzz_party_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID NOT NULL REFERENCES zzz_parties(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  slot_index INTEGER NOT NULL CHECK (slot_index >= 0 AND slot_index <= 2),
  UNIQUE (party_id, slot_index)
);

CREATE INDEX idx_zzz_party_members_party ON zzz_party_members(party_id);

ALTER TABLE zzz_party_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own party members"
  ON zzz_party_members FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM zzz_parties WHERE id = party_id AND profile_id = auth.uid()::text
  ));

CREATE POLICY "Users can insert own party members"
  ON zzz_party_members FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM zzz_parties WHERE id = party_id AND profile_id = auth.uid()::text
  ));

CREATE POLICY "Users can update own party members"
  ON zzz_party_members FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM zzz_parties WHERE id = party_id AND profile_id = auth.uid()::text
  ));

CREATE POLICY "Users can delete own party members"
  ON zzz_party_members FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM zzz_parties WHERE id = party_id AND profile_id = auth.uid()::text
  ));
