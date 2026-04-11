-- Add resonance_level column to r1999_tracked_arcanists

ALTER TABLE r1999_tracked_arcanists
ADD COLUMN resonance_level INTEGER NOT NULL DEFAULT 0;
