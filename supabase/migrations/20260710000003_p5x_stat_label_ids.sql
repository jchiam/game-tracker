-- Decouple P5X revelation stat identity from display label: rewrite the persisted
-- verbatim label strings to stable kebab-case stat ids. Display labels now live only in
-- STAT_LABELS (src/data/persona-5-phantom-x/revelations.ts) and may be re-pinned freely.
-- All rewrites match only the old labels, so re-running is a no-op (idempotent).
--
-- Old label -> id:
--   ATK->attack, ATK%->attack-pct, DEF->defense, DEF%->defense-pct, HP->hp, HP%->hp-pct,
--   HP Recovery%->hp-recovery, DMG Multiplier%->damage-mult, Ailment Accuracy%->ailment-acc,
--   Crit Rate%->crit-rate, Crit Multiplier%->crit-mult, Speed->speed,
--   SP Recovery%->sp-recovery, Pierce Rate%->pierce-rate.
-- Space mains are now fixed and derived (Attack + Defense), no longer stored: 'ATK & DEF' -> NULL.

-- ── p5x_revelation_cards.main_stat (TEXT) ─────────────────────────
UPDATE p5x_revelation_cards SET main_stat = 'attack'       WHERE main_stat = 'ATK';
UPDATE p5x_revelation_cards SET main_stat = 'attack-pct'   WHERE main_stat = 'ATK%';
UPDATE p5x_revelation_cards SET main_stat = 'defense'      WHERE main_stat = 'DEF';
UPDATE p5x_revelation_cards SET main_stat = 'defense-pct'  WHERE main_stat = 'DEF%';
UPDATE p5x_revelation_cards SET main_stat = 'hp'           WHERE main_stat = 'HP';
UPDATE p5x_revelation_cards SET main_stat = 'hp-pct'       WHERE main_stat = 'HP%';
UPDATE p5x_revelation_cards SET main_stat = 'hp-recovery'  WHERE main_stat = 'HP Recovery%';
UPDATE p5x_revelation_cards SET main_stat = 'damage-mult'  WHERE main_stat = 'DMG Multiplier%';
UPDATE p5x_revelation_cards SET main_stat = 'ailment-acc'  WHERE main_stat = 'Ailment Accuracy%';
UPDATE p5x_revelation_cards SET main_stat = 'crit-rate'    WHERE main_stat = 'Crit Rate%';
UPDATE p5x_revelation_cards SET main_stat = 'crit-mult'    WHERE main_stat = 'Crit Multiplier%';
UPDATE p5x_revelation_cards SET main_stat = 'speed'        WHERE main_stat = 'Speed';
UPDATE p5x_revelation_cards SET main_stat = 'sp-recovery'  WHERE main_stat = 'SP Recovery%';
UPDATE p5x_revelation_cards SET main_stat = 'pierce-rate'  WHERE main_stat = 'Pierce Rate%';

-- Space slot mains are fixed (Attack + Defense) and derived, not stored.
UPDATE p5x_revelation_cards SET main_stat = NULL
  WHERE slot = 'space' OR main_stat = 'ATK & DEF';

