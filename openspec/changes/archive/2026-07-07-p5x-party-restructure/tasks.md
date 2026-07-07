## Tasks

- [x] **Add persona catalog data layer (generated-style stub).** Create `src/data/persona-5-phantom-x/personas.ts` with the `// Auto-generated … do not edit` banner, a `P5xPersona` interface, and an `ALL_PERSONAS` array. This is a bootstrap stub the update script overwrites — never hand-maintain the 149 entries (CLAUDE.md forbids hand-editing `src/data/**`). Real population happens by running the update script (Task 2) with ImageKit secrets.
  - `src/data/persona-5-phantom-x/personas.ts` — NEW

- [x] **Update data pipeline for persona scraping.** Extend `scripts/update-p5x-data.mjs` to fetch persona metadata from the Prydwen personas page-data endpoint, resolve image URLs, upload to ImageKit via `ensureAsset`, and generate `personas.ts`. Verify the endpoint shape with a live fetch before writing the parser.
  - `scripts/update-p5x-data.mjs`

- [x] **Add SlotConfig and SlotGroupStyle to PartyViewConfig.** Add optional `slots?: SlotConfig<E>[]` and `slotGroups?: Record<string, SlotGroupStyle>` to `PartyViewConfig` in `PartiesView.tsx`. Define + export `SlotConfig` with `index`, `label`, `fixed`, `entityFilter`, `searchPlaceholder`, `group`. Define + export `SlotGroupStyle` with `label`, `accent?`.
  - `src/components/parties/PartiesView.tsx`

- [x] **Update PartyEditorModal for slot config + slot groups.** Replace hardcoded `[0,1,2,3]` with `config.slots ?? DEFAULT_SLOTS`. When `config.slotGroups` defined, group consecutive slots by `slot.group` key and wrap each group in a styled panel (label header, accent background class, rounded border, gap between panels). Render fixed slots as static images (no click, no remove). Apply `slotConfig.entityFilter` to the picker for the active slot. Use slot `label` in placeholder and slot `searchPlaceholder` when present.
  - `src/components/parties/PartyEditorModal.tsx`
  - `src/components/parties/PartyEditorModal.css`

- [x] **Update PartyCard for slot config.** Replace hardcoded `[0,1,2,3]` with `config.slots ?? DEFAULT_SLOTS`. Render fixed slots as static image with name. Support P5X two-row layout via `variantClass`.
  - `src/components/parties/PartyCard.tsx`

- [x] **P5X party variant CSS (card + editor panels).** Add `.p5x-party .party-members-row` grid override for two-row card layout. Add `.slot-group-panel` base styles (background tint via accent class + `color-mix`, `--border-radius-md`, small-caps label, spacing gap). Add `.p5x-wonder-panel` and `.p5x-thief-panel` accent classes with P5X game-color tints. Fixed Wonder slot styling (no hover, subtle border, smaller).
  - `src/pages/persona-5-phantom-x/components/PartiesTab.css`
  - `src/components/parties/PartyEditorModal.css`

- [x] **DB migration — restructure p5x_party_members.** Purge all P5X parties and members. Drop old slot_index CHECK, add new CHECK (1–6). Add `member_type TEXT NOT NULL DEFAULT 'thief' CHECK (IN ('thief','persona'))`. Rename `thief_id` → `entity_id`.
  - `supabase/migrations/YYYYMMDD000000_p5x_party_restructure.sql` — NEW

- [x] **Update P5X party service.** Update `memberFromRow`/`memberToRow` for new column names (`entity_id`, `slot_index`, `member_type`). Derive `member_type` from slot_index range on write.
  - `src/services/persona-5-phantom-x/partyService.ts`

- [x] **Rewrite P5X PartiesTab with slot config + groups.** Build entity union from `ALL_THIEVES` + `ALL_PERSONAS` tagged with `entityType`. Define `P5X_SLOTS` with `group` keys (fixed Wonder + 3 persona-filtered in group `'wonder'`, 3 thief-filtered in group `'thieves'`). Define `slotGroups` config mapping. Update `PartyViewConfig` for new slots, groups, and union entity type. Add Wonder image constant.
  - `src/pages/persona-5-phantom-x/components/PartiesTab.tsx`

- [x] **Add persona image helpers to imagekit.ts.** Add `getPersonaMugshotUrl` and `getPersonaAvatarUrl` transform functions for persona images (same pattern as thief images, dimensions may differ).
  - `src/lib/imagekit.ts`

- [x] **Update shared-parties spec.** Express as an OpenSpec delta (MODIFIED the P5X slot constraint scenario → "slot indices 1–6"; ADDED a "Configurable party slots" requirement) so archive applies it to the canonical spec — do not hand-edit the canonical spec directly.
  - `openspec/changes/p5x-party-restructure/specs/shared-parties/spec.md` — NEW (delta)

- [x] **Tests — shared component slot config + groups.** Test `PartyEditorModal` and `PartyCard` with custom `slots` + `slotGroups`: group panel rendering (label, accent class), fixed slot rendering, entityFilter narrowing, default fallback (no slots/groups = flat 4 uniform). Ensure existing game configs still pass unchanged.
  - `src/components/parties/PartiesView.test.tsx`

- [x] **Tests — P5X party service with new schema.** Test `memberFromRow`/`memberToRow` mapping with `entity_id` and `member_type`. Test save round-trip with persona + thief members at correct slot indices.
  - `src/services/persona-5-phantom-x/partyService.test.ts`
