-- hsr_relic_substats.relic_id is a foreign key with no supporting index — the
-- only FK child column in the schema without one. The roster load embeds
-- hsr_equipped_relics -> hsr_relic_substats, and the substats RLS policies join
-- back through hsr_equipped_relics, so both paths scanned the whole table per
-- relic row. The table holds every user's substats and grows without bound.

CREATE INDEX IF NOT EXISTS idx_hsr_relic_substats_relic_id ON hsr_relic_substats(relic_id);
