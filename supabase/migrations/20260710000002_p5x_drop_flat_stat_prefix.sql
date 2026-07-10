-- Drop the redundant "Flat" prefix from P5X revelation flat stat labels, aligning
-- with HSR/N2E convention (bare stat name = flat, "%" suffix = percent).
-- Old: "Flat ATK", "Flat DEF", "Flat HP", "Flat ATK & Flat DEF"
-- New: "ATK", "DEF", "HP", "ATK & DEF"
-- All rewrites match only the old labels, so re-running is a no-op (idempotent).

-- ── p5x_revelation_cards.main_stat (TEXT) ─────────────────────────
-- Only the SUN (Flat HP) and SPACE (dual) slots carry flat main stats.

UPDATE p5x_revelation_cards SET main_stat = 'HP' WHERE main_stat = 'Flat HP';
UPDATE p5x_revelation_cards SET main_stat = 'ATK & DEF' WHERE main_stat = 'Flat ATK & Flat DEF';

-- ── p5x_revelation_cards.sub_stats (JSONB: array of {type, value}) ─
-- Rewrite each element's `type`; guard limits the scan to rows that
-- actually contain a flat label.

UPDATE p5x_revelation_cards c
SET sub_stats = (
  SELECT jsonb_agg(
    CASE elem->>'type'
      WHEN 'Flat ATK' THEN jsonb_set(elem, '{type}', '"ATK"')
      WHEN 'Flat DEF' THEN jsonb_set(elem, '{type}', '"DEF"')
      WHEN 'Flat HP'  THEN jsonb_set(elem, '{type}', '"HP"')
      ELSE elem
    END
  )
  FROM jsonb_array_elements(c.sub_stats) AS elem
)
WHERE c.sub_stats @> '[{"type":"Flat ATK"}]'
   OR c.sub_stats @> '[{"type":"Flat DEF"}]'
   OR c.sub_stats @> '[{"type":"Flat HP"}]';

-- ── p5x_revelation_preferences.stat (TEXT) ────────────────────────
-- Flat labels only ever appear in the 'sub_stats' category chain
-- (moon/star/sky main categories hold percent labels), but matching by
-- value alone is sufficient and safe.

UPDATE p5x_revelation_preferences SET stat = 'ATK' WHERE stat = 'Flat ATK';
UPDATE p5x_revelation_preferences SET stat = 'DEF' WHERE stat = 'Flat DEF';
UPDATE p5x_revelation_preferences SET stat = 'HP' WHERE stat = 'Flat HP';
