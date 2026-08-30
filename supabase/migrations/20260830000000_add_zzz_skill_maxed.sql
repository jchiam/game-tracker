-- ZZZ per-agent combat skill "maxed at base Lv. 12" flags.
--
-- The five leveled combat skills on the in-game skills screen. Only the
-- finished/unfinished state of each track is recorded, not the numeric level;
-- the Mindscape Cinema bonus that pushes these past the base cap is derived
-- from the already-tracked `mindscape` column, never entered.
--
-- Additive only: existing rows default to unfinished, so no backfill is needed
-- and the previously-deployed frontend keeps working against this schema.

ALTER TABLE zzz_tracked_agents
  ADD COLUMN skill_basic_maxed   BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN skill_dodge_maxed   BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN skill_assist_maxed  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN skill_special_maxed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN skill_chain_maxed   BOOLEAN NOT NULL DEFAULT false;
