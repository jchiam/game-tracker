-- Make p5x_tracked_thieves.weapon_rarity non-null with a default of 2 (lowest tier).
--
-- Every P5X thief has the lowest-tier (2★) weapon equipped for free from day one,
-- so a null rarity never corresponds to a real in-game state — it only meant
-- "weapon investment not yet tracked". Reinterpret every such row as a real 2★,
-- then forbid null going forward.
--
-- The existing CHECK (weapon_rarity BETWEEN 2 AND 5) is unchanged and already
-- forbids out-of-range values, so the backfill can only produce a legal 2.

UPDATE p5x_tracked_thieves
  SET weapon_rarity = 2
  WHERE weapon_rarity IS NULL;

ALTER TABLE p5x_tracked_thieves
  ALTER COLUMN weapon_rarity SET DEFAULT 2,
  ALTER COLUMN weapon_rarity SET NOT NULL;
