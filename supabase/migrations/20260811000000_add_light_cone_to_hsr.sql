-- Add equipped light cone columns to hsr_tracked_characters

ALTER TABLE hsr_tracked_characters
ADD COLUMN light_cone_id TEXT,
ADD COLUMN light_cone_level INTEGER NOT NULL DEFAULT 1,
ADD COLUMN light_cone_superimposition INTEGER NOT NULL DEFAULT 1;
