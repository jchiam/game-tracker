-- ZZZ aggregate skill-progress tracking on tracked agents.
-- Ordered 0-2, mirroring the P5X shape (20260810000001_p5x_skill_progress.sql):
--   0 not started · 1 all five combat skills at the base Lv. 11 cap, waiting on
--   Hamster Cage Passes · 2 pushed past the Pass gate to the Lv. 12 max.
-- The single ordered field makes "Pass-maxed without the Lv. 11 cap" unrepresentable.

ALTER TABLE zzz_tracked_agents
  ADD COLUMN skill_progress SMALLINT NOT NULL DEFAULT 0
    CHECK (skill_progress BETWEEN 0 AND 2);

-- The five booleans cannot express the gated state, and a partially-maxed set
-- has no faithful aggregate value, so backfill understates: only all-five-maxed
-- rows carry meaning (2); everything else restarts at 0.
UPDATE zzz_tracked_agents
  SET skill_progress = 2
  WHERE skill_basic_maxed
    AND skill_dodge_maxed
    AND skill_assist_maxed
    AND skill_special_maxed
    AND skill_chain_maxed;

ALTER TABLE zzz_tracked_agents
  DROP COLUMN skill_basic_maxed,
  DROP COLUMN skill_dodge_maxed,
  DROP COLUMN skill_assist_maxed,
  DROP COLUMN skill_special_maxed,
  DROP COLUMN skill_chain_maxed;
