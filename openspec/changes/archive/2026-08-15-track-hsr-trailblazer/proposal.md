# Track HSR Trailblazer

## Why

The HSR character catalog has no Trailblazer entries: StarRailRes stores the protagonist's name as the `{NICKNAME}` placeholder, which the update script's placeholder filter drops. The Trailblazer now has five path forms (Destruction, Preservation, Harmony, Remembrance, Elation) — each with its own element, relics, light cone, and traces in-game — and none of them can be tracked.

## What Changes

- The HSR update script special-cases the `{NICKNAME}` placeholder: instead of dropping Trailblazer entries, it emits one catalog entry per path form with a distinct display name — `Trailblazer (Destruction)`, `Trailblazer (Preservation)`, `Trailblazer (Harmony)`, `Trailblazer (Remembrance)`, `Trailblazer (Elation)` — and stable ID `trailblazer_{path}`. Gender-duplicate source entries (two StarRailRes IDs per form) are deduplicated to one entry per path.
- Both gender portraits are downloaded and uploaded to ImageKit per form. The `Character` catalog interface gains an optional `altImageUrl` field: `imageUrl` is Stelle (female, default), `altImageUrl` is Caelus (male).
- Tracked HSR characters gain a cosmetic display-gender toggle (new nullable DB column). The roster card and party slot avatars render the alternate portrait when toggled. The toggle only appears on catalog entries that carry `altImageUrl` — no UI change for any other character.
- The shared party editor gains a config-level mutual-exclusion seam (`exclusionGroup` on `PartyViewConfig`): entities sharing a non-null group key cannot co-exist in one party; the member picker hides conflicting entries. HSR assigns the five Trailblazer forms to one exclusion group. Other games are unaffected. (March 7th's two forms are deliberately out of scope.)
- Each Trailblazer form tracks independently — level, traces, relics, light cone, build preferences, score — exactly like any other character (the March 7th duplicate-name precedent).

## Capabilities

### New Capabilities

- `hsr-trailblazer-tracking`: Trailblazer catalog generation (per-form entries from the `{NICKNAME}` placeholder, gender dedup, dual portrait assets, `altImageUrl`), the cosmetic display-gender toggle on tracked rows, and gender-aware portrait resolution on roster cards and party avatars.

### Modified Capabilities

- `shared-parties`: New requirement — the party member picker SHALL exclude entities whose configured exclusion group matches an already-selected member's group, preventing mutually exclusive entities (e.g. two Trailblazer forms) from being placed in one party.

## Impact

- `scripts/update-hsr-data.mjs` — Trailblazer special-case in the character passes (name mapping, gender dedup, dual image assets).
- `src/data/honkai-star-rail/characters.ts` — regenerated with 5 new entries + `altImageUrl` on the interface (generated file; script change drives it).
- `src/types.ts` — `HsrTrackedCharacter` gains the display-gender field.
- `supabase/migrations/` — new migration adding the nullable display-gender column to `hsr_tracked_characters`.
- `src/services/honkai-star-rail/characterService.ts`, `src/hooks/honkai-star-rail/useCharacters.ts` — column mapping + plain Field Updater for the new field.
- `src/pages/honkai-star-rail/components/CharacterCard.tsx` — gender toggle (TB-only) + portrait resolution.
- `src/components/parties/PartiesView.tsx`, `PartyEditorModal.tsx` — `exclusionGroup` config seam.
- `src/pages/honkai-star-rail/components/PartiesTab.tsx` — wires the Trailblazer exclusion group and gender-aware avatar resolution.
- ImageKit — 10 new portrait assets (5 forms × 2 genders).
