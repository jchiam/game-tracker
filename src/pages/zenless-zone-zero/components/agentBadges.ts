/**
 * Presentation maps for the verbatim Enka taxonomy stored in the agent catalog.
 * The catalog keeps source codes exact (`Elec`, `FireFrost`, …); these maps own
 * the display labels and badge-class modifiers, with a neutral fallback so an
 * unmapped future source value still renders without a code change.
 */

export interface BadgeMeta {
  label: string;
  modifier: string;
}

const ELEMENT_META: Record<string, BadgeMeta> = {
  Elec: { label: 'Electric', modifier: 'elec' },
  Physics: { label: 'Physical', modifier: 'physics' },
  Fire: { label: 'Fire', modifier: 'fire' },
  Ice: { label: 'Ice', modifier: 'ice' },
  Ether: { label: 'Ether', modifier: 'ether' },
  FireFrost: { label: 'Frost', modifier: 'frost' },
  AuricEther: { label: 'Auric Ink', modifier: 'auric-ink' },
  ZhenZhenAssault: { label: 'ZhenZhen', modifier: 'zhenzhen' },
  Wind: { label: 'Wind', modifier: 'wind' },
  Lumen: { label: 'Lumen', modifier: 'lumen' },
};

const SPECIALTY_MODIFIERS = new Set(['attack', 'stun', 'anomaly', 'support', 'defense', 'rupture']);

export function getElementBadge(element: string): BadgeMeta {
  return ELEMENT_META[element] ?? { label: element, modifier: 'unknown' };
}

export function getSpecialtyBadge(specialty: string): BadgeMeta {
  const modifier = specialty.toLowerCase();
  return SPECIALTY_MODIFIERS.has(modifier)
    ? { label: specialty, modifier }
    : { label: specialty, modifier: 'unknown' };
}

/** Enka rarity code → letter rank: 4 = S, 3 = A. Unknown codes show the raw number. */
export function getRarityBadge(rarity: number): BadgeMeta {
  if (rarity === 4) return { label: 'S', modifier: 's' };
  if (rarity === 3) return { label: 'A', modifier: 'a' };
  return { label: String(rarity), modifier: 'unknown' };
}

/**
 * Core Skill letter rungs: 0 = unenhanced, 1–6 = A→F.
 *
 * `A` is the first and cheapest enhancement and `F` is the maximum — the letters
 * are sequential rank labels, not grades. Rung 0 is not "locked": the Core
 * Passive is active from the moment the Agent is obtained.
 */
export const CORE_SKILL_LETTERS = ['—', 'A', 'B', 'C', 'D', 'E', 'F'] as const;

export function getCoreSkillLetter(coreSkill: number): string {
  return CORE_SKILL_LETTERS[coreSkill] ?? '—';
}

/**
 * The five leveled combat skills, ordered as the in-game skills screen lists
 * them. Each `key` is the `ZzzTrackedAgent` flag recording that its base Lv. 12
 * track is finished. The Ultimate is deliberately absent: it scales off the
 * Chain Attack level rather than levelling on its own.
 */
export const ZZZ_COMBAT_SKILLS = [
  { key: 'skillBasicMaxed', value: 'basic', label: 'Basic' },
  { key: 'skillDodgeMaxed', value: 'dodge', label: 'Dodge' },
  { key: 'skillAssistMaxed', value: 'assist', label: 'Assist' },
  { key: 'skillSpecialMaxed', value: 'special', label: 'Special' },
  { key: 'skillChainMaxed', value: 'chain', label: 'Chain' },
] as const;

/** Row-order identifier for one combat skill (`basic`, `dodge`, …). */
export type ZzzSkillKey = (typeof ZZZ_COMBAT_SKILLS)[number]['value'];

/** The tracked-agent flag field backing a given combat skill. */
export type ZzzSkillField = (typeof ZZZ_COMBAT_SKILLS)[number]['key'];
