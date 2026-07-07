## Approach: Extend shared party components with slot configuration

### Decision: Extension over P5X-specific override

The shared `PartyViewConfig` gains an optional `slots` array. Existing games pass nothing and get the current 4-uniform-slot behavior. P5X passes a 7-slot config with fixed/filtered slots. This keeps one code path for all games while allowing P5X's heterogeneous structure.

Rejected alternative: a completely separate `P5xPartyEditorModal`. Would duplicate picker logic, save flow, tier/notes UI, and require parallel maintenance.

### Slot Configuration Interface

```typescript
interface SlotConfig<E extends PartyEntity> {
  /** Slot index stored in DB (or -1 for display-only fixed slots). */
  index: number;
  /** Label shown in builder placeholder (e.g. "Persona 1", "Phantom Thief 2"). */
  label?: string;
  /** Non-pickable fixed slot — renders static image and name. */
  fixed?: { image: string; name: string };
  /** Narrows the picker entity list for this slot. */
  entityFilter?: (entity: E) => boolean;
  /** Overrides the config-level search placeholder for this slot's picker. */
  searchPlaceholder?: string;
  /** Groups slots visually — slots sharing same group key render in one panel. */
  group?: string;
}

interface SlotGroupStyle {
  /** Panel heading (e.g. "Wonder's Team", "Phantom Thieves"). */
  label: string;
  /** Optional CSS class for tinted panel background. */
  accent?: string;
}
```

Slot groups are declared on `PartyViewConfig`:

```typescript
// Added to PartyViewConfig<E>
slotGroups?: Record<string, SlotGroupStyle>;
```

When `slotGroups` is defined, the editor and card group consecutive slots by their `group` key and wrap each group in a styled panel. Undefined `slotGroups` → flat layout (no panels). The grouping logic lives in a single exported `groupSlots()` helper in `PartiesView.tsx`, consumed by both `PartyEditorModal` and `PartyCard`.

When `config.slots` is undefined, both `PartyEditorModal` and `PartyCard` fall back to `[0, 1, 2, 3].map(i => ({ index: i }))` — zero behavioral change for HSR/R1999/N2E/AE.

### Entity Union Strategy

P5X `PartiesTab` builds a merged entity array:

```typescript
type P5xPartyEntity = (P5xThief | P5xPersona) & { entityType: 'thief' | 'persona' };
```

Both `P5xThief` and `P5xPersona` already satisfy `PartyEntity` (id, name, imageUrl). The `entityType` tag is added at the adapter level (not stored), used only by `entityFilter` lambdas.

### Uniqueness Constraint in Picker

Current `filteredEntities` excludes entities already assigned to any slot. This still works — a persona assigned to slot 1 won't appear when picking for slot 2. Cross-type uniqueness is naturally handled: thieves and personas have non-overlapping IDs.

### PartyCard Layout — P5X Variant

Standard games: single `.party-members-row` with 4 slots inline.

P5X variant (via `variantClass: 'p5x-party'`):

```
.party-members-row (display: grid, 2 rows)
  Row 1: [Wonder fixed] [Persona 1] [Persona 2] [Persona 3]
  Row 2: [Phantom Thief 1] [Phantom Thief 2] [Phantom Thief 3]
```

CSS grid with `grid-template-columns` adapts per row. The fixed Wonder slot uses a smaller treatment (no click, no remove button, subtle border).

### Wonder Slot Image

Wonder is not a Prydwen catalog entry (not a recruitable thief) and has no scraped asset. The fixed slot's image is a committed public asset, `/assets/persona-5-phantom-x/wonder.webp`, served as a raw local path — **never** resolved through `getMugshotUrl`/ImageKit, since that would rewrite it to a non-existent CDN location. The asset is a portrait of Wonder; the path is stable, so replacing the file swaps the image with no code change. (Wonder is the short-haired lead on the P5X key art, distinct from Ren Amamiya / Joker, who remains a normal roster thief.)

