-- Migration: Rename older HSR tables for consistency

-- tracked_characters -> hsr_tracked_characters
ALTER TABLE tracked_characters RENAME TO hsr_tracked_characters;

-- equipped_relics -> hsr_equipped_relics
ALTER TABLE equipped_relics RENAME TO hsr_equipped_relics;

-- relic_substats -> hsr_relic_substats
ALTER TABLE relic_substats RENAME TO hsr_relic_substats;

-- build_preference_main_stats -> hsr_build_preference_main_stats
ALTER TABLE build_preference_main_stats RENAME TO hsr_build_preference_main_stats;

-- build_preference_sub_stats -> hsr_build_preference_sub_stats
ALTER TABLE build_preference_sub_stats RENAME TO hsr_build_preference_sub_stats;
