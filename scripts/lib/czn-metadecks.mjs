// CZN Meta Decks (cznmetadecks.com) is the combatant ART source for Chaos Zero
// Nightmare: it serves the game's own 804×924 transparent portraits and 124²
// face icons, keyed by the game's character id. The combatant LIST stays on
// Game8 — nothing here mints ids or decides what is released.
//
// The catalog that maps names to character ids is a hashed JSON file on the
// CDN; its URL is read from the characters page on every run. Everything in
// this module is a pure function over the fetched text / JSON.

export const METADECKS_ORIGIN = 'https://cznmetadecks.com';
export const METADECKS_CDN = 'https://cdn.czndecksmeta.com';
export const METADECKS_CHARACTERS_PAGE = `${METADECKS_ORIGIN}/characters`;

/** Size of every Meta Decks portrait — override face boxes are stated in these pixels. */
export const METADECKS_PORTRAIT_SIZE = { width: 804, height: 924 };

const CATALOG_URL = /cdn\.czndecksmeta\.com\/catalog\/[\w/.-]*?combatants\.[0-9a-f]+\.json/g;

/**
 * Finds the hashed combatants catalog URL in the characters page HTML. The
 * English catalog wins when the page names several locales. Throws naming the
 * page when none is present (the page shape changed).
 */
export function extractCatalogUrl(html, { label = METADECKS_CHARACTERS_PAGE } = {}) {
  const matches = [...new Set(String(html).match(CATALOG_URL) ?? [])];
  if (matches.length === 0) {
    throw new Error(`${label}: no combatants catalog URL found (page shape changed)`);
  }
  const english = matches.find((m) => m.includes('/en/'));
  return `https://${english ?? matches[0]}`;
}

/**
 * Reduces the catalog JSON (an array of units) to `{ charId, name }` pairs.
 * Unreleased units are kept — they carry their id as a placeholder name and so
 * never join. Throws when no usable unit is present.
 */
export function parseCatalog(json, { label = 'CZN Meta Decks catalog' } = {}) {
  const list = Array.isArray(json)
    ? json
    : json && typeof json === 'object'
      ? Object.values(json)
      : [];
  const units = list
    .filter((u) => u && typeof u.name === 'string' && u.charId !== undefined && u.charId !== null)
    .map((u) => ({ charId: String(u.charId), name: u.name.trim() }));
  if (units.length === 0) {
    throw new Error(`${label}: no units with a charId and name (catalog shape changed)`);
  }
  return units;
}

/** Name comparison form: lowercase, alphanumerics only. */
export const normalizeName = (name) =>
  String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

/**
 * Joins catalog combatants (`{ id, name }`) to Meta Decks units.
 *
 * A combatant joins the unit whose normalized name equals its own, or whose
 * minted name slug equals its id (which keeps a pinned respelling joined). An
 * override entry's `charId` forces the join; an override naming an unknown
 * combatant or unit is reported and ignored.
 *
 * Returns `{ joined: Map<id, charId>, unjoined: id[], warnings: string[] }`.
 */
export function joinCombatantArt(combatants, units, { overrides = new Map(), mint }) {
  const byCharId = new Map(units.map((u) => [u.charId, u]));
  const byName = new Map();
  const bySlug = new Map();
  for (const u of units) {
    const key = normalizeName(u.name);
    if (key && !byName.has(key)) byName.set(key, u);
    const slug = mint(u.name);
    if (slug && !bySlug.has(slug)) bySlug.set(slug, u);
  }

  const warnings = [];
  const known = new Set(combatants.map((c) => c.id));
  for (const id of overrides.keys()) {
    if (!known.has(id)) warnings.push(`override for "${id}" matches no combatant`);
  }

  const joined = new Map();
  const unjoined = [];
  for (const c of combatants) {
    const forced = overrides.get(c.id)?.charId;
    if (forced !== undefined) {
      if (byCharId.has(forced)) {
        joined.set(c.id, forced);
        continue;
      }
      warnings.push(`override for "${c.id}" names unknown charId ${forced} — joining by name`);
    }
    const unit = byName.get(normalizeName(c.name)) ?? bySlug.get(c.id);
    if (unit) joined.set(c.id, unit.charId);
    else unjoined.push(c.id);
  }
  return { joined, unjoined, warnings };
}

export const portraitUrl = (charId) =>
  `${METADECKS_CDN}/face/character/portrait_character_${charId}.webp`;
export const faceIconUrl = (charId) =>
  `${METADECKS_CDN}/face/character/face_character_${charId}.webp`;
