# Design — track-hsr-trailblazer

## Context

- `scripts/update-hsr-data.mjs` drops Trailblazer source entries at the placeholder filter (`i.name.includes('{')` — StarRailRes names the protagonist `{NICKNAME}`). StarRailRes carries **two source IDs per path form** (one per gender, 8001/8002 style pairs).
- The script already has a two-pass duplicate-name mechanism (March 7th precedent) producing path-suffixed IDs; Trailblazer never reaches it.
- `HsrTrackedCharacter` rows persist via the roster-persistence config adapter (`characterService.ts` column map) and the Field Updater pattern in `useCharacters.ts`.
- HSR `PartiesTab` passes the **catalog** (`Character[]`) as party entities; slot/list images resolve from catalog `imageUrl` via `getMugshotUrl`/`getAvatarUrl`. The member picker already filters exact-ID duplicates (`PartyEditorModal.tsx` `filteredEntities`).
- See `proposal.md` for motivation; specs for behavior contracts.

## Goals / Non-Goals

**Goals:**

- Catalog generation, portrait assets, and ID scheme for Trailblazer forms — future forms flow through with no code change.
- Cosmetic portrait toggle with the smallest possible persistence surface (one boolean column).
- Generic, reusable mutual-exclusion seam in the shared party editor; HSR is its first consumer.

**Non-Goals:**

- Shared level/ascension across forms (in-game they share level; tracker treats forms as independent characters — accepted duplication).
- March 7th exclusion group (deliberately excluded by user decision).
- Save-time party validation or DB constraints for exclusion — prevention happens in the picker UI only.
- Gender as an account-wide setting — the choice is per tracked row.

## Decisions

### D1 — Per-form catalog entries (Option A)

One catalog entry per path form, exactly the March 7th duplicate-name model. Alternatives rejected: single entry + current-path field (path switch orphans build data keyed to one entity); single entry + per-form sub-records (new `form` dimension through relics, preference rows, scoring, UI — overkill for one character).

### D2 — Script special-case keyed on `{NICKNAME}`

In pass 1 of the character loop: entries whose source name is the `{NICKNAME}` placeholder are **not** dropped; they map to display name `Trailblazer (<Path>)` and are grouped by path. Each path group holds two gender variants; the group emits one catalog entry. Keying on the placeholder (not hardcoded ID lists) means a future form (new 800x pair) flows through automatically. Baking the path into the display name (rather than 5 × "Trailblazer") makes cards, party avatars, picker rows, and Fuse name-search distinguish forms without touching any search config; the existing duplicate-name pass then never triggers for these (names are unique) so IDs are assigned directly as `trailblazer_<path-slug>`.

### D3 — Gender source-ID convention

StarRailRes pairs carry an explicit `tag` field (`playerboy*` = Caelus, `playergirl*` = Stelle) — verified against live data (8001–8010, five pairs incl. Elation). Gender is keyed off the tag, with even-source-ID parity as fallback. The special case takes the **female (Stelle) icon as `imageUrl`** and the male icon as `altImageUrl` (user decision: Stelle default). Both go through `ensureAsset` idempotently; alt asset filename `trailblazer_<path-slug>_alt.webp`.

### D4 — Persistence: one boolean column

`hsr_tracked_characters.use_alt_portrait BOOLEAN NOT NULL DEFAULT false`. Boolean over a gender-text column: the domain concept at persistence level is "use the alternate portrait" — survives any future alt-skin use unchanged, needs no CHECK constraint, defaults cleanly. `HsrTrackedCharacter.useAltPortrait: boolean`; column-map entry in `characterService.ts`; plain data-declared Field Updater in `useCharacters.ts` (no custom body — it reads no current state).

### D5 — Toggle UI in card edit mode

A `SegmentedButtons` pair (Stelle / Caelus) in the card's edit sections, rendered only when `char.altImageUrl` is set. Header image becomes `useAltPortrait && char.altImageUrl ? char.altImageUrl : char.imageUrl`. No new CSS pattern; no change to any non-Trailblazer card. Edit-mode placement (not a header icon) keeps the header uncluttered and follows the "mutations live in explicit controls" convention.

### D6 — Party avatars: page-level entity mapping, no PartiesView change

`HsrPage` (or wherever `availableCharacters` is assembled for `PartiesTab`) maps tracked state onto the catalog before passing entities: for a character with `altImageUrl` whose tracked row has `useAltPortrait`, substitute `imageUrl` with `altImageUrl`. `resolveSlotImage`/`resolveListImage` stay untouched; untracked Trailblazer forms in a party fall back to Stelle. Alternative rejected: threading a tracked-row lookup into `PartyViewConfig` — larger seam for a purely cosmetic concern.

### D7 — Exclusion seam: `exclusionGroup` on `PartyViewConfig`

```ts
/** Entities sharing a non-null key are mutually exclusive within one party. */
exclusionGroup?: (entity: E) => string | null;
```

`PartyEditorModal.filteredEntities` gains one clause: exclude `e` when some selected member's entity has the same non-null group key. Requires resolving member `entityId` → entity (already have `entities` in scope). HSR config: `(char) => (char.id.startsWith('trailblazer_') ? 'trailblazer' : null)`. Prevention in the picker means no error path, no save-time validation, no DB constraint. Alternatives rejected: save-time validation (worse UX, new error plumbing); slot-level `entityFilter` (per-slot, can't see other slots' members).

## Risks / Trade-offs

- [StarRailRes gender-ID parity assumption wrong] → D3 fallback: key gender off icon path; implementation verifies against live data first.
- [Existing users' parties could already contain… ] — not possible: no Trailblazer entries existed, so no legacy invalid parties.
- [Level duplicated across forms (game shares it)] → accepted; user tracks only forms they play.
- [Editing a party where an exclusion-group entity was hand-inserted into DB] → picker hides alternatives but existing members render fine; no data repair needed.
- [`characters.ts` is generated — `altImageUrl` interface change lives in codegen] → the interface is emitted by the script; change the codegen template, never the generated file.
- [Non-atomic preference saves known limitation] → unchanged; new forms inherit it like any character.

## Migration Plan

1. Migration `ALTER TABLE hsr_tracked_characters ADD COLUMN use_alt_portrait BOOLEAN NOT NULL DEFAULT false;` — additive, no backfill, RLS unchanged.
2. Script change merges first; run `node scripts/update-hsr-data.mjs` to regenerate `characters.ts` + upload 10 portraits.
3. UI/service/hook changes ship with the regenerated catalog in the same change.
4. Rollback: revert code; column is additive and inert if unused; catalog entries disappear on regeneration from reverted script (tracked rows for removed IDs are already tolerated by the catalog-merge load path).

## Open Questions

- Exact StarRailRes source IDs for the Elation pair (resolved trivially at implementation time from live data; D2 keys on the placeholder, not IDs).
