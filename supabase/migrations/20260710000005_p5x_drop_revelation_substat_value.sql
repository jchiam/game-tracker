-- Drop substat value tracking for P5X revelation cards.
-- Reshape p5x_revelation_cards.sub_stats (JSONB) from an array of {type, value}
-- objects to an array of the elements' `type` strings, preserving order.
-- Substats are now tracked as stat-type ids only (EquippedRevelation.subStats: string[]).
--
-- Idempotent: only rows whose sub_stats array still contains object elements are
-- rewritten; a row already holding strings is left unchanged.

UPDATE p5x_revelation_cards
SET sub_stats = (
  SELECT COALESCE(jsonb_agg(elem->>'type' ORDER BY ord), '[]'::jsonb)
  FROM jsonb_array_elements(sub_stats) WITH ORDINALITY AS t(elem, ord)
)
WHERE jsonb_typeof(sub_stats) = 'array'
  AND EXISTS (
    SELECT 1
    FROM jsonb_array_elements(sub_stats) AS e
    WHERE jsonb_typeof(e) = 'object'
  );
