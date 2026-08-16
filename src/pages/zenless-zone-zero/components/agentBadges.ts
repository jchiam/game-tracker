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

/** Core Skill letter rungs: 0 locked, 1–6 = F→A. */
export const CORE_SKILL_LETTERS = ['—', 'F', 'E', 'D', 'C', 'B', 'A'] as const;

export function getCoreSkillLetter(coreSkill: number): string {
  return CORE_SKILL_LETTERS[coreSkill] ?? '—';
}
