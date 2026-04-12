-- Remove insight_level from r1999_tracked_arcanists
-- Insight is a level gate, not independently useful to track

ALTER TABLE r1999_tracked_arcanists
DROP COLUMN insight_level;
