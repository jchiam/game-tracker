// Game8 source rules for the Chaos Zero Nightmare combatant and Partner lists.
// Game8's list pages render a "collection browser" whose data comes from a
// tool-structural-mapping JSON endpoint; the mapping id is read from the page
// each run. Everything here is pure: the script owns the fetches.

import { mintId } from './pipeline.mjs';

export const GAME8_ORIGIN = 'https://game8.co';

// Prydwen spelling, as already present in combatants.ts. Game8 uses the same
// vocabulary today. Taxonomy is open data (an unknown value renders with the
// neutral badge), so a value outside these lists is emitted and reported in
// `unknownVocabulary` for the run to warn about — a Game8 respelling shows up
// in the run output instead of passing silently.
export const CZN_CLASSES = ['Striker', 'Vanguard', 'Ranger', 'Hunter', 'Psionic', 'Controller'];
export const CZN_ELEMENTS = ['Passion', 'Order', 'Justice', 'Void', 'Instinct'];
const RARITIES = { '5★': 5, '4★': 4, '3★': 3 };
const RELEASED = 'Released';

const ENTITIES = {
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&lt;': '<',
  '&gt;': '>',
  '&amp;': '&',
};
const decodeEntities = (s) => s.replace(/&(?:quot|#39|apos|lt|gt|amp);/g, (e) => ENTITIES[e]);

/**
 * Reads the collection-browser mapping `{ id, updatedAt }` out of a Game8
 * list page. The props attribute is JSON data (parsed, never evaluated).
 * Throws when the wrapper, its props, or the mapping id is missing.
 */
export function extractCollectionMapping(html, { label = 'Game8 page' } = {}) {
  const wrapper = html.match(/<div[^>]*id="react-collection_browser-wrapper"[^>]*>/);
  const attr = wrapper?.[0].match(/data-react-props=(?:'([^']*)'|"([^"]*)")/);
  if (!attr) throw new Error(`${label}: collection-browser data-react-props not found`);
  let props;
  try {
    props = JSON.parse(decodeEntities(attr[1] ?? attr[2]));
  } catch {
    throw new Error(`${label}: collection-browser data-react-props is not valid JSON`);
  }
  const mapping = props?.toolStructuralMapping;
  const id = String(mapping?.id ?? props?.toolStructuralMappingId ?? '');
  if (!/^\d+$/.test(id)) throw new Error(`${label}: toolStructuralMapping id missing`);
  return { id, updatedAt: mapping?.updatedAt ?? null };
}

/** The collection JSON URL for a mapping read by extractCollectionMapping. */
export function collectionMappingUrl({ id, updatedAt }) {
  const query = updatedAt == null ? '' : `?updatedAt=${encodeURIComponent(updatedAt)}`;
  return `${GAME8_ORIGIN}/api/tool_structural_mappings/${id}.json${query}`;
}

const clean = (s) => (typeof s === 'string' ? s.trim() : '');
const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Validates an id-pin list — `[{ game8Id, id, name?, note? }]` — and returns
 * it as the `pinned` Map mintId takes (Game8 item id → catalog id). A pin keeps
 * a committed id when Game8 spells a name differently from the source the id
 * was first minted from. Throws naming the label on a malformed or duplicate pin.
 */
export function buildIdPins(pins, { label }) {
  if (!Array.isArray(pins)) throw new Error(`${label}: must be a JSON array`);
  const pinned = new Map();
  const ids = new Set();
  for (const pin of pins) {
    const game8Id = String(pin?.game8Id ?? '');
    if (!/^\d+$/.test(game8Id)) throw new Error(`${label}: pin without a numeric game8Id`);
    if (typeof pin.id !== 'string' || !KEBAB.test(pin.id)) {
      throw new Error(`${label} pin ${game8Id}: id must be kebab-case`);
    }
    if (pinned.has(game8Id) || ids.has(pin.id)) {
      throw new Error(`${label} pin ${game8Id} (${pin.id}): duplicate game8Id or id`);
    }
    pinned.set(game8Id, pin.id);
    ids.add(pin.id);
  }
  return pinned;
}

// Shared walk over a collection: released filter, rarity parse, class check,
// and id minting (pin by Game8 item id first, then the name slug; mintId
// throws on a duplicate). `mapItem` adds the entity-specific fields.
function mapReleasedItems(json, { rarities, pinned, mapItem }) {
  const unknownVocabulary = [];
  const note = (name, field, value, known) => {
    if (!known.includes(value)) unknownVocabulary.push(`${name}: ${field} "${value}"`);
  };
  const items = json?.collectionArraySchema?.collectionItems;
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Game8 collection JSON shape changed: collectionItems missing/empty');
  }
  const entries = [];
  const excluded = [];
  const taken = new Map();
  const used = new Set();
  for (const item of items) {
    const name = clean(item?.name);
    if (!name) throw new Error('Game8 collection item without a name');
    if (clean(item.released) !== RELEASED) {
      excluded.push(name);
      continue;
    }
    const rarity = RARITIES[clean(item.rarity)];
    if (!rarity || !rarities.includes(rarity)) {
      throw new Error(`Game8 ${name}: unexpected rarity "${item.rarity}"`);
    }
    const cls = clean(item.class);
    if (!cls) throw new Error(`Game8 ${name}: class missing`);
    note(name, 'class', cls, CZN_CLASSES);
    const sourceId = String(item.id ?? '');
    if (pinned?.has(sourceId)) used.add(sourceId);
    entries.push({
      id: mintId({ name, sourceId, pinned, taken, separator: '-' }),
      name,
      rarity,
      class: cls,
      ...mapItem(item, name, note),
      faction: clean(item.faction) || null,
      imageSource: clean(item.imageUrl) || null,
    });
  }
  const unusedPins = [...(pinned?.keys() ?? [])].filter((k) => !used.has(k));
  return { entries, excluded, unusedPins, unknownVocabulary };
}

/**
 * Maps the character-list collection JSON to combatant entries. Keeps only
 * released items; throws naming the entry on an unexpected rarity, a missing
 * class or attribute, a duplicate id, and when the payload carries no items.
 * Returns `{ combatants, excluded, unusedPins, unknownVocabulary }`:
 * `excluded` lists the names of unreleased items, `unusedPins` the pinned
 * Game8 ids the list lacks, `unknownVocabulary` emitted values outside the
 * known class/attribute lists.
 */
export function mapGame8Combatants(json, { pinned } = {}) {
  const { entries, ...rest } = mapReleasedItems(json, {
    rarities: [4, 5],
    pinned,
    mapItem: (item, name, note) => {
      const element = clean(item.attribute);
      if (!element) throw new Error(`Game8 ${name}: attribute missing`);
      note(name, 'attribute', element, CZN_ELEMENTS);
      return { element };
    },
  });
  return { combatants: entries, ...rest };
}

/**
 * Maps the Partner-list collection JSON to Partner entries: rarity 3–5 and a
 * class from the combatant vocabulary (it is the equip join key). Same rules
 * as mapGame8Combatants; returns `{ partners, excluded, unusedPins, unknownVocabulary }`.
 */
export function mapGame8Partners(json, { pinned } = {}) {
  const { entries, ...rest } = mapReleasedItems(json, {
    rarities: [3, 4, 5],
    pinned,
    mapItem: () => ({}),
  });
  return { partners: entries, ...rest };
}

/**
 * Ids in the committed catalog that the regenerated one lacks. Tracked rows
 * key on these ids, so a non-empty result aborts the run unless removals are
 * explicitly allowed.
 */
export function missingIds(existing, next) {
  const kept = new Set(next.map((c) => c.id));
  return existing.map((c) => c.id).filter((id) => !kept.has(id));
}
