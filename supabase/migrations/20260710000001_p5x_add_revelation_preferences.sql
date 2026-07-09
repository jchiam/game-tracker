-- Revelation Preferences: preferred sets + stat priority chains per thief
CREATE TABLE p5x_revelation_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thief_row_id UUID NOT NULL REFERENCES p5x_tracked_thieves(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('heavens_set', 'space_set', 'moon_main', 'star_main', 'sky_main', 'sub_stats')),
  stat TEXT NOT NULL,
  operator TEXT,
  order_index INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE p5x_revelation_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own revelation preferences"
  ON p5x_revelation_preferences
  FOR ALL
  USING (
    thief_row_id IN (
      SELECT id FROM p5x_tracked_thieves WHERE profile_id = auth.uid()::text
    )
  )
  WITH CHECK (
    thief_row_id IN (
      SELECT id FROM p5x_tracked_thieves WHERE profile_id = auth.uid()::text
    )
  );

CREATE INDEX idx_p5x_revelation_preferences_thief ON p5x_revelation_preferences(thief_row_id);
