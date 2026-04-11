-- Add psychube columns to r1999_tracked_arcanists

ALTER TABLE r1999_tracked_arcanists
ADD COLUMN psychube_id INTEGER,
ADD COLUMN psychube_level INTEGER NOT NULL DEFAULT 0;
