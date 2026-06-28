-- Add the per-operator weapon-preference list for Arknights: Endfield.
--
-- `weapon_preferences` is an ordered TEXT[] of ALL_WEAPONS *ids* (kebab slugs),
-- highest priority first. Order is significant (index 0 = first choice) and the
-- list is a pure ranking with no comparison operators. Stored as an array column
-- (not a child table) so saves are atomic via a single column update, sidestepping
-- the non-atomic delete-then-reinsert pattern used by the HSR/N2E stat-chain tables.

BEGIN;

ALTER TABLE ae_tracked_operators
  ADD COLUMN weapon_preferences TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

COMMIT;
