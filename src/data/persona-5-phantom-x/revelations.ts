// Static Revelation Card catalog for P5X.
// Sets sourced from Prydwen/Fragster; stat pools from Prydwen Arcana Cards guide.

export interface RevelationStat {
  type: string;
  value: number;
}

export interface EquippedRevelation {
  setId: string | null;
  mainStat: string | null;
  subStats: RevelationStat[];
}

export type RevelationSlot = 'sun' | 'moon' | 'star' | 'sky' | 'space';

export interface HeavensSet {
  id: string;
  name: string;
  twoSetEffect: string;
  fourSetEffect: string;
}

export interface SpaceSet {
  id: string;
  name: string;
  effect: string;
}

export interface CardRarity {
  id: string;
  label: string;
  color: string;
  maxSubStats: number;
}

export const REVELATION_SLOTS: RevelationSlot[] = ['sun', 'moon', 'star', 'sky', 'space'];

export const HEAVENS_SLOTS: RevelationSlot[] = ['sun', 'moon', 'star', 'sky'];

export const ALL_HEAVENS_SETS: HeavensSet[] = [
  {
    id: 'abundance',
    name: 'Abundance',
    twoSetEffect: '8% damage reduction',
    fourSetEffect: '25% highlight gauge at battle start',
  },
  {
    id: 'completion',
    name: 'Completion',
    twoSetEffect: '10% electric damage',
    fourSetEffect: '9% electric damage buff (stacks 3x)',
  },
  {
    id: 'dominion',
    name: 'Dominion',
    twoSetEffect: '12% max health',
    fourSetEffect: '8% health as bonus damage',
  },
  {
    id: 'interference',
    name: 'Interference',
    twoSetEffect: '10% curse damage',
    fourSetEffect: '20% curse damage vs debuffed enemies',
  },
  {
    id: 'love',
    name: 'Love',
    twoSetEffect: '9% healing effect',
    fourSetEffect: '23% healing boost for sub-50% allies',
  },
  {
    id: 'luxury',
    name: 'Luxury',
    twoSetEffect: '10% ice damage',
    fourSetEffect: '40% resonance damage',
  },
  {
    id: 'peace',
    name: 'Peace',
    twoSetEffect: '20% defense',
    fourSetEffect: '18% shield increase',
  },
  {
    id: 'power',
    name: 'Power',
    twoSetEffect: '12% attack',
    fourSetEffect: '10% attack (6 turns, stacks 3x)',
  },
  {
    id: 'science',
    name: 'Science',
    twoSetEffect: '10% nuclear damage',
    fourSetEffect: '30% skill damage boost vs ailmented targets',
  },
  {
    id: 'strife',
    name: 'Strife',
    twoSetEffect: '10% fire damage',
    fourSetEffect: '15% attack (30% if enemy weak to fire)',
  },
  {
    id: 'valor',
    name: 'Valor',
    twoSetEffect: '10% physical damage',
    fourSetEffect: '30% crit damage (2 turns, reactivates on crit)',
  },
  {
    id: 'victory',
    name: 'Victory',
    twoSetEffect: '10% wind damage',
    fourSetEffect: '25% chance for 20% bonus attack damage',
  },
];

export const ALL_SPACE_SETS: SpaceSet[] = [
  { id: 'acceptance', name: 'Acceptance', effect: 'Increases attacking power after healing' },
  { id: 'awareness', name: 'Awareness', effect: 'Increases damage vs ailing foes by 12%' },
  { id: 'departure', name: 'Departure', effect: 'Increases damage after defeating an enemy' },
  {
    id: 'faith',
    name: 'Faith',
    effect: 'Defense further buffed every time the user gains shields',
  },
  { id: 'growth', name: 'Growth', effect: 'Enhances character growth stats' },
  { id: 'harmony', name: 'Harmony', effect: 'Party-wide 5% nuke damage boost on ailment inflict' },
  {
    id: 'meditation',
    name: 'Meditation',
    effect: 'Physical and electrical damage +12%, +24% vs solo target',
  },
  { id: 'trust', name: 'Trust', effect: 'Party-wide damage boost when user buffs an ally' },
];

export const MAIN_STATS: Record<Uppercase<RevelationSlot>, string[]> = {
  SUN: ['HP'],
  MOON: ['ATK%', 'DEF%', 'HP%', 'HP Recovery%', 'DMG Multiplier%'],
  STAR: ['ATK%', 'DEF%', 'HP%', 'Crit Rate%', 'Crit Multiplier%', 'Ailment Accuracy%'],
  SKY: ['ATK%', 'DEF%', 'HP%', 'Speed', 'SP Recovery%'],
  SPACE: ['ATK & DEF'],
};

export const SUB_STATS: string[] = [
  'ATK',
  'ATK%',
  'DEF',
  'DEF%',
  'HP',
  'HP%',
  'DMG Multiplier%',
  'Ailment Accuracy%',
  'Crit Rate%',
  'Crit Multiplier%',
  'Speed',
  'SP Recovery%',
  'Pierce Rate%',
];

export const CARD_RARITIES: CardRarity[] = [
  { id: 'common', label: 'Common', color: 'gray', maxSubStats: 2 },
  { id: 'rare', label: 'Rare', color: 'blue', maxSubStats: 3 },
  { id: 'epic', label: 'Epic', color: 'purple', maxSubStats: 4 },
  { id: 'legendary', label: 'Legendary', color: 'orange', maxSubStats: 4 },
];
