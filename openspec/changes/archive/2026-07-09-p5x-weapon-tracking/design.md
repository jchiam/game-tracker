## Context

P5X tracked Thieves currently have no weapon investment tracking. This change adds three scalar fields — `weaponRarity`, `weaponLevel`, `weaponForge` — following the established per-game field extension pattern (most recently: skill tracking, mindscape). No weapon catalog is needed because P5X weapons are character-locked (unlike AE's type-shared weapons).

## Goals / Non-Goals

**Goals:**

- Track weapon rarity (2–5★), level (1–80), and forge (0–6) per Thief
- Surface weapon investment in the card's collapsed summary and edit body
- Keep weapon section inert until user opts in by setting a rarity (null → set)
- Reuse existing shared components: `SegmentedButtons`, `LevelSlider`, `ProgressSection`, `StatChip`

**Non-Goals:**

- Weapon catalog or weapon-by-name tracking (character-locked weapons make this unnecessary)
- Weapon overclock as a separate dimension (overclock is the level-cap-unlock mechanic; level 1–80 captures the end result)
- Weapon passive/skill tracking
- Update script changes (no weapon data source on Prydwen)
- Party/lineup changes

## Decisions

**Three scalar fields, not a weapon reference**
AE tracks `weaponName` (a reference into `ALL_WEAPONS`) because weapons are type-shared. P5X weapons are character-locked — the user doesn't need to pick from a catalog. Rarity + level + forge are the only meaningful investment dimensions. This avoids a weapon catalog, a weapon data file, and the equip-by-name UI.

**Nullable rarity as opt-in gate**
`weaponRarity` is nullable (null = not tracking). `weaponLevel` and `weaponForge` have defaults (1 and 0). The card summary chip and edit section only render when rarity is set. This keeps cards clean for Thieves where the user hasn't started tracking weapons, matching the skill-progress pattern (no chip when both booleans are false).

**Rarity uses static coloring, forge uses investment coloring**
Rarity is a fixed property of the equipped weapon — `coloring="static"` with per-rarity modifier classes (matching the existing badge color idiom). Forge represents progressive investment — `coloring="investment"` (like awareness A0–A6).

**Weapon level slider reuses the same 1–80 range as the thief level slider**
Coincidental match with the thief level cap. Same `LevelSlider` component, same `getProgressStyle(level, 1, 80)`.

**Single summary chip for weapon**
Collapsed summary shows one chip combining rarity and forge: `⚔ 5★ F4`. Two chips would overcrowd the summary row (already has Lv, Awareness, optional Skills, optional MS). Level is omitted from the chip — it's granular data better shown in edit mode, and including it would make the chip too wide.

**Edit section placed after Mindscape**
Weapon is a separate equipment concern from the Thief's personal progression. Section order: Level → Awareness → Skills → Mindscape → Weapon. This keeps personal investment fields grouped, with equipment at the bottom.

## Risks / Trade-offs

- Weapon level range (1–80) matches the current game cap. A future cap raise needs a paired slider-max + DB CHECK change — same risk as thief level, same mitigation.
- Forge range (0–6) follows community documentation. If a future update raises the forge cap, the segmented buttons and CHECK constraint need updating.
- No weapon name means the tracker can't answer "which weapon is equipped" — only the investment level. This is deliberate: the user cares about investment planning, not inventory management.

## Open Questions

None.
