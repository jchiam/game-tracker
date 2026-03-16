-- Migration: Add party configuration tables

CREATE TABLE hsr_parties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE hsr_party_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    party_id UUID NOT NULL REFERENCES hsr_parties(id) ON DELETE CASCADE,
    character_id TEXT NOT NULL, -- The string ID from characters.json
    slot_index INTEGER NOT NULL CHECK (slot_index >= 0 AND slot_index <= 3),
    UNIQUE(party_id, slot_index)
);

-- RLS
ALTER TABLE hsr_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE hsr_party_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous access" ON hsr_parties FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anonymous access" ON hsr_party_members FOR ALL USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX idx_hsr_parties_profile_id ON hsr_parties(profile_id);
CREATE INDEX idx_hsr_party_members_party_id ON hsr_party_members(party_id);
