ALTER TABLE p5x_tracked_thieves
  ADD COLUMN weapon_rarity SMALLINT CHECK (weapon_rarity BETWEEN 2 AND 5),
  ADD COLUMN weapon_level  SMALLINT NOT NULL DEFAULT 1 CHECK (weapon_level BETWEEN 1 AND 80),
  ADD COLUMN weapon_forge  SMALLINT NOT NULL DEFAULT 0 CHECK (weapon_forge BETWEEN 0 AND 6);