-- ── p5x_revelation_cards.sub_stats (JSONB: array of {type, value}) ─
-- Rewrite each element's `type`. Unknown/already-migrated types fall through unchanged,
-- so re-running is idempotent. P5X's roster is small; scanning all card rows is cheap.
UPDATE p5x_revelation_cards c
SET sub_stats = (
  SELECT jsonb_agg(
    CASE elem->>'type'
      WHEN 'ATK'                THEN jsonb_set(elem, '{type}', '"attack"')
      WHEN 'ATK%'               THEN jsonb_set(elem, '{type}', '"attack-pct"')
      WHEN 'DEF'                THEN jsonb_set(elem, '{type}', '"defense"')
      WHEN 'DEF%'               THEN jsonb_set(elem, '{type}', '"defense-pct"')
      WHEN 'HP'                 THEN jsonb_set(elem, '{type}', '"hp"')
      WHEN 'HP%'                THEN jsonb_set(elem, '{type}', '"hp-pct"')
      WHEN 'DMG Multiplier%'    THEN jsonb_set(elem, '{type}', '"damage-mult"')
      WHEN 'Ailment Accuracy%'  THEN jsonb_set(elem, '{type}', '"ailment-acc"')
      WHEN 'Crit Rate%'         THEN jsonb_set(elem, '{type}', '"crit-rate"')
      WHEN 'Crit Multiplier%'   THEN jsonb_set(elem, '{type}', '"crit-mult"')
      WHEN 'Speed'              THEN jsonb_set(elem, '{type}', '"speed"')
      WHEN 'SP Recovery%'       THEN jsonb_set(elem, '{type}', '"sp-recovery"')
      WHEN 'Pierce Rate%'       THEN jsonb_set(elem, '{type}', '"pierce-rate"')
      ELSE elem
    END
  )
  FROM jsonb_array_elements(c.sub_stats) AS elem
)
WHERE c.sub_stats IS NOT NULL AND jsonb_array_length(c.sub_stats) > 0;

-- ── p5x_revelation_preferences.stat (TEXT) ────────────────────────
-- Only the main-stat and substat preference chains hold stat labels; the
-- heavens_set / space_set categories store set ids and are left untouched.
UPDATE p5x_revelation_preferences SET stat = 'attack'       WHERE stat = 'ATK'                AND category IN ('moon_main','star_main','sky_main','sub_stats');
UPDATE p5x_revelation_preferences SET stat = 'attack-pct'   WHERE stat = 'ATK%'               AND category IN ('moon_main','star_main','sky_main','sub_stats');
UPDATE p5x_revelation_preferences SET stat = 'defense'      WHERE stat = 'DEF'                AND category IN ('moon_main','star_main','sky_main','sub_stats');
UPDATE p5x_revelation_preferences SET stat = 'defense-pct'  WHERE stat = 'DEF%'               AND category IN ('moon_main','star_main','sky_main','sub_stats');
UPDATE p5x_revelation_preferences SET stat = 'hp'           WHERE stat = 'HP'                 AND category IN ('moon_main','star_main','sky_main','sub_stats');
UPDATE p5x_revelation_preferences SET stat = 'hp-pct'       WHERE stat = 'HP%'                AND category IN ('moon_main','star_main','sky_main','sub_stats');
UPDATE p5x_revelation_preferences SET stat = 'hp-recovery'  WHERE stat = 'HP Recovery%'       AND category IN ('moon_main','star_main','sky_main','sub_stats');
UPDATE p5x_revelation_preferences SET stat = 'damage-mult'  WHERE stat = 'DMG Multiplier%'    AND category IN ('moon_main','star_main','sky_main','sub_stats');
UPDATE p5x_revelation_preferences SET stat = 'ailment-acc'  WHERE stat = 'Ailment Accuracy%'  AND category IN ('moon_main','star_main','sky_main','sub_stats');
UPDATE p5x_revelation_preferences SET stat = 'crit-rate'    WHERE stat = 'Crit Rate%'         AND category IN ('moon_main','star_main','sky_main','sub_stats');
UPDATE p5x_revelation_preferences SET stat = 'crit-mult'    WHERE stat = 'Crit Multiplier%'   AND category IN ('moon_main','star_main','sky_main','sub_stats');
UPDATE p5x_revelation_preferences SET stat = 'speed'        WHERE stat = 'Speed'              AND category IN ('moon_main','star_main','sky_main','sub_stats');
UPDATE p5x_revelation_preferences SET stat = 'sp-recovery'  WHERE stat = 'SP Recovery%'       AND category IN ('moon_main','star_main','sky_main','sub_stats');
UPDATE p5x_revelation_preferences SET stat = 'pierce-rate'  WHERE stat = 'Pierce Rate%'       AND category IN ('moon_main','star_main','sky_main','sub_stats');
