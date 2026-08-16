// Hand-maintained Drive Disc domain model — slot structure and stat pools are
// game knowledge not derivable from the Enka store (the generated suit catalog
// lives in disc_suits.ts). Single source for both the disc editor and the
// scoring adapter; neither may re-declare these pools.

export type ZzzDiscSlot = 1 | 2 | 3 | 4 | 5 | 6;
export type ZzzFixedMainSlot = 1 | 2 | 3;
export type ZzzVariableMainSlot = 4 | 5 | 6;

export interface ZzzEquippedDisc {
  suitId: string | null;
  mainStat: string | null;
  subStats: string[];
}

export const ZZZ_DISC_SLOTS: ZzzDiscSlot[] = [1, 2, 3, 4, 5, 6];
export const ZZZ_VARIABLE_MAIN_SLOTS: ZzzVariableMainSlot[] = [4, 5, 6];

/** Slots 1–3 have fixed main stats in game. */
export const ZZZ_DISC_FIXED_MAINS: Record<ZzzFixedMainSlot, string> = {
  1: 'HP',
  2: 'ATK',
  3: 'DEF',
};

/** Variable main-stat pools, ordered offensive → utility → defensive. */
export const ZZZ_DISC_MAIN_STATS: Record<ZzzVariableMainSlot, string[]> = {
  4: ['CRIT Rate', 'CRIT DMG', 'ATK%', 'Anomaly Proficiency', 'HP%', 'DEF%'],
  5: [
    'ATK%',
    'PEN Ratio',
    'Physical DMG Bonus',
    'Fire DMG Bonus',
    'Ice DMG Bonus',
    'Electric DMG Bonus',
    'Ether DMG Bonus',
    'HP%',
    'DEF%',
  ],
  6: ['ATK%', 'Impact', 'Anomaly Mastery', 'Energy Regen', 'HP%', 'DEF%'],
};

export const ZZZ_DISC_SUB_STATS: string[] = [
  'ATK',
  'ATK%',
  'CRIT Rate',
  'CRIT DMG',
  'PEN',
  'Anomaly Proficiency',
  'HP',
  'HP%',
  'DEF',
  'DEF%',
];
