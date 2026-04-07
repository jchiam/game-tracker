-- Migration: Fix Row Level Security (RLS) policies to enforce user isolation
-- This replaces the insecure "Allow anonymous access" policies with proper user-scoped policies.

-- =============================================================================
-- user_profiles: Users can only read/update their own profile
-- Note: user_profiles.id is TEXT, so we cast auth.uid() to text
-- =============================================================================
DROP POLICY IF EXISTS "Allow anonymous access" ON user_profiles;

CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT
  USING (id = auth.uid()::text);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT
  WITH CHECK (id = auth.uid()::text);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE
  USING (id = auth.uid()::text)
  WITH CHECK (id = auth.uid()::text);

CREATE POLICY "Users can delete own profile" ON user_profiles
  FOR DELETE
  USING (id = auth.uid()::text);

-- =============================================================================
-- hsr_tracked_characters: Users can only access their own tracked characters
-- =============================================================================
DROP POLICY IF EXISTS "Allow anonymous access" ON hsr_tracked_characters;

CREATE POLICY "Users can view own tracked characters" ON hsr_tracked_characters
  FOR SELECT
  USING (profile_id = auth.uid()::text);

CREATE POLICY "Users can insert own tracked characters" ON hsr_tracked_characters
  FOR INSERT
  WITH CHECK (profile_id = auth.uid()::text);

CREATE POLICY "Users can update own tracked characters" ON hsr_tracked_characters
  FOR UPDATE
  USING (profile_id = auth.uid()::text)
  WITH CHECK (profile_id = auth.uid()::text);

CREATE POLICY "Users can delete own tracked characters" ON hsr_tracked_characters
  FOR DELETE
  USING (profile_id = auth.uid()::text);

-- =============================================================================
-- hsr_equipped_relics: Access via character ownership (join through tracked_characters)
-- =============================================================================
DROP POLICY IF EXISTS "Allow anonymous access" ON hsr_equipped_relics;

CREATE POLICY "Users can view own relics" ON hsr_equipped_relics
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM hsr_tracked_characters
      WHERE hsr_tracked_characters.id = hsr_equipped_relics.tracked_character_id
      AND hsr_tracked_characters.profile_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can insert own relics" ON hsr_equipped_relics
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hsr_tracked_characters
      WHERE hsr_tracked_characters.id = hsr_equipped_relics.tracked_character_id
      AND hsr_tracked_characters.profile_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can update own relics" ON hsr_equipped_relics
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM hsr_tracked_characters
      WHERE hsr_tracked_characters.id = hsr_equipped_relics.tracked_character_id
      AND hsr_tracked_characters.profile_id = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hsr_tracked_characters
      WHERE hsr_tracked_characters.id = hsr_equipped_relics.tracked_character_id
      AND hsr_tracked_characters.profile_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete own relics" ON hsr_equipped_relics
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM hsr_tracked_characters
      WHERE hsr_tracked_characters.id = hsr_equipped_relics.tracked_character_id
      AND hsr_tracked_characters.profile_id = auth.uid()::text
    )
  );

-- =============================================================================
-- hsr_relic_substats: Access via relic ownership (join through equipped_relics -> tracked_characters)
-- =============================================================================
DROP POLICY IF EXISTS "Allow anonymous access" ON hsr_relic_substats;

CREATE POLICY "Users can view own relic substats" ON hsr_relic_substats
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM hsr_equipped_relics
      JOIN hsr_tracked_characters ON hsr_tracked_characters.id = hsr_equipped_relics.tracked_character_id
      WHERE hsr_equipped_relics.id = hsr_relic_substats.relic_id
      AND hsr_tracked_characters.profile_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can insert own relic substats" ON hsr_relic_substats
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hsr_equipped_relics
      JOIN hsr_tracked_characters ON hsr_tracked_characters.id = hsr_equipped_relics.tracked_character_id
      WHERE hsr_equipped_relics.id = hsr_relic_substats.relic_id
      AND hsr_tracked_characters.profile_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can update own relic substats" ON hsr_relic_substats
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM hsr_equipped_relics
      JOIN hsr_tracked_characters ON hsr_tracked_characters.id = hsr_equipped_relics.tracked_character_id
      WHERE hsr_equipped_relics.id = hsr_relic_substats.relic_id
      AND hsr_tracked_characters.profile_id = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hsr_equipped_relics
      JOIN hsr_tracked_characters ON hsr_tracked_characters.id = hsr_equipped_relics.tracked_character_id
      WHERE hsr_equipped_relics.id = hsr_relic_substats.relic_id
      AND hsr_tracked_characters.profile_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete own relic substats" ON hsr_relic_substats
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM hsr_equipped_relics
      JOIN hsr_tracked_characters ON hsr_tracked_characters.id = hsr_equipped_relics.tracked_character_id
      WHERE hsr_equipped_relics.id = hsr_relic_substats.relic_id
      AND hsr_tracked_characters.profile_id = auth.uid()::text
    )
  );

-- =============================================================================
-- hsr_build_preference_main_stats: Access via character ownership
-- =============================================================================
DROP POLICY IF EXISTS "Allow anonymous access" ON hsr_build_preference_main_stats;

