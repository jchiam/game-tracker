## Context

P5X parties are rendered by the shared `PartiesView` via a `PartyViewConfig` in `PartiesTab.tsx`. Current slots: a fixed Wonder slot (`index: -1`), three persona slots (1–3, filter `isPersona`), three thief slots (4–6, filter `isThief`). `partyService.ts` denormalizes `member_type` from the slot range in `memberToRow` (`slotIndex <= 3 ? 'persona' : 'thief'`), and the DB CHECK constrains `slot_index` to 1–6 and `member_type` to `('thief', 'persona')`.

The catalog already distinguishes Navigators: `P5xThief.role === 'Navigator'` (7 units). Today those Navigators are selectable in the active thief slots — which is wrong, because in-game a Navigator is an off-field support unit occupying a dedicated 5th combat position, never an active slot.

## Goals / Non-Goals

**Goals:**

- Add a single Navigator slot (`index: 7`) to the P5X party, restricted to `role === 'Navigator'` thieves.
- Exclude Navigators from the active thief slots (4–6).
- Persist the Navigator with a distinct `member_type = 'navigator'`.
- Keep Wonder's Team (Wonder + persona slots 1–3) unchanged.

**Non-Goals:**

- No change to the thief roster catalog, `role` values, or the update script.
- No Navigator-specific scoring, buffs, or gameplay simulation.
- No backfill/migration of existing party rows (they stay valid).
- No change to the shared `PartiesView`/`SlotConfig` engine — this is pure per-game config plus a CHECK widen.

## Decisions

**Derive `member_type` from slot range, not a stored entity flag.** `memberToRow` becomes `slotIndex <= 3 ? 'persona' : slotIndex <= 6 ? 'thief' : 'navigator'`. This matches the existing denormalization pattern and keeps the party payload free of an extra `entityType` field. Alternative — store the role/type on the member row — rejected: the catalog is the source of truth for role; duplicating it invites drift, and the slot range already encodes the type unambiguously.

**Two derived predicates instead of overloading `isThief`.** Add `isActiveThief = (e) => isThief(e) && e.role !== 'Navigator'` and `isNavigator = (e) => isThief(e) && e.role === 'Navigator'`. Slots 4–6 switch from `isThief` to `isActiveThief`; slot 7 uses `isNavigator`. This makes the mutual exclusion explicit and testable at the slot-config level. Note `role` lives on `P5xThief`; the predicates operate on the tagged union `P5xPartyEntity`, so guard with `isThief` first before reading `role` (personas have no `role`).

**Navigator shares the Phantom Thieves row.** The Navigator slot uses `group: 'thieves'`, so all four thief slots (3 active + Navigator) render in a single 4-column row under the "Phantom Thieves" panel; the 4th slot keeps its own "Navigator" label and `isNavigator` filter. Rationale: the Navigator is still a phantom thief — a separate panel below read as awkward and detached. The distinctness is carried by the per-slot label and the role-restricted picker, not by a separate panel. (Superseded earlier decision: a dedicated `navigator` slot group + `p5x-navigator-panel` accent.)

**Forward-only CHECK widen, no data migration.** New migration drops and re-adds the `slot_index` CHECK (1..7) and the `member_type` CHECK (add `'navigator'`). Existing rows (slots 1–6, types persona/thief) satisfy the widened constraints, so no row rewrite is needed.

## Risks / Trade-offs

- **A Navigator already saved into an old active slot (4–6)** → In practice impossible for the current author's data since the roster/catalog predates real Navigator picks being meaningful, but if any exist they simply render in an active slot until re-edited; the narrowed filter only governs new picks, it does not retroactively reject stored rows. Acceptable — no crash, self-heals on next edit.
- **`role` read on a persona entity** → Mitigated by guarding every predicate with `isThief(e)` before touching `e.role`.
- **CHECK drop/add is not transactional with app deploy** → Standard for this repo's forward-only migrations; the widen is strictly permissive so old app code keeps working against the new constraint.

## Migration Plan

1. Add migration `supabase/migrations/YYYYMMDD000000_p5x_navigator_slot.sql`: drop + re-add `p5x_party_members_slot_index_check` as `1..7` (name established by the prior restructure migration); for the `member_type` CHECK — created inline on `ADD COLUMN`, so its auto-name was never exercised — drop it **name-agnostically** via a `pg_constraint` lookup (`DO $$ … pg_get_constraintdef ILIKE '%member_type%' … $$`), then re-add as `p5x_party_members_member_type_check IN ('thief', 'persona', 'navigator')`. The lookup removes any dependency on the Postgres auto-naming convention, so no live-DB name check is needed.
2. Ship `PartiesTab.tsx`, `partyService.ts`, `PartiesTab.css`, and test changes together.
3. Rollback: revert the app changes; the widened CHECK can remain (permissive) or be reverted only after confirming no `navigator`/slot-7 rows exist.

## Open Questions

None — label ("Navigator"), the `'navigator'` member_type, and own-panel grouping are all decided.
