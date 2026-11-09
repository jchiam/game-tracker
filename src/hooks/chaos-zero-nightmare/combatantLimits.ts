// Tracked-field bounds shared by the hook (clamping) and the card (slider /
// rung controls). Kept free of service imports so component tests never pull
// the Supabase client in through the hook module.

/** End-game level cap: base 60 + 2 from Unconscious Awakening. Paired with the DB CHECK. */
export const CZN_MAX_LEVEL = 62;
/** Manifest Ego ranks: 0 base, 1–6 dupe unlocks (shown as T0–T6). */
export const CZN_MAX_EGO = 6;
