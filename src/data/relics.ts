export interface RelicSet {
  id: string;
  name: string;
  icon: string;
}

export interface RelicStat {
  type: string;
  value: string;
}

export interface EquippedRelic {
  setId: string | null;
  mainStat: string | null;
  subStats: RelicStat[];
}

export const MAIN_STATS = {
  HEAD: ['HP'],
  HANDS: ['ATK'],
  BODY: [
    'HP%',
    'ATK%',
    'DEF%',
    'CRIT Rate',
    'CRIT DMG',
    'Outgoing Healing Boost',
    'Effect Hit Rate',
  ],
  FEET: ['HP%', 'ATK%', 'DEF%', 'SPD'],
  SPHERE: [
    'HP%',
    'ATK%',
    'DEF%',
    'Physical DMG Boost',
    'Fire DMG Boost',
    'Ice DMG Boost',
    'Lightning DMG Boost',
    'Wind DMG Boost',
    'Quantum DMG Boost',
    'Imaginary DMG Boost',
  ],
  ROPE: ['HP%', 'ATK%', 'DEF%', 'Break Effect', 'Energy Regeneration Rate'],
};

export const SUB_STATS = [
  'HP',
  'ATK',
  'DEF',
  'HP%',
  'ATK%',
  'DEF%',
  'SPD',
  'CRIT Rate',
  'CRIT DMG',
  'Effect Hit Rate',
  'Effect RES',
  'Break Effect',
];
