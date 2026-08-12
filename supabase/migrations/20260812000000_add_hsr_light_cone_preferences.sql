-- Add the per-character Light Cone preference list for Honkai: Star Rail.
--
-- `light_cone_preferences` is an ordered TEXT[] of ALL_LIGHT_CONES *ids*
-- (StarRailRes numeric ids as strings), highest priority first. Order is
-- significant (index 0 = first choice) and the list is a pure ranking with
-- no comparison operators. Stored as an array column (not a child table) so
-- saves are atomic via a single column update, sidestepping the non-atomic
-- delete-then-reinsert pattern of the stat-preference tables (AE
-- weapon-preference precedent).

BEGIN;

ALTER TABLE hsr_tracked_characters
  ADD COLUMN light_cone_preferences TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

COMMIT;
