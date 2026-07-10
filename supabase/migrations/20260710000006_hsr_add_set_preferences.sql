-- HSR set preferences: preferred 4-piece relic set and preferred 2-piece planar
-- ornament set, each a single nullable choice on the character's build preferences.
-- Feeds the unified relic-scoring set term. Additive, nullable — no backfill needed.

ALTER TABLE hsr_tracked_characters
  ADD COLUMN IF NOT EXISTS relic_set_id TEXT,
  ADD COLUMN IF NOT EXISTS planar_set_id TEXT;
