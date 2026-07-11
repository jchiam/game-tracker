-- Rename p5x_revelation_preferences.operator to operator_to_next, matching the
-- HSR/N2E preference tables so the shared preference-chain codec has a single
-- column vocabulary. Rename is metadata-only (instant) in Postgres.
ALTER TABLE p5x_revelation_preferences RENAME COLUMN operator TO operator_to_next;
