## REMOVED Requirements

### Requirement: Known limitation — non-atomic preference saves

**Reason**: Preference-row saves, equipped-slot saves, and party saves now run inside `SECURITY INVOKER` plpgsql functions (`replace_preference_rows`, `upsert_equipment_slot`, `save_party`), so the delete-then-reinsert steps commit or roll back together. The half-wiped-rows failure mode no longer exists.

**Migration**: None for callers — `savePreferenceRows`, `upsertRelic` / `upsertDisc`, and `saveParty` keep their signatures; only the transport changed.

## ADDED Requirements

### Requirement: Multi-row writes are atomic RPCs

The system SHALL perform every write that touches more than one row — preference-row replacement, equipped-slot upsert with substats, party save with members — as a single `supabase.rpc` call to a `SECURITY INVOKER` plpgsql function, so the steps commit or roll back as a unit under the caller's RLS in one round trip. Client code SHALL NOT reintroduce a sequence of dependent table calls for these writes. Because the mocked unit tests only assert the RPC payload, the functions' atomicity, RLS enforcement, and table allowlist SHALL be verified by applying the full migration history to a throwaway Postgres whenever a migration touches an RPC.

#### Scenario: Failure mid-write leaves prior state

- **WHEN** any step inside the RPC fails (bad column, unique violation, RLS rejection)
- **THEN** no step's effect is visible in the DB, the client receives the error, the debounced queue shows the error toast, and local optimistic state is unchanged until the user retries

#### Scenario: One round trip per save

- **WHEN** a preference chain, equipped slot, or party is saved
- **THEN** exactly one request reaches Supabase for the write (a party save additionally reloads the list)
