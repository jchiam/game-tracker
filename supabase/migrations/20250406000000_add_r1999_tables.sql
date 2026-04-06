-- Reverse: 1999 tracked arcanists table

CREATE TABLE r1999_tracked_arcanists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  arcanist_id TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1,
  insight_level INTEGER NOT NULL DEFAULT 0,
  is_favorited BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(profile_id, arcanist_id)
);

ALTER TABLE r1999_tracked_arcanists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous access" ON r1999_tracked_arcanists FOR ALL USING (true) WITH CHECK (true);
