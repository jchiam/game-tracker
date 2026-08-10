ALTER TABLE p5x_tracked_thieves
  ADD COLUMN mindscape_progress SMALLINT NOT NULL DEFAULT 0
    CHECK (mindscape_progress BETWEEN 0 AND 2);

UPDATE p5x_tracked_thieves
  SET mindscape_progress = 2
  WHERE mindscape_maxed;

ALTER TABLE p5x_tracked_thieves
  DROP COLUMN mindscape_maxed;
