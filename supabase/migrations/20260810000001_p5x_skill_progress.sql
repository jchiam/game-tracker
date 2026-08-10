ALTER TABLE p5x_tracked_thieves
  ADD COLUMN skill_progress SMALLINT NOT NULL DEFAULT 0
    CHECK (skill_progress BETWEEN 0 AND 2);

UPDATE p5x_tracked_thieves
  SET skill_progress = CASE
    WHEN rose_maxed THEN 2
    WHEN skills_leveled THEN 1
    ELSE 0
  END;

-- The pair CHECK references both columns, so drop it before the columns.
ALTER TABLE p5x_tracked_thieves
  DROP CONSTRAINT p5x_thief_skill_gate;

ALTER TABLE p5x_tracked_thieves
  DROP COLUMN skills_leveled,
  DROP COLUMN rose_maxed;
