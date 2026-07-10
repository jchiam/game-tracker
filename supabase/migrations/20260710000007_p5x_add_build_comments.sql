-- Add free-text build comments to P5X tracked thieves.
-- Mirrors hsr_tracked_characters.build_comments: revelation-preference comments
-- persist as a parent column, not a preference row.
ALTER TABLE p5x_tracked_thieves
  ADD COLUMN IF NOT EXISTS build_comments TEXT;
