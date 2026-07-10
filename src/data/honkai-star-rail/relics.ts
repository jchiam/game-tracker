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

// Pools are ordered per the shared semantic stat ordering: Offensive → Defensive →
// Tempo → Supporting (flat before its percent within a bucket). See shared-ui-components.
export const MAIN_STATS = {
  HEAD: ['HP'],
  HANDS: ['ATK'],
  BODY: [
    'ATK%',
    'CRIT Rate',
    'CRIT DMG',
    'HP%',
    'DEF%',
    'Outgoing Healing Boost',
    'Effect Hit Rate',
  ],
  FEET: ['ATK%', 'HP%', 'DEF%', 'SPD'],
  SPHERE: [
    'ATK%',
    'Physical DMG Boost',
    'Fire DMG Boost',
    'Ice DMG Boost',
    'Lightning DMG Boost',
    'Wind DMG Boost',
    'Quantum DMG Boost',
    'Imaginary DMG Boost',
    'HP%',
    'DEF%',
  ],
  ROPE: ['ATK%', 'Break Effect', 'HP%', 'DEF%', 'Energy Regeneration Rate'],
};

export const SUB_STATS = [
  // Offensive
  'ATK',
  'ATK%',
  'CRIT Rate',
  'CRIT DMG',
  'Break Effect',
  // Defensive
  'HP',
  'HP%',
  'DEF',
  'DEF%',
  'Effect RES',
  // Tempo
  'SPD',
  // Supporting
  'Effect Hit Rate',
];
