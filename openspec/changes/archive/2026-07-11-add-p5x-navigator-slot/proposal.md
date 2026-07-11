## Why

The P5X party model omits the Navigator — the off-field support unit that P5X combat actually fields alongside the three active Phantom Thieves. Navigators are already tagged in the catalog (`role: 'Navigator'`, 7 units), but the party editor gives them no home and, worse, lets them be picked into the active thief slots where they cannot legally operate.

## What Changes

- Add a **Navigator** slot (`slot_index = 7`) to the P5X party editor and card, in its own slot group/panel — the game's off-field support unit.
- The Navigator slot accepts **only** Navigator thieves (`role === 'Navigator'`); the three active thief slots (4–6) are narrowed to **exclude** Navigators. This is a behaviour change to the existing thief slots, not purely additive.
- Introduce a `'navigator'` `member_type`, denormalized from the slot range in `memberToRow` (slots 1–3 `persona`, 4–6 `thief`, 7 `navigator`).
- Widen the `p5x_party_members.slot_index` CHECK from `1..6` to `1..7` and extend the `member_type` CHECK to `IN ('thief', 'persona', 'navigator')`.
- Wonder's Team (Wonder fixed slot + 3 persona slots) is **untouched**.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `shared-parties`: the "P5X party slots" scenario changes — slot range becomes 1–7, a 7th slot holds a single Navigator (`member_type = 'navigator'`), and the active thief slots (4–6) exclude Navigators. The per-slot entity-filter scenario gains a Navigator-restricted example.

## Impact

- **Code:** `src/pages/persona-5-phantom-x/components/PartiesTab.tsx` (new slot + narrowed filters + slot group), `src/services/persona-5-phantom-x/partyService.ts` (`memberToRow` derive), `PartiesTab.css` (navigator panel accent), `PartiesTab.test.tsx` (slot-wiring assertions).
- **DB:** one new forward-only migration widening the `slot_index` and `member_type` CHECK constraints on `p5x_party_members`.
- **Data / scripts:** none — `role: 'Navigator'` already exists in the catalog; no update-script change.
- **Backwards compatibility:** existing saved P5X parties (slots 1–6) remain valid under the widened CHECK; no data migration of rows needed.
