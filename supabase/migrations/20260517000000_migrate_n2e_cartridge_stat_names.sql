-- Migrate cartridge stat names from hardcoded format to everness.info API canonical format.
-- Old: "ATK%", "CRIT Rate", "Cosmos DMG%"
-- New: "ATK %", "CRIT Rate %", "Cosmos DMG Bonus %"

-- Helper: renames a stat value in a TEXT column
-- Used for cartridge_main_stat and preference stat columns

-- ── n2e_tracked_characters.cartridge_main_stat ────────────────────

UPDATE n2e_tracked_characters SET cartridge_main_stat = 'HP %' WHERE cartridge_main_stat = 'HP%';
UPDATE n2e_tracked_characters SET cartridge_main_stat = 'ATK %' WHERE cartridge_main_stat = 'ATK%';
UPDATE n2e_tracked_characters SET cartridge_main_stat = 'DEF %' WHERE cartridge_main_stat = 'DEF%';
UPDATE n2e_tracked_characters SET cartridge_main_stat = 'CRIT Rate %' WHERE cartridge_main_stat = 'CRIT Rate';
UPDATE n2e_tracked_characters SET cartridge_main_stat = 'CRIT DMG %' WHERE cartridge_main_stat = 'CRIT DMG';
UPDATE n2e_tracked_characters SET cartridge_main_stat = 'Healing Bonus %' WHERE cartridge_main_stat = 'Healing Bonus';
UPDATE n2e_tracked_characters SET cartridge_main_stat = 'Anima DMG Bonus %' WHERE cartridge_main_stat = 'Anima DMG%';
UPDATE n2e_tracked_characters SET cartridge_main_stat = 'Chaos DMG Bonus %' WHERE cartridge_main_stat = 'Chaos DMG%';
UPDATE n2e_tracked_characters SET cartridge_main_stat = 'Cosmos DMG Bonus %' WHERE cartridge_main_stat = 'Cosmos DMG%';
UPDATE n2e_tracked_characters SET cartridge_main_stat = 'Incantation DMG Bonus %' WHERE cartridge_main_stat = 'Incantation DMG%';
UPDATE n2e_tracked_characters SET cartridge_main_stat = 'Lakshana DMG Bonus %' WHERE cartridge_main_stat = 'Lakshana DMG%';
UPDATE n2e_tracked_characters SET cartridge_main_stat = 'Psyche DMG Bonus %' WHERE cartridge_main_stat = 'Psyche DMG%';
UPDATE n2e_tracked_characters SET cartridge_main_stat = 'Mental DMG Bonus %' WHERE cartridge_main_stat = 'Mental DMG%';

-- ── n2e_tracked_characters.cartridge_sub_stats (TEXT array) ───────

UPDATE n2e_tracked_characters SET cartridge_sub_stats = array_replace(cartridge_sub_stats, 'HP%', 'HP %');
UPDATE n2e_tracked_characters SET cartridge_sub_stats = array_replace(cartridge_sub_stats, 'ATK%', 'ATK %');
UPDATE n2e_tracked_characters SET cartridge_sub_stats = array_replace(cartridge_sub_stats, 'DEF%', 'DEF %');
UPDATE n2e_tracked_characters SET cartridge_sub_stats = array_replace(cartridge_sub_stats, 'CRIT Rate', 'CRIT Rate %');
UPDATE n2e_tracked_characters SET cartridge_sub_stats = array_replace(cartridge_sub_stats, 'CRIT DMG', 'CRIT DMG %');
UPDATE n2e_tracked_characters SET cartridge_sub_stats = array_replace(cartridge_sub_stats, 'Universal DMG%', 'Universal DMG Bonus %');

-- ── n2e_cartridge_preference_main_stats.stat ─────────────────────

UPDATE n2e_cartridge_preference_main_stats SET stat = 'HP %' WHERE stat = 'HP%';
UPDATE n2e_cartridge_preference_main_stats SET stat = 'ATK %' WHERE stat = 'ATK%';
UPDATE n2e_cartridge_preference_main_stats SET stat = 'DEF %' WHERE stat = 'DEF%';
UPDATE n2e_cartridge_preference_main_stats SET stat = 'CRIT Rate %' WHERE stat = 'CRIT Rate';
UPDATE n2e_cartridge_preference_main_stats SET stat = 'CRIT DMG %' WHERE stat = 'CRIT DMG';
UPDATE n2e_cartridge_preference_main_stats SET stat = 'Healing Bonus %' WHERE stat = 'Healing Bonus';
UPDATE n2e_cartridge_preference_main_stats SET stat = 'Anima DMG Bonus %' WHERE stat = 'Anima DMG%';
UPDATE n2e_cartridge_preference_main_stats SET stat = 'Chaos DMG Bonus %' WHERE stat = 'Chaos DMG%';
UPDATE n2e_cartridge_preference_main_stats SET stat = 'Cosmos DMG Bonus %' WHERE stat = 'Cosmos DMG%';
UPDATE n2e_cartridge_preference_main_stats SET stat = 'Incantation DMG Bonus %' WHERE stat = 'Incantation DMG%';
UPDATE n2e_cartridge_preference_main_stats SET stat = 'Lakshana DMG Bonus %' WHERE stat = 'Lakshana DMG%';
UPDATE n2e_cartridge_preference_main_stats SET stat = 'Psyche DMG Bonus %' WHERE stat = 'Psyche DMG%';
UPDATE n2e_cartridge_preference_main_stats SET stat = 'Mental DMG Bonus %' WHERE stat = 'Mental DMG%';

-- ── n2e_cartridge_preference_sub_stats.stat ──────────────────────

UPDATE n2e_cartridge_preference_sub_stats SET stat = 'HP %' WHERE stat = 'HP%';
UPDATE n2e_cartridge_preference_sub_stats SET stat = 'ATK %' WHERE stat = 'ATK%';
UPDATE n2e_cartridge_preference_sub_stats SET stat = 'DEF %' WHERE stat = 'DEF%';
UPDATE n2e_cartridge_preference_sub_stats SET stat = 'CRIT Rate %' WHERE stat = 'CRIT Rate';
UPDATE n2e_cartridge_preference_sub_stats SET stat = 'CRIT DMG %' WHERE stat = 'CRIT DMG';
UPDATE n2e_cartridge_preference_sub_stats SET stat = 'Universal DMG Bonus %' WHERE stat = 'Universal DMG%';
