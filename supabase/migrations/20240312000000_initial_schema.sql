-- Supabase Relational Schema for Honkai Star Rail Tracker

-- Table to store user profiles
CREATE TABLE user_profiles (
  id TEXT PRIMARY KEY,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Table to store tracked characters (Many-to-One with user_profiles)
CREATE TABLE tracked_characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  character_id TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1,
  traces_attained BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(profile_id, character_id)
);

-- Table to store equipped relics (Many-to-One with tracked_characters)
CREATE TABLE equipped_relics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracked_character_id UUID NOT NULL REFERENCES tracked_characters(id) ON DELETE CASCADE,
  slot TEXT NOT NULL, -- e.g. 'head', 'hands', 'body', 'feet', 'sphere', 'rope'
  set_id TEXT,
  main_stat TEXT,
  UNIQUE(tracked_character_id, slot)
);

-- Table to store relic substats (Many-to-One with equipped_relics)
CREATE TABLE relic_substats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  relic_id UUID NOT NULL REFERENCES equipped_relics(id) ON DELETE CASCADE,
  stat_type TEXT NOT NULL,
  stat_value TEXT NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracked_characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipped_relics ENABLE ROW LEVEL SECURITY;
ALTER TABLE relic_substats ENABLE ROW LEVEL SECURITY;

-- Note: For a simple, single-user deployment (default), we can allow all access to these tables.
CREATE POLICY "Allow anonymous access" ON user_profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anonymous access" ON tracked_characters FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anonymous access" ON equipped_relics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anonymous access" ON relic_substats FOR ALL USING (true) WITH CHECK (true);

