-- Reverse: 1999 lineup/party configuration tables

CREATE TABLE r1999_parties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE r1999_party_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    party_id UUID NOT NULL REFERENCES r1999_parties(id) ON DELETE CASCADE,
    arcanist_id TEXT NOT NULL,
    slot_index INTEGER NOT NULL CHECK (slot_index >= 0 AND slot_index <= 3),
    UNIQUE(party_id, slot_index)
);

ALTER TABLE r1999_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE r1999_party_members ENABLE ROW LEVEL SECURITY;

-- r1999_parties: user-scoped policies
CREATE POLICY "Users can view own r1999 parties" ON r1999_parties
    FOR SELECT USING (profile_id = auth.uid()::text);

CREATE POLICY "Users can insert own r1999 parties" ON r1999_parties
    FOR INSERT WITH CHECK (profile_id = auth.uid()::text);

CREATE POLICY "Users can update own r1999 parties" ON r1999_parties
    FOR UPDATE USING (profile_id = auth.uid()::text)
    WITH CHECK (profile_id = auth.uid()::text);

CREATE POLICY "Users can delete own r1999 parties" ON r1999_parties
    FOR DELETE USING (profile_id = auth.uid()::text);

-- r1999_party_members: access via party ownership
CREATE POLICY "Users can view own r1999 party members" ON r1999_party_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM r1999_parties
            WHERE r1999_parties.id = r1999_party_members.party_id
            AND r1999_parties.profile_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can insert own r1999 party members" ON r1999_party_members
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM r1999_parties
            WHERE r1999_parties.id = r1999_party_members.party_id
            AND r1999_parties.profile_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can update own r1999 party members" ON r1999_party_members
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM r1999_parties
            WHERE r1999_parties.id = r1999_party_members.party_id
            AND r1999_parties.profile_id = auth.uid()::text
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM r1999_parties
            WHERE r1999_parties.id = r1999_party_members.party_id
            AND r1999_parties.profile_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can delete own r1999 party members" ON r1999_party_members
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM r1999_parties
            WHERE r1999_parties.id = r1999_party_members.party_id
            AND r1999_parties.profile_id = auth.uid()::text
        )
    );

-- Indexes
CREATE INDEX idx_r1999_parties_profile_id ON r1999_parties(profile_id);
CREATE INDEX idx_r1999_party_members_party_id ON r1999_party_members(party_id);
