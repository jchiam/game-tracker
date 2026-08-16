-- Zenless Zone Zero Drive Discs (Phase 2): equipped discs, disc substats,
-- disc build-preference rows, and target-suit/comments columns on the
-- tracked-agents parent.

-- Suit picks and comments live on the parent row (single-select scalars);
-- preference chains live in zzz_disc_preferences.
ALTER TABLE zzz_tracked_agents
  ADD COLUMN disc_suit_4_id TEXT,
  ADD COLUMN disc_suit_2_id TEXT,
  ADD COLUMN disc_comments TEXT;

-- Equipped discs (one row per agent+slot; slots 1-3 fixed mains, 4-6 variable)
CREATE TABLE zzz_equipped_discs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracked_agent_id UUID NOT NULL REFERENCES zzz_tracked_agents(id) ON DELETE CASCADE,
  slot INTEGER NOT NULL CHECK (slot >= 1 AND slot <= 6),
  suit_id TEXT,
  main_stat TEXT,
  UNIQUE (tracked_agent_id, slot)
);

CREATE INDEX idx_zzz_equipped_discs_agent ON zzz_equipped_discs(tracked_agent_id);

ALTER TABLE zzz_equipped_discs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own equipped discs"
  ON zzz_equipped_discs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM zzz_tracked_agents WHERE id = tracked_agent_id AND profile_id = auth.uid()::text
  ));

CREATE POLICY "Users can insert own equipped discs"
  ON zzz_equipped_discs FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM zzz_tracked_agents WHERE id = tracked_agent_id AND profile_id = auth.uid()::text
  ));

CREATE POLICY "Users can update own equipped discs"
  ON zzz_equipped_discs FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM zzz_tracked_agents WHERE id = tracked_agent_id AND profile_id = auth.uid()::text
  ));

CREATE POLICY "Users can delete own equipped discs"
  ON zzz_equipped_discs FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM zzz_tracked_agents WHERE id = tracked_agent_id AND profile_id = auth.uid()::text
  ));

-- Disc substats (stat types only, no numeric values — HSR precedent)
CREATE TABLE zzz_disc_substats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disc_id UUID NOT NULL REFERENCES zzz_equipped_discs(id) ON DELETE CASCADE,
  stat_type TEXT NOT NULL
);

CREATE INDEX idx_zzz_disc_substats_disc ON zzz_disc_substats(disc_id);

ALTER TABLE zzz_disc_substats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own disc substats"
  ON zzz_disc_substats FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM zzz_equipped_discs d
    JOIN zzz_tracked_agents a ON a.id = d.tracked_agent_id
    WHERE d.id = disc_id AND a.profile_id = auth.uid()::text
  ));

CREATE POLICY "Users can insert own disc substats"
  ON zzz_disc_substats FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM zzz_equipped_discs d
    JOIN zzz_tracked_agents a ON a.id = d.tracked_agent_id
    WHERE d.id = disc_id AND a.profile_id = auth.uid()::text
  ));

CREATE POLICY "Users can update own disc substats"
  ON zzz_disc_substats FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM zzz_equipped_discs d
    JOIN zzz_tracked_agents a ON a.id = d.tracked_agent_id
    WHERE d.id = disc_id AND a.profile_id = auth.uid()::text
  ));

CREATE POLICY "Users can delete own disc substats"
  ON zzz_disc_substats FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM zzz_equipped_discs d
    JOIN zzz_tracked_agents a ON a.id = d.tracked_agent_id
    WHERE d.id = disc_id AND a.profile_id = auth.uid()::text
  ));

-- Disc build-preference chains (single-table category shape, P5X precedent)
CREATE TABLE zzz_disc_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracked_agent_id UUID NOT NULL REFERENCES zzz_tracked_agents(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('slot4_main', 'slot5_main', 'slot6_main', 'sub_stats')),
  stat TEXT NOT NULL,
  operator_to_next TEXT CHECK (operator_to_next IN ('>', '>=', 'OR')),
  order_index INTEGER NOT NULL
);

CREATE INDEX idx_zzz_disc_preferences_agent ON zzz_disc_preferences(tracked_agent_id);

ALTER TABLE zzz_disc_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own disc preferences"
  ON zzz_disc_preferences FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM zzz_tracked_agents WHERE id = tracked_agent_id AND profile_id = auth.uid()::text
  ));

CREATE POLICY "Users can insert own disc preferences"
  ON zzz_disc_preferences FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM zzz_tracked_agents WHERE id = tracked_agent_id AND profile_id = auth.uid()::text
  ));

CREATE POLICY "Users can update own disc preferences"
  ON zzz_disc_preferences FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM zzz_tracked_agents WHERE id = tracked_agent_id AND profile_id = auth.uid()::text
  ));

CREATE POLICY "Users can delete own disc preferences"
  ON zzz_disc_preferences FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM zzz_tracked_agents WHERE id = tracked_agent_id AND profile_id = auth.uid()::text
  ));
