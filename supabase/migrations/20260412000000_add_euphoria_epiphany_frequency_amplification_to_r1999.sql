-- Add post-v2.0 advancement tracking columns to r1999_tracked_arcanists

ALTER TABLE r1999_tracked_arcanists
ADD COLUMN euphoria_stage         INTEGER NOT NULL DEFAULT 0,
ADD COLUMN psychube_amplification INTEGER NOT NULL DEFAULT 0;
