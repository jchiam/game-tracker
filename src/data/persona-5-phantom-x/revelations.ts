// Static Revelation Card catalog for P5X.
// Canonical source: Game8 "List of All Revelation Cards"
// (game8.co/games/Persona-5-Phantom-X/archives/532937) + its per-set pages.
// Manually maintained — the P5X update script scrapes only thieves/personas
// (Prydwen has no scrapeable card data), so re-align this file against Game8 by hand.
// Heavens effects are condensed from the Game8 set effects; Space `effect` names the
// Heavens sets each Space card pairs with (Space bonuses are pairing-conditional, not
// standalone). Stat pools follow the in-game Arcana stat guide.

export interface EquippedRevelation {
  setId: string | null;
  mainStat: string | null;
  subStats: string[];
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

// Space-first display order: the equip editor and consolidated set summary lead with the
// Space card. Heavens grouping uses HEAVENS_SLOTS below, independent of this order.
export const REVELATION_SLOTS: RevelationSlot[] = ['space', 'sun', 'moon', 'star', 'sky'];

export const HEAVENS_SLOTS: RevelationSlot[] = ['sun', 'moon', 'star', 'sky'];

export const ALL_HEAVENS_SETS: HeavensSet[] = [
  {
    id: 'change',
    name: 'Change',
    twoSetEffect: '10% electric damage',
    fourSetEffect: '25% attack (2 turns, reactivates on crit)',
  },
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
    id: 'defeat',
    name: 'Defeat',
    twoSetEffect: '15% ailment accuracy',
    fourSetEffect: '20% fire damage vs debuffed enemies',
  },
  {
    id: 'disappointment',
    name: 'Disappointment',
    twoSetEffect: '12% attack',
    fourSetEffect: '25% skill damage when attribute differs from last skill',
  },
  {
    id: 'futility',
    name: 'Futility',
    twoSetEffect: '12% attack',
    fourSetEffect: '30% ailment accuracy (2 turns, reactivates after Technical)',
  },
  {
    id: 'hindrance',
    name: 'Hindrance',
    twoSetEffect: '10% curse damage',
    fourSetEffect: '20% skill damage vs debuffed enemies',
  },
  {
    id: 'labor',
    name: 'Labor',
    twoSetEffect: '12% max health',
    fourSetEffect: '8% party max HP/attack/defense in battle',
  },
  {
    id: 'love',
    name: 'Love',
    twoSetEffect: '9% healing effect',
    fourSetEffect: '23% healing boost for sub-50% allies',
  },
  {
    id: 'oppression',
    name: 'Oppression',
    twoSetEffect: '10% physical damage',
    fourSetEffect: '5% attack per Malice stack (2 turns, stacks 6x)',
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
    id: 'pleasure',
    name: 'Pleasure',
    twoSetEffect: '10% psychokinesis damage',
    fourSetEffect: '15% attack (30% if 4+ foes on field)',
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
    id: 'prudence',
    name: 'Prudence',
    twoSetEffect: '-3 speed, +18% attack',
    fourSetEffect: '16% damage',
  },
  {
    id: 'reconciliation',
    name: 'Reconciliation',
    twoSetEffect: '+6 speed',
    fourSetEffect: '15% max HP/attack/defense in battle',
  },
  {
    id: 'renewal',
    name: 'Renewal',
    twoSetEffect: '10% electric damage',
    fourSetEffect: '9% electric damage buff (stacks 3x)',
  },
  {
    id: 'ruin',
    name: 'Ruin',
    twoSetEffect: '12% attack',
    fourSetEffect: '25% attack (3 turns, reactivates after Theurgy)',
  },
  {
    id: 'sorrow',
    name: 'Sorrow',
    twoSetEffect: '12% attack',
    fourSetEffect: '20% damage (3 turns, reactivates on Highlight)',
  },
  {
    id: 'strife',
    name: 'Strife',
    twoSetEffect: '10% fire damage',
    fourSetEffect: '15% attack (30% if enemy weak to fire)',
  },
  {
    id: 'triumph',
    name: 'Triumph',
    twoSetEffect: '7.5% crit rate',
    fourSetEffect: '40% resonance damage',
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
  {
    id: 'virtue',
    name: 'Virtue',
    twoSetEffect: '10% bless damage',
    fourSetEffect: '12% crit rate for Bless skills at 50%+ HP',
  },
  {
    id: 'worry',
    name: 'Worry',
    twoSetEffect: '80% SP recovery',
    fourSetEffect: '25% highlight gauge at battle start',
  },
];

// Space set bonuses are pairing-conditional: each Space card grants effects only in
// combination with specific Heavens sets (e.g. Integrity's page lists "Integrity & Pleasure"
// and "Integrity & Labor"). There is no standalone one-liner, so `effect` factually names the
// Heavens sets each pairs with (from the Game8 list) rather than asserting numbers.
export const ALL_SPACE_SETS: SpaceSet[] = [
  {
    id: 'acceptance',
    name: 'Acceptance',
    effect: 'Paired bonuses with Love, Strife, and Peace sets',
  },
  {
    id: 'awareness',
    name: 'Awareness',
    effect: 'Paired bonuses with Truth, Control, and Hindrance sets',
  },
  { id: 'creation', name: 'Creation', effect: 'Paired bonuses with Worry and Reconciliation sets' },
  {
    id: 'departure',
    name: 'Departure',
    effect: 'Paired bonuses with Control, Prosperity, and Hindrance sets',
  },
  { id: 'faith', name: 'Faith', effect: 'Paired bonuses with Love and Peace sets' },
  { id: 'freedom', name: 'Freedom', effect: 'Paired bonuses with Triumph and Defeat sets' },
  { id: 'growth', name: 'Growth', effect: 'Paired bonuses with Opulence, Renewal, and Power sets' },
  {
    id: 'harmony',
    name: 'Harmony',
    effect: 'Paired bonuses with Victory, Power, and Truth sets',
  },
  { id: 'hope', name: 'Hope', effect: 'Paired bonuses with Labor and Ruin sets' },
  { id: 'integrity', name: 'Integrity', effect: 'Paired bonuses with Pleasure and Labor sets' },
  {
    id: 'meditation',
    name: 'Meditation',
    effect: 'Paired bonuses with Love, Courage, and Opulence sets',
  },
  { id: 'nativity', name: 'Nativity', effect: 'Paired bonus with Power set' },
  {
    id: 'perseverance',
    name: 'Perseverance',
    effect: 'Paired bonuses with Change and Sorrow sets',
  },
  {
    id: 'resolve',
    name: 'Resolve',
    effect: 'Paired bonuses with Virtue, Labor, and Prudence sets',
  },
  {
    id: 'trust',
    name: 'Trust',
    effect: 'Paired bonuses with Renewal, Power, and Prosperity sets',
  },
  {
    id: 'wisdom',
    name: 'Wisdom',
    effect: 'Paired bonuses with Oppression, Pleasure, and Virtue sets',
  },
];

export interface RevelationSetBonus {
  id: string;
  name: string;
  pieces: 2 | 4;
}

export interface RevelationSummary {
  spaceSet: { id: string; name: string } | null;
  heavensBonuses: RevelationSetBonus[];
}

/**
 * Consolidate equipped revelations into their active set bonuses — the single source for every
 * set display (summary chip + edit readout). Heavens sets group over HEAVENS_SLOTS: a set with
 * ≥2 matching cards grants a bonus (2pc for 2–3 cards, 4pc for 4); single-card sets are omitted.
 * Ordered 4pc → 2pc, then by name. The Space slot's set (if any) is resolved separately. Callers
 * render the Space set first, then the Heavens bonuses.
 */
export function getRevelationSummary(
  revelations: Record<RevelationSlot, EquippedRevelation | null>,
): RevelationSummary {
  const counts: Record<string, number> = {};
  for (const slot of HEAVENS_SLOTS) {
    const setId = revelations[slot]?.setId;
    if (setId) counts[setId] = (counts[setId] ?? 0) + 1;
  }
  const heavensBonuses: RevelationSetBonus[] = Object.entries(counts)
    .filter(([, n]) => n >= 2)
    .map(([id, n]) => ({
      id,
      name: ALL_HEAVENS_SETS.find((s) => s.id === id)?.name ?? id,
      pieces: (n >= 4 ? 4 : 2) as 2 | 4,
    }))
    .sort((a, b) => b.pieces - a.pieces || a.name.localeCompare(b.name));

  const spaceSetId = revelations.space?.setId ?? null;
  const spaceSet = spaceSetId
    ? { id: spaceSetId, name: ALL_SPACE_SETS.find((s) => s.id === spaceSetId)?.name ?? spaceSetId }
    : null;

  return { spaceSet, heavensBonuses };
}

/**
 * Verbatim in-game stat labels, keyed by stable stat id. The id is what's persisted
 * (on `EquippedRevelation.mainStat` / `EquippedRevelation.subStats` and preference rows); the
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
