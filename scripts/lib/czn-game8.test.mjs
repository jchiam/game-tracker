// Unit tests for the CZN Game8 source-shape rules. The live fetches and
// ImageKit paths are exercised by the weekly workflow, not here.
import { describe, it, expect } from 'vitest';
import {
  extractCollectionMapping,
  collectionMappingUrl,
  mapGame8Combatants,
  mapGame8Partners,
  buildIdPins,
  missingIds,
} from './czn-game8.mjs';

// Trimmed from the live payload of 2026-11-21 (mapping 630).
const item = (over = {}) => ({
  id: '1323609',
  name: 'Mei Lin',
  imageUrl: 'https://img.game8.co/4305682/c1694108d4835810206a08324e976f3a.png/show',
  url: 'https://game8.co/games/Chaos-Zero-Nightmare/archives/560150',
  class: 'Striker',
  attribute: 'Passion',
  faction: 'Terrascion',
  rarity: '5★',
  released: 'Released',
  version: '1.0',
  ...over,
});
const payload = (items) => ({
  toolKey: 'Chaos Zero Nightmare Character List',
  collectionArraySchema: { collectionItems: items },
});

const page = (attr) =>
  `<html><body><div id="react-collection_browser-wrapper" class="a-catalog__bg" ${attr} style="min-height: 1370.0px;"></div></body></html>`;

describe('extractCollectionMapping', () => {
  it('reads the mapping id and updatedAt from single-quoted props', () => {
    const html = page(
      `data-react-props='{"view":"index","toolStructuralMappingId":"630","options":"{\\"filterReleased\\":\\"Released\\"}","toolStructuralMapping":{"id":"630","updatedAt":1794385866}}'`,
    );
    expect(extractCollectionMapping(html)).toEqual({ id: '630', updatedAt: 1794385866 });
  });

  it('decodes entity-encoded double-quoted props', () => {
    const html = page(
      `data-react-props="{&quot;toolStructuralMapping&quot;:{&quot;id&quot;:&quot;639&quot;,&quot;updatedAt&quot;:1}}"`,
    );
    expect(extractCollectionMapping(html)).toEqual({ id: '639', updatedAt: 1 });
  });

  it('throws naming the page when the wrapper is missing', () => {
    expect(() => extractCollectionMapping('<html></html>', { label: 'list page' })).toThrow(
      'list page: collection-browser data-react-props not found',
    );
  });

  it('throws when the props carry no mapping id', () => {
    expect(() => extractCollectionMapping(page(`data-react-props='{"view":"index"}'`))).toThrow(
      'toolStructuralMapping id missing',
    );
  });
});

describe('collectionMappingUrl', () => {
  it('builds the API URL with the cache-busting updatedAt', () => {
    expect(collectionMappingUrl({ id: '630', updatedAt: 1794385866 })).toBe(
      'https://game8.co/api/tool_structural_mappings/630.json?updatedAt=1794385866',
    );
  });
});

