-- Chaos Zero Nightmare Phase 2: per-combatant Partner tracking.
--
-- Partners are the CZN weapon analog — one equips per Combatant — so they are
-- columns on the tracked-combatant row (R1999 psychube shape), not a table.
--   partner_id          ALL_CZN_PARTNERS id (kebab slug of the name); NULL = none equipped
--   partner_level       1–60 (Game8 lists Partner stats at Level 60; slider max is paired)
--   partner_ego         Partner Manifest Ego rank: 0 base, 1–4 dupe unlocks (shown T0–T4)
--   partner_preferences ordered TEXT[] of ALL_CZN_PARTNERS ids, highest priority first,
--                       no duplicates — an array column (AE weapon_preferences precedent)
--                       so a save is one atomic column update, never preference rows.

BEGIN;

ALTER TABLE czn_tracked_combatants
  ADD COLUMN partner_id TEXT,
  ADD COLUMN partner_level SMALLINT NOT NULL DEFAULT 1
    CHECK (partner_level BETWEEN 1 AND 60),
  ADD COLUMN partner_ego SMALLINT NOT NULL DEFAULT 0
    CHECK (partner_ego BETWEEN 0 AND 4),
  ADD COLUMN partner_preferences TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

COMMIT;
