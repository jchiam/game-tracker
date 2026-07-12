import { ALL_CHARACTERS as RAW_ALL_CHARACTERS, type N2ECharacter } from './characters';

// App-level image preferences, decoupled from the weekly-regenerated catalog (characters.ts).
// Some espers ship with more than one bust; the update script saves every variant as an asset
// (ALT_VARIANTS in scripts/update-n2e-data.mjs) but only emits one catalog entry. Repoint the
// catalog entry's imageUrl here to choose which saved art the app displays.
const IMAGE_OVERRIDES: Record<string, string> = {
  // Zero ships as male (canonical `zero.webp`) and female (`zero-female.webp`) busts — prefer female.
  zero: '/assets/neverness-to-everness/characters/zero-female.webp',
};

/** Catalog with app-level image overrides applied. Use this instead of the raw generated array. */
export const ALL_CHARACTERS: N2ECharacter[] = RAW_ALL_CHARACTERS.map((c) =>
  IMAGE_OVERRIDES[c.id] ? { ...c, imageUrl: IMAGE_OVERRIDES[c.id] } : c,
);