### PartyEditorModal Layout — P5X

Builder section uses slot groups for visual separation:

```
┌─ "Wonder's Team" panel (accent: p5x-wonder-panel) ──────┐
│  ┏━━━━━━━━┓                                              │
│  ┃ Wonder ┃  ← fixed slot, accent border, no picker     │
│  ┗━━━━━━━━┛                                              │
│  [Persona 1] [Persona 2] [Persona 3]                    │
└──────────────────────────────────────────────────────────┘

┌─ "Phantom Thieves" panel (accent: p5x-thief-panel) ─────┐
│  [Phantom Thief 1] [Phantom Thief 2] [Phantom Thief 3]  │
└──────────────────────────────────────────────────────────┘
```

Each panel: subtle game-color background tint (5–8% via `color-mix`), rounded border (token `--border-radius-md`), group label as small-caps header, spacing token gap between panels.

P5X slot group config:

```typescript
slotGroups: {
  wonder: { label: "Wonder's Team", accent: 'p5x-wonder-panel' },
  thieves: { label: 'Phantom Thieves', accent: 'p5x-thief-panel' },
},
```

Fixed Wonder slot renders inside the "wonder" group panel (not as a separate header element). All slots in a group are wrapped together.

### DB Schema — Single Table with Discriminator

Keep one `p5x_party_members` table. The `member_type` column discriminates persona vs thief rows. Slot index encodes position:

| slot_index | member_type | Meaning                 |
| ---------- | ----------- | ----------------------- |
| 1          | persona     | Wonder's persona slot 1 |
| 2          | persona     | Wonder's persona slot 2 |
| 3          | persona     | Wonder's persona slot 3 |
| 4          | thief       | Phantom Thief slot 1    |
| 5          | thief       | Phantom Thief slot 2    |
| 6          | thief       | Phantom Thief slot 3    |

Wonder (slot 0) is never stored — it's implicit in every P5X party.

### Service Layer Mapping

```typescript
memberFromRow: (row) => ({ entityId: row.entity_id, slotIndex: row.slot_index }),
memberToRow: (member) => ({
  entity_id: member.entityId,
  slot_index: member.slotIndex,
  member_type: member.slotIndex <= 3 ? 'persona' : 'thief',
}),
```

The shared `createPartyPersistence` factory works unchanged — it doesn't care about member semantics, just passes rows through the mapping functions.

### Data Pipeline — Persona Scraping

Two-phase fetch in `update-p5x-data.mjs`:

1. **Metadata**: GET `page-data/persona-5x/personas/page-data.json` → 149 entries with id, unitId, name, rarity, job, element
2. **Images**: GET rendered HTML at `prydwen.gg/persona-5x/personas/` → parse Contentful `<img>` src URLs, match to persona names

Images uploaded to ImageKit under `p5x/personas/{slug}.webp` using the existing `ensureAsset` pipeline. Local fallback path: `/assets/p5x/personas/{slug}.webp`.

### Image Resolution

Add to `src/lib/imagekit.ts`:

```typescript
export function getPersonaMugshotUrl(localPath: string): string { ... }
export function getPersonaAvatarUrl(localPath: string): string { ... }
```

Same pattern as thief images — transform dimensions may differ (personas are typically smaller icons).

### Backward Compatibility

| Game  | slots config  | Behavior                           |
| ----- | ------------- | ---------------------------------- |
| HSR   | undefined     | 4 uniform slots (unchanged)        |
| R1999 | undefined     | 4 uniform slots (unchanged)        |
| N2E   | undefined     | 4 uniform slots (unchanged)        |
| AE    | undefined     | 4 uniform slots (unchanged)        |
| P5X   | 7-slot config | Fixed Wonder + 3 persona + 3 thief |

No existing test should break. New tests cover: slot config rendering, fixed slot behavior, entityFilter narrowing, P5X party save/load with member_type.
