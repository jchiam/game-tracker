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
    id: 'control',
    name: 'Control',
    twoSetEffect: '12% max health',
    fourSetEffect: '8% health as bonus damage',
  },
  {
    id: 'courage',
    name: 'Courage',
    twoSetEffect: '10% physical damage',
    fourSetEffect: '30% crit damage (2 turns, reactivates on crit)',
  },
  {
    id: 'hindrance',
    name: 'Hindrance',
    twoSetEffect: '10% curse damage',
    fourSetEffect: '20% skill damage vs debuffed enemies',
  },
  {
    id: 'love',
    name: 'Love',
    twoSetEffect: '9% healing effect',
    fourSetEffect: '23% healing boost for sub-50% allies',
  },
  {
    id: 'opulence',
    name: 'Opulence',
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
    id: 'prosperity',
    name: 'Prosperity',
    twoSetEffect: '8% damage reduction',
    fourSetEffect: '25% highlight gauge at battle start',
  },
  {
    id: 'renewal',
    name: 'Renewal',
    twoSetEffect: '10% electric damage',
    fourSetEffect: '9% electric damage buff (stacks 3x)',
  },
  {
    id: 'strife',
    name: 'Strife',
    twoSetEffect: '10% fire damage',
    fourSetEffect: '15% attack (30% if enemy weak to fire)',
  },
  {
    id: 'truth',
    name: 'Truth',
    twoSetEffect: '10% nuclear damage',
    fourSetEffect: '30% skill damage boost vs ailmented targets',
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

/**
 * Verbatim in-game stat labels, keyed by stable stat id. The id is what's persisted
 * (on `EquippedRevelation.mainStat` / `RevelationStat.type` and preference rows); the
 * label is display-only, mirroring the game's own text — the stat noun stays full and
 * only the trailing modifier is abbreviated (Multiplier → "Mult.", Accuracy → "Acc."),
 * with a trailing "%" (no space) marking only the Attack/Defense/HP percent variants.
 * Re-pinning a label never invalidates a saved row.
 */
export const STAT_LABELS: Record<string, string> = {
  attack: 'Attack',
  'attack-pct': 'Attack%',
  defense: 'Defense',
  'defense-pct': 'Defense%',
  hp: 'HP',
  'hp-pct': 'HP%',
  'hp-recovery': 'HP Recovery',
  'damage-mult': 'Damage Mult. +',
  'crit-rate': 'Crit Rate',
  'crit-mult': 'Crit Mult.',
  'ailment-acc': 'Ailment Acc.',
  speed: 'Speed',
  'sp-recovery': 'SP Recovery',
  'pierce-rate': 'Pierce Rate',
};

/** Resolve a stat id to its verbatim in-game label; an unknown id falls back to itself. */
export const statLabel = (id: string): string => STAT_LABELS[id] ?? id;

/** Map stat ids to `{ value, label }` option objects for the shared input primitives. */
export const toStatOptions = (ids: readonly string[]): { value: string; label: string }[] =>
  ids.map((id) => ({ value: id, label: statLabel(id) }));

// Per-slot main stat pools, expressed as stat ids. SUN (`hp`) and SPACE (`attack`,
// `defense`) are fixed — not user-selectable; SPACE carries two fixed mains. MOON/STAR/SKY
// are variable pools chosen from these ids.
// Pools are ordered per the shared semantic stat ordering: Offensive → Defensive →
// Tempo → Supporting (flat before its percent within a bucket). See shared-ui-components.
export const MAIN_STATS: Record<Uppercase<RevelationSlot>, string[]> = {
  SUN: ['hp'],
  MOON: ['attack-pct', 'damage-mult', 'hp-pct', 'defense-pct', 'hp-recovery'],
  STAR: ['attack-pct', 'crit-rate', 'crit-mult', 'hp-pct', 'defense-pct', 'ailment-acc'],
  SKY: ['attack-pct', 'hp-pct', 'defense-pct', 'speed', 'sp-recovery'],
  SPACE: ['attack', 'defense'],
};

/** Slots whose main stats are fixed (not chosen from a pool): Sun (one) and Space (two). */
export const FIXED_MAIN_SLOTS: RevelationSlot[] = ['sun', 'space'];

export const SUB_STATS: string[] = [
  // Offensive
  'attack',
  'attack-pct',
  'crit-rate',
  'crit-mult',
  'damage-mult',
  'pierce-rate',
  // Defensive
  'hp',
  'hp-pct',
  'defense',
  'defense-pct',
  // Tempo
  'speed',
  'sp-recovery',
  // Supporting
  'ailment-acc',
];

export const CARD_RARITIES: CardRarity[] = [
  { id: 'common', label: 'Common', color: 'gray', maxSubStats: 2 },
  { id: 'rare', label: 'Rare', color: 'blue', maxSubStats: 3 },
  { id: 'epic', label: 'Epic', color: 'purple', maxSubStats: 4 },
  { id: 'legendary', label: 'Legendary', color: 'orange', maxSubStats: 4 },
];
