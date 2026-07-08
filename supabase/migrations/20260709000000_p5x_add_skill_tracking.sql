-- P5X aggregate skill-progress tracking on tracked thieves.
-- Two booleans encode three reachable states:
--   (false, false) untouched · (true, false) rose-gated at Lv8 · (true, true) maxed Lv10.
-- The CHECK rejects the one invalid combination (rose maxed without skills leveled).

ALTER TABLE p5x_tracked_thieves
  ADD COLUMN skills_leveled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN rose_maxed BOOLEAN NOT NULL DEFAULT false,
  ADD CONSTRAINT p5x_thief_skill_gate CHECK (NOT (rose_maxed AND NOT skills_leveled));
