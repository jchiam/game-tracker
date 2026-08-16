-- ZZZ Phase 3: W-Engine tracking columns on zzz_tracked_agents.
-- Replays the HSR Light Cone shape: equipped engine as parent columns plus a
-- ranked preference list as an atomic text[] column (no preference-rows table).
-- Level floor is 0 (ZZZ engines start at level 0, unlike HSR cones at 1).

ALTER TABLE zzz_tracked_agents
  ADD COLUMN wengine_id TEXT,
  ADD COLUMN wengine_level INTEGER NOT NULL DEFAULT 0 CHECK (wengine_level BETWEEN 0 AND 60),
  ADD COLUMN wengine_phase INTEGER NOT NULL DEFAULT 1 CHECK (wengine_phase BETWEEN 1 AND 5),
  ADD COLUMN wengine_preferences TEXT[] NOT NULL DEFAULT '{}';