CREATE POLICY "Users can view own build preference main stats" ON hsr_build_preference_main_stats
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM hsr_tracked_characters
      WHERE hsr_tracked_characters.id = hsr_build_preference_main_stats.tracked_character_id
      AND hsr_tracked_characters.profile_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can insert own build preference main stats" ON hsr_build_preference_main_stats
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hsr_tracked_characters
      WHERE hsr_tracked_characters.id = hsr_build_preference_main_stats.tracked_character_id
      AND hsr_tracked_characters.profile_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can update own build preference main stats" ON hsr_build_preference_main_stats
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM hsr_tracked_characters
      WHERE hsr_tracked_characters.id = hsr_build_preference_main_stats.tracked_character_id
      AND hsr_tracked_characters.profile_id = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hsr_tracked_characters
      WHERE hsr_tracked_characters.id = hsr_build_preference_main_stats.tracked_character_id
      AND hsr_tracked_characters.profile_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete own build preference main stats" ON hsr_build_preference_main_stats
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM hsr_tracked_characters
      WHERE hsr_tracked_characters.id = hsr_build_preference_main_stats.tracked_character_id
      AND hsr_tracked_characters.profile_id = auth.uid()::text
    )
  );

-- =============================================================================
-- hsr_build_preference_sub_stats: Access via character ownership
-- =============================================================================
DROP POLICY IF EXISTS "Allow anonymous access" ON hsr_build_preference_sub_stats;

CREATE POLICY "Users can view own build preference sub stats" ON hsr_build_preference_sub_stats
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM hsr_tracked_characters
      WHERE hsr_tracked_characters.id = hsr_build_preference_sub_stats.tracked_character_id
      AND hsr_tracked_characters.profile_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can insert own build preference sub stats" ON hsr_build_preference_sub_stats
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hsr_tracked_characters
      WHERE hsr_tracked_characters.id = hsr_build_preference_sub_stats.tracked_character_id
      AND hsr_tracked_characters.profile_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can update own build preference sub stats" ON hsr_build_preference_sub_stats
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM hsr_tracked_characters
      WHERE hsr_tracked_characters.id = hsr_build_preference_sub_stats.tracked_character_id
      AND hsr_tracked_characters.profile_id = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hsr_tracked_characters
      WHERE hsr_tracked_characters.id = hsr_build_preference_sub_stats.tracked_character_id
      AND hsr_tracked_characters.profile_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete own build preference sub stats" ON hsr_build_preference_sub_stats
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM hsr_tracked_characters
      WHERE hsr_tracked_characters.id = hsr_build_preference_sub_stats.tracked_character_id
      AND hsr_tracked_characters.profile_id = auth.uid()::text
    )
  );

-- =============================================================================
-- hsr_parties: Users can only access their own parties
-- =============================================================================
DROP POLICY IF EXISTS "Allow anonymous access" ON hsr_parties;

CREATE POLICY "Users can view own parties" ON hsr_parties
  FOR SELECT
  USING (profile_id = auth.uid()::text);

CREATE POLICY "Users can insert own parties" ON hsr_parties
  FOR INSERT
  WITH CHECK (profile_id = auth.uid()::text);

CREATE POLICY "Users can update own parties" ON hsr_parties
  FOR UPDATE
  USING (profile_id = auth.uid()::text)
  WITH CHECK (profile_id = auth.uid()::text);

CREATE POLICY "Users can delete own parties" ON hsr_parties
  FOR DELETE
  USING (profile_id = auth.uid()::text);

-- =============================================================================
-- hsr_party_members: Access via party ownership
-- =============================================================================
DROP POLICY IF EXISTS "Allow anonymous access" ON hsr_party_members;

CREATE POLICY "Users can view own party members" ON hsr_party_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM hsr_parties
      WHERE hsr_parties.id = hsr_party_members.party_id
      AND hsr_parties.profile_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can insert own party members" ON hsr_party_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hsr_parties
      WHERE hsr_parties.id = hsr_party_members.party_id
      AND hsr_parties.profile_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can update own party members" ON hsr_party_members
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM hsr_parties
      WHERE hsr_parties.id = hsr_party_members.party_id
      AND hsr_parties.profile_id = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hsr_parties
      WHERE hsr_parties.id = hsr_party_members.party_id
      AND hsr_parties.profile_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete own party members" ON hsr_party_members
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM hsr_parties
      WHERE hsr_parties.id = hsr_party_members.party_id
      AND hsr_parties.profile_id = auth.uid()::text
    )
  );

-- =============================================================================
-- r1999_tracked_arcanists: Users can only access their own tracked arcanists
-- =============================================================================
DROP POLICY IF EXISTS "Allow anonymous access" ON r1999_tracked_arcanists;

CREATE POLICY "Users can view own tracked arcanists" ON r1999_tracked_arcanists
  FOR SELECT
  USING (profile_id = auth.uid()::text);

CREATE POLICY "Users can insert own tracked arcanists" ON r1999_tracked_arcanists
  FOR INSERT
  WITH CHECK (profile_id = auth.uid()::text);

CREATE POLICY "Users can update own tracked arcanists" ON r1999_tracked_arcanists
  FOR UPDATE
  USING (profile_id = auth.uid()::text)
  WITH CHECK (profile_id = auth.uid()::text);

CREATE POLICY "Users can delete own tracked arcanists" ON r1999_tracked_arcanists
  FOR DELETE
  USING (profile_id = auth.uid()::text);
