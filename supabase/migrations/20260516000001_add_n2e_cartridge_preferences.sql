-- Cartridge build preference tables for Neverness to Everness

CREATE TABLE n2e_cartridge_preference_main_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracked_character_id UUID NOT NULL REFERENCES n2e_tracked_characters(id) ON DELETE CASCADE,
    stat TEXT NOT NULL,
    operator_to_next TEXT CHECK (operator_to_next IN ('>', '>=', 'OR') OR operator_to_next IS NULL),
    order_index INTEGER NOT NULL
);

CREATE TABLE n2e_cartridge_preference_sub_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracked_character_id UUID NOT NULL REFERENCES n2e_tracked_characters(id) ON DELETE CASCADE,
    stat TEXT NOT NULL,
    operator_to_next TEXT CHECK (operator_to_next IN ('>', '>=', 'OR', ',') OR operator_to_next IS NULL),
    order_index INTEGER NOT NULL
);

ALTER TABLE n2e_tracked_characters ADD COLUMN cartridge_comments TEXT;

-- RLS
ALTER TABLE n2e_cartridge_preference_main_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE n2e_cartridge_preference_sub_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own n2e cartridge main prefs" ON n2e_cartridge_preference_main_stats
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM n2e_tracked_characters
            WHERE n2e_tracked_characters.id = n2e_cartridge_preference_main_stats.tracked_character_id
            AND n2e_tracked_characters.profile_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can manage own n2e cartridge sub prefs" ON n2e_cartridge_preference_sub_stats
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM n2e_tracked_characters
            WHERE n2e_tracked_characters.id = n2e_cartridge_preference_sub_stats.tracked_character_id
            AND n2e_tracked_characters.profile_id = auth.uid()::text
        )
    );

-- Indexes
CREATE INDEX idx_n2e_cart_pref_main_char_id ON n2e_cartridge_preference_main_stats(tracked_character_id);
CREATE INDEX idx_n2e_cart_pref_sub_char_id ON n2e_cartridge_preference_sub_stats(tracked_character_id);
