ALTER TABLE hsr_build_preference_main_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE hsr_build_preference_sub_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous access" ON hsr_build_preference_main_stats FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anonymous access" ON hsr_build_preference_sub_stats FOR ALL USING (true) WITH CHECK (true);