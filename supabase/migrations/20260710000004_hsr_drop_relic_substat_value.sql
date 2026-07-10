-- Drop substat value tracking for HSR relics.
-- Substats are now tracked as stat types only (EquippedRelic.subStats: string[]);
-- the numeric magnitude was never used by relic scoring. The stat_type rows survive
-- and map directly to the string[] loaded by the app.

ALTER TABLE hsr_relic_substats DROP COLUMN IF EXISTS stat_value;