describe('mapGame8Combatants', () => {
  it('maps a released item to a combatant with a minted id', () => {
    expect(mapGame8Combatants(payload([item()]))).toEqual({
      combatants: [
        {
          id: 'mei-lin',
          name: 'Mei Lin',
          rarity: 5,
          class: 'Striker',
          element: 'Passion',
          faction: 'Terrascion',
          imageSource: 'https://img.game8.co/4305682/c1694108d4835810206a08324e976f3a.png/show',
        },
      ],
      excluded: [],
      unusedPins: [],
      unknownVocabulary: [],
    });
  });

  it('parses 4★ and nulls an empty faction', () => {
    const { combatants } = mapGame8Combatants(payload([item({ rarity: '4★', faction: '' })]));
    expect(combatants[0]).toMatchObject({ rarity: 4, faction: null });
  });

  it('excludes unreleased items and reports them', () => {
    const result = mapGame8Combatants(
      payload([item(), item({ name: 'Dahlia', released: 'Upcoming' })]),
    );
    expect(result.combatants.map((c) => c.id)).toEqual(['mei-lin']);
    expect(result.excluded).toEqual(['Dahlia']);
  });

  it('emits an unknown class or attribute verbatim and reports it', () => {
    const result = mapGame8Combatants(payload([item({ class: 'Healer', attribute: 'Chaos' })]));
    expect(result.combatants[0]).toMatchObject({ class: 'Healer', element: 'Chaos' });
    expect(result.unknownVocabulary).toEqual([
      'Mei Lin: class "Healer"',
      'Mei Lin: attribute "Chaos"',
    ]);
  });

  it('throws naming the entry on a missing class or attribute', () => {
    expect(() => mapGame8Combatants(payload([item({ class: '' })]))).toThrow(
      'Game8 Mei Lin: class missing',
    );
    expect(() => mapGame8Combatants(payload([item({ attribute: '' })]))).toThrow(
      'Game8 Mei Lin: attribute missing',
    );
  });

  it('throws naming the entry on an unexpected rarity', () => {
    expect(() => mapGame8Combatants(payload([item({ rarity: '3★' })]))).toThrow(
      'Game8 Mei Lin: unexpected rarity "3★"',
    );
    expect(() => mapGame8Combatants(payload([item({ rarity: '6★' })]))).toThrow(
      'unexpected rarity "6★"',
    );
  });

  it('keeps a pinned id for a renamed item and reports unused pins', () => {
    const pinned = new Map([
      ['1323609', 'meilin-old'],
      ['999', 'gone'],
    ]);
    const result = mapGame8Combatants(payload([item()]), { pinned });
    expect(result.combatants[0].id).toBe('meilin-old');
    expect(result.unusedPins).toEqual(['999']);
  });

  it('throws on an empty or missing item list', () => {
    expect(() => mapGame8Combatants(payload([]))).toThrow('collectionItems missing/empty');
    expect(() => mapGame8Combatants({})).toThrow('collectionItems missing/empty');
  });

  it('throws when two items mint the same id', () => {
    expect(() => mapGame8Combatants(payload([item(), item({ name: 'Mei-Lin' })]))).toThrow(
      "Duplicate catalog id 'mei-lin'",
    );
  });
});

// Trimmed from the live Partner payload of 2026-11-21 (mapping 639).
const partnerItem = (over = {}) => ({
  id: '1323716',
  name: 'Lillian',
  imageUrl: 'https://img.game8.co/x/lillian.png/show',
  class: 'Striker',
  faction: 'Terrascion',
  rarity: '4★',
  released: 'Released',
  release: '1',
  ...over,
});

describe('mapGame8Partners', () => {
  it('maps rarity 3–5 and pins a committed id by Game8 item id', () => {
    const pinned = new Map([['1323716', 'lilian']]);
    const { partners } = mapGame8Partners(
      payload([partnerItem(), partnerItem({ id: '2', name: 'Zeta', rarity: '3★', faction: '' })]),
      { pinned },
    );
    expect(partners).toEqual([
      {
        id: 'lilian',
        name: 'Lillian',
        rarity: 4,
        class: 'Striker',
        faction: 'Terrascion',
        imageSource: 'https://img.game8.co/x/lillian.png/show',
      },
      {
        id: 'zeta',
        name: 'Zeta',
        rarity: 3,
        class: 'Striker',
        faction: null,
        imageSource: 'https://img.game8.co/x/lillian.png/show',
      },
    ]);
  });

  it('reports a class outside the combatant vocabulary', () => {
    const result = mapGame8Partners(payload([partnerItem({ class: 'Support' })]));
    expect(result.partners[0].class).toBe('Support');
    expect(result.unknownVocabulary).toEqual(['Lillian: class "Support"']);
  });
});

describe('buildIdPins', () => {
  it('builds the Game8 id → catalog id map', () => {
    expect(buildIdPins([{ game8Id: '1323716', id: 'lilian' }], { label: 'pins' })).toEqual(
      new Map([['1323716', 'lilian']]),
    );
  });

  it('rejects a non-kebab id, a missing game8Id, and duplicates', () => {
    expect(() => buildIdPins([{ game8Id: '1', id: 'Lilian' }], { label: 'pins' })).toThrow(
      'pins pin 1: id must be kebab-case',
    );
    expect(() => buildIdPins([{ id: 'lilian' }], { label: 'pins' })).toThrow(
      'pins: pin without a numeric game8Id',
    );
    expect(() =>
      buildIdPins(
        [
          { game8Id: '1', id: 'a' },
          { game8Id: '2', id: 'a' },
        ],
        { label: 'pins' },
      ),
    ).toThrow('duplicate game8Id or id');
  });
});

describe('missingIds', () => {
  it('lists committed ids the regenerated catalog lacks', () => {
    expect(missingIds([{ id: 'a' }, { id: 'b' }], [{ id: 'b' }, { id: 'c' }])).toEqual(['a']);
  });
});
