// Hand-maintained Memory Fragment domain model — slot structure and stat pools
// are game knowledge not derivable from the Prydwen chunk (the generated set
// catalog lives in fragment_sets.ts). Single source for both the fragment
// editor and the scoring adapter; neither may re-declare these pools.
// Spelling follows Prydwen's Memory Fragments stats guide.

export type CznFragmentSlot = 1 | 2 | 3 | 4 | 5 | 6;
export type CznFixedMainSlot = 1 | 2 | 3;
export type CznVariableMainSlot = 4 | 5 | 6;

export interface CznEquippedFragment {
  setId: string | null;
  mainStat: string | null;
  subStats: string[];
}

export const CZN_FRAGMENT_SLOTS: CznFragmentSlot[] = [1, 2, 3, 4, 5, 6];
export const CZN_VARIABLE_MAIN_SLOTS: CznVariableMainSlot[] = [4, 5, 6];

/** In-game slot type names, by slot number. */
export const CZN_FRAGMENT_SLOT_NAMES: Record<CznFragmentSlot, string> = {
  1: 'Shock',
  2: 'Suppression',
  3: 'Denial',
  4: 'Ideal',
  5: 'Desire',
  6: 'Imagination',
};

/** Roman numerals the game labels slots with; also the empty-cell glyph. */
export const CZN_FRAGMENT_SLOT_NUMERALS: Record<CznFragmentSlot, string> = {
  1: 'I',
  2: 'II',
  3: 'III',
  4: 'IV',
  5: 'V',
  6: 'VI',
};

/** Slots 1–3 have fixed main stats in game. */
export const CZN_FRAGMENT_FIXED_MAINS: Record<CznFixedMainSlot, string> = {
  1: 'Flat ATK',
  2: 'Flat DEF',
  3: 'Flat HP',
};

/** Variable main-stat pools, ordered offensive → utility → defensive. */
export const CZN_FRAGMENT_MAIN_STATS: Record<CznVariableMainSlot, string[]> = {
  4: ['Critical Chance%', 'Critical Damage%', 'ATK%', 'HP%'],
  5: [
    'ATK%',
    'Passion Damage%',
    'Order Damage%',
    'Justice Damage%',
    'Void Damage%',
    'Instinct Damage%',
    'HP%',
  ],
  6: ['ATK%', 'Ego Recovery', 'HP%', 'DEF%'],
};

/** Substat pool — the same for every slot and set; up to four per piece. */
export const CZN_FRAGMENT_SUB_STATS: string[] = [
  'Flat ATK',
  'ATK%',
  'Critical Chance%',
  'Critical Damage%',
  'Extra Damage%',
  'Damage over Time%',
  'Ego Recovery',
  'Flat HP',
  'HP%',
  'Flat DEF',
  'DEF%',
];
