-- Digimon (dgm) — collection-modality tracker. One row per (profile, device):
-- ownership status, physical condition, acquisition date, and notes. No
-- parties, equipment, or multi-row writes, so no RPC is needed.

CREATE TABLE dgm_tracked_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'owned' CHECK (status IN ('owned', 'wishlist')),
  condition TEXT CHECK (condition IN ('sealed', 'boxed', 'loose')),
  acquired_on DATE,
  notes TEXT NOT NULL DEFAULT '',
  is_favorited BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (profile_id, device_id)
);

CREATE INDEX idx_dgm_tracked_devices_profile ON dgm_tracked_devices(profile_id);

ALTER TABLE dgm_tracked_devices ENABLE ROW LEVEL SECURITY;

-- auth.uid() wrapped as a scalar subquery so the planner evaluates it once per
-- statement (see 20260911000001_rls_policies_cache_auth_uid.sql).
CREATE POLICY "Users can view own tracked devices"
  ON dgm_tracked_devices FOR SELECT
  USING (profile_id = (SELECT auth.uid())::text);

CREATE POLICY "Users can insert own tracked devices"
  ON dgm_tracked_devices FOR INSERT
  WITH CHECK (profile_id = (SELECT auth.uid())::text);

CREATE POLICY "Users can update own tracked devices"
  ON dgm_tracked_devices FOR UPDATE
  USING (profile_id = (SELECT auth.uid())::text);

CREATE POLICY "Users can delete own tracked devices"
  ON dgm_tracked_devices FOR DELETE
  USING (profile_id = (SELECT auth.uid())::text);
