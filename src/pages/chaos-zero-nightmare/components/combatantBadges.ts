/**
 * Presentation maps for the verbatim Prydwen taxonomy stored in the combatant
 * catalog. Class and attribute names are already display-ready, so the label is
 * the raw string; these maps own only the badge-class modifier, with a neutral
 * `unknown` fallback so an unmapped future source value still renders without a
 * code change.
 */

export interface BadgeMeta {
  label: string;
  modifier: string;
}

/** In-game Attributes as Prydwen spells them. */
const ELEMENT_MODIFIERS = new Set(['passion', 'order', 'justice', 'void', 'instinct']);

/** Combatant classes as Prydwen spells them. */
const CLASS_MODIFIERS = new Set([
  'striker',
  'vanguard',
  'ranger',
  'hunter',
  'psionic',
  'controller',
]);

function knownOrUnknown(value: string, known: Set<string>): BadgeMeta {
  const modifier = value.toLowerCase();
  return { label: value, modifier: known.has(modifier) ? modifier : 'unknown' };
}

export function getElementBadge(element: string): BadgeMeta {
  return knownOrUnknown(element, ELEMENT_MODIFIERS);
}

export function getClassBadge(combatantClass: string): BadgeMeta {
  return knownOrUnknown(combatantClass, CLASS_MODIFIERS);
}

/** Rarity 4 | 5 → `4★` / `5★`; any other number renders raw with the neutral style. */
export function getRarityBadge(rarity: number): BadgeMeta {
  const label = `${rarity}★`;
  return rarity === 5 || rarity === 4
    ? { label, modifier: String(rarity) }
    : { label, modifier: 'unknown' };
}

/** Manifest Ego rank → `T{n}` display label. */
export function formatEgo(ego: number): string {
  return `T${ego}`;
}
