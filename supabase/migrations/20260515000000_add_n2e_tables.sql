-- Neverness to Everness tracked characters table

CREATE TABLE n2e_tracked_characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  character_id TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1,
  awakening_slots BOOLEAN[] NOT NULL DEFAULT ARRAY[false, false, false, false, false, false],
  resonance_count INTEGER NOT NULL DEFAULT 0,
  arc_id TEXT,
  arc_level INTEGER NOT NULL DEFAULT 1,
  arc_tier INTEGER NOT NULL DEFAULT 1,
  cartridge_rarity TEXT,
  cartridge_level INTEGER NOT NULL DEFAULT 0,
  cartridge_main_stat TEXT,
  cartridge_sub_stats TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  is_favorited BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(profile_id, character_id)
);

ALTER TABLE n2e_tracked_characters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own n2e characters" ON n2e_tracked_characters
    FOR SELECT USING (profile_id = auth.uid()::text);

CREATE POLICY "Users can insert own n2e characters" ON n2e_tracked_characters
    FOR INSERT WITH CHECK (profile_id = auth.uid()::text);

CREATE POLICY "Users can update own n2e characters" ON n2e_tracked_characters
    FOR UPDATE USING (profile_id = auth.uid()::text)
    WITH CHECK (profile_id = auth.uid()::text);

CREATE POLICY "Users can delete own n2e characters" ON n2e_tracked_characters
    FOR DELETE USING (profile_id = auth.uid()::text);

CREATE INDEX idx_n2e_tracked_characters_profile_id ON n2e_tracked_characters(profile_id);

-- Neverness to Everness party tables

CREATE TABLE n2e_parties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    notes TEXT,
    tier TEXT,
    is_favorited BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE n2e_party_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    party_id UUID NOT NULL REFERENCES n2e_parties(id) ON DELETE CASCADE,
    character_id TEXT NOT NULL,
    slot_index INTEGER NOT NULL CHECK (slot_index >= 0 AND slot_index <= 3),
    UNIQUE(party_id, slot_index)
);

ALTER TABLE n2e_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE n2e_party_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own n2e parties" ON n2e_parties
    FOR SELECT USING (profile_id = auth.uid()::text);

CREATE POLICY "Users can insert own n2e parties" ON n2e_parties
    FOR INSERT WITH CHECK (profile_id = auth.uid()::text);

CREATE POLICY "Users can update own n2e parties" ON n2e_parties
    FOR UPDATE USING (profile_id = auth.uid()::text)
    WITH CHECK (profile_id = auth.uid()::text);

CREATE POLICY "Users can delete own n2e parties" ON n2e_parties
    FOR DELETE USING (profile_id = auth.uid()::text);

CREATE POLICY "Users can view own n2e party members" ON n2e_party_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM n2e_parties
            WHERE n2e_parties.id = n2e_party_members.party_id
            AND n2e_parties.profile_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can insert own n2e party members" ON n2e_party_members
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM n2e_parties
            WHERE n2e_parties.id = n2e_party_members.party_id
            AND n2e_parties.profile_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can update own n2e party members" ON n2e_party_members
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM n2e_parties
            WHERE n2e_parties.id = n2e_party_members.party_id
            AND n2e_parties.profile_id = auth.uid()::text
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM n2e_parties
            WHERE n2e_parties.id = n2e_party_members.party_id
            AND n2e_parties.profile_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can delete own n2e party members" ON n2e_party_members
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM n2e_parties
            WHERE n2e_parties.id = n2e_party_members.party_id
            AND n2e_parties.profile_id = auth.uid()::text
        )
    );

CREATE INDEX idx_n2e_parties_profile_id ON n2e_parties(profile_id);
CREATE INDEX idx_n2e_party_members_party_id ON n2e_party_members(party_id);
