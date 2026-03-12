CREATE TABLE build_preference_main_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracked_character_id UUID NOT NULL REFERENCES tracked_characters(id) ON DELETE CASCADE,
    slot TEXT NOT NULL CHECK (slot IN ('body', 'feet', 'sphere', 'rope')),
    stat TEXT NOT NULL,
    operator_to_next TEXT CHECK (operator_to_next IN ('>', '>=', 'OR') OR operator_to_next IS NULL),
    order_index INTEGER NOT NULL
);

CREATE TABLE build_preference_sub_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracked_character_id UUID NOT NULL REFERENCES tracked_characters(id) ON DELETE CASCADE,
    stat TEXT NOT NULL,
    operator_to_next TEXT CHECK (operator_to_next IN ('>', '>=', 'OR', ',') OR operator_to_next IS NULL),
    order_index INTEGER NOT NULL
);

-- Indexes to ensure efficient querying when pulling a character's full tracking data
CREATE INDEX idx_build_pref_main_char_id ON build_preference_main_stats(tracked_character_id);
CREATE INDEX idx_build_pref_sub_char_id ON build_preference_sub_stats(tracked_character_id);
