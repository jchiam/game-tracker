// Unit tests for the CZN Meta Decks art-source helpers.
import { describe, it, expect } from 'vitest';
import {
  extractCatalogUrl,
  parseCatalog,
  joinCombatantArt,
  normalizeName,
  portraitUrl,
  faceIconUrl,
} from './czn-metadecks.mjs';
import { slugify } from './pipeline.mjs';

const mint = (name) => slugify(name, '-');

// Shape of the characters page: Next.js flight data naming hashed CDN catalogs.
const PAGE = `<html><body><script>self.__next_f.push([1,"\\"catalog\\":{\\"cards\\":\\"https://cdn.czndecksmeta.com/catalog/v2/en/cards.9e39879ac2a5.json\\",\\"combatants\\":\\"https://cdn.czndecksmeta.com/catalog/v2/en/combatants.214d9472ec99.json\\"}"])</script></body></html>`;

const CATALOG = [
  { charId: '30004', name: '30004', released: false },
  { charId: '1062', name: 'Haru', released: true },
  { charId: 1027, name: ' Mei Lin ', released: true },
  { charId: '30048', name: 'Fei', released: true },
  { charId: '30099', name: 'Lilian', released: true },
  { name: 'No id' },
];

describe('extractCatalogUrl', () => {
  it('returns the hashed combatants catalog URL from the page', () => {
    expect(extractCatalogUrl(PAGE)).toBe(
      'https://cdn.czndecksmeta.com/catalog/v2/en/combatants.214d9472ec99.json',
    );
  });

  it('prefers the English catalog when several locales are named', () => {
    const page =
      'cdn.czndecksmeta.com/catalog/v2/ko/combatants.aaaa1111.json cdn.czndecksmeta.com/catalog/v2/en/combatants.bbbb2222.json';
    expect(extractCatalogUrl(page)).toBe(
      'https://cdn.czndecksmeta.com/catalog/v2/en/combatants.bbbb2222.json',
    );
  });

  it('throws naming the page when no catalog URL is present', () => {
    expect(() => extractCatalogUrl('<html></html>', { label: 'the page' })).toThrow(
      'the page: no combatants catalog URL found',
    );
  });
});

describe('parseCatalog', () => {
  it('keeps units with a charId and name, as trimmed strings', () => {
    expect(parseCatalog(CATALOG)).toEqual([
      { charId: '30004', name: '30004' },
      { charId: '1062', name: 'Haru' },
      { charId: '1027', name: 'Mei Lin' },
      { charId: '30048', name: 'Fei' },
      { charId: '30099', name: 'Lilian' },
    ]);
  });

  it('accepts an object keyed by index', () => {
    expect(parseCatalog({ 0: CATALOG[1] })).toEqual([{ charId: '1062', name: 'Haru' }]);
  });

  it('throws when the catalog carries no usable unit', () => {
    expect(() => parseCatalog([], { label: 'catalog' })).toThrow(
      'catalog: no units with a charId and name',
    );
    expect(() => parseCatalog(null)).toThrow('catalog shape changed');
  });
});

describe('joinCombatantArt', () => {
  const units = parseCatalog(CATALOG);

  it('joins on the name apart from case, spacing, and punctuation', () => {
    const { joined, unjoined } = joinCombatantArt(
      [
        { id: 'haru', name: 'HARU' },
        { id: 'mei-lin', name: 'Mei-Lin' },
      ],
      units,
      { mint },
    );
    expect([...joined]).toEqual([
      ['haru', '1062'],
      ['mei-lin', '1027'],
    ]);
    expect(unjoined).toEqual([]);
  });

  it('joins a pinned respelling through its id', () => {
    // Game8 spells it "Lillian"; the committed id was minted from "Lilian".
    const { joined } = joinCombatantArt([{ id: 'lilian', name: 'Lillian' }], units, { mint });
    expect(joined.get('lilian')).toBe('30099');
  });

  it('reports combatants that join no unit', () => {
    const { joined, unjoined } = joinCombatantArt([{ id: 'nobody', name: 'Nobody' }], units, {
      mint,
    });
    expect(joined.size).toBe(0);
    expect(unjoined).toEqual(['nobody']);
  });

  it('never joins an unreleased placeholder unit by accident', () => {
    const { unjoined } = joinCombatantArt([{ id: 'new-unit', name: 'New Unit' }], units, { mint });
    expect(unjoined).toEqual(['new-unit']);
  });

  it('lets an override charId force the join regardless of name', () => {
    const overrides = new Map([['renamed', { charId: '30048' }]]);
    const { joined, warnings } = joinCombatantArt([{ id: 'renamed', name: 'Renamed' }], units, {
      overrides,
      mint,
    });
    expect(joined.get('renamed')).toBe('30048');
    expect(warnings).toEqual([]);
  });

  it('warns and falls back to the name join when an override names an unknown charId', () => {
    const overrides = new Map([['haru', { charId: '99999' }]]);
    const { joined, warnings } = joinCombatantArt([{ id: 'haru', name: 'Haru' }], units, {
      overrides,
      mint,
    });
    expect(joined.get('haru')).toBe('1062');
    expect(warnings).toEqual(['override for "haru" names unknown charId 99999 — joining by name']);
  });

  it('warns about an override whose id matches no combatant', () => {
    const overrides = new Map([['ghost', { charId: '1062' }]]);
    const { warnings } = joinCombatantArt([{ id: 'haru', name: 'Haru' }], units, {
      overrides,
      mint,
    });
    expect(warnings).toEqual(['override for "ghost" matches no combatant']);
  });

  it('ignores a face-only override when joining', () => {
    const overrides = new Map([['haru', { face: { left: 1, top: 2, side: 3 } }]]);
    const { joined, warnings } = joinCombatantArt([{ id: 'haru', name: 'Haru' }], units, {
      overrides,
      mint,
    });
    expect(joined.get('haru')).toBe('1062');
    expect(warnings).toEqual([]);
  });
});

describe('url builders', () => {
  it('normalizes names to lowercase alphanumerics', () => {
    expect(normalizeName(" Mei-Lin's ")).toBe('meilins');
  });

  it('builds the CDN portrait and face icon URLs from a charId', () => {
    expect(portraitUrl('1062')).toBe(
      'https://cdn.czndecksmeta.com/face/character/portrait_character_1062.webp',
    );
    expect(faceIconUrl('1062')).toBe(
      'https://cdn.czndecksmeta.com/face/character/face_character_1062.webp',
    );
  });
});
