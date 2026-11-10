// Unit tests for the CZN Memory Fragment set chunk-parsing rules, run against
// a trimmed capture of the live chunk. The fetch and ImageKit paths are
// exercised by the weekly workflow, not here.
import { describe, it, expect } from 'vitest';
import {
  FRAGMENT_CHUNK_NAME,
  parseFragmentSetEntries,
  selectFragmentChunkAsset,
  selectFragmentIconPaths,
} from './czn-fragments.mjs';
// Vite's ?raw import keeps the fixture a string — it is never executed.
import fixture from './__fixtures__/czn-memory-fragments-chunk.js?raw';

describe('selectFragmentChunkAsset', () => {
  const stats = {
    assetsByChunkName: {
      [FRAGMENT_CHUNK_NAME]: [
        'framework-35634d788cdaee1ea779.js',
        'styles.1b361cb752472ecea239.css',
        `${FRAGMENT_CHUNK_NAME}-2c53fea5b4a692943292.js`,
      ],
      'component---src-pages-chaos-zero-nightmare-guides-memory-fragments-tsx': [
        'component---src-pages-chaos-zero-nightmare-guides-memory-fragments-tsx-cfe7f0.js',
      ],
    },
  };

  it('returns the hashed component asset for the memory-fragments chunk', () => {
    expect(selectFragmentChunkAsset(stats)).toBe(`${FRAGMENT_CHUNK_NAME}-2c53fea5b4a692943292.js`);
  });

  it('throws naming the chunk when the stats list no entry for it', () => {
    expect(() => selectFragmentChunkAsset({ assetsByChunkName: {} })).toThrow(
      `no assetsByChunkName entry for ${FRAGMENT_CHUNK_NAME}`,
    );
    expect(() => selectFragmentChunkAsset({})).toThrow(FRAGMENT_CHUNK_NAME);
  });

  it('throws when the entry carries only shared chunks', () => {
    const shared = { assetsByChunkName: { [FRAGMENT_CHUNK_NAME]: ['framework-abc.js'] } };
    expect(() => selectFragmentChunkAsset(shared)).toThrow('lists no component asset');
  });
});

describe('parseFragmentSetEntries', () => {
  const entries = parseFragmentSetEntries(fixture);

  it('parses all 18 sets with 12 four-piece and 6 two-piece', () => {
    expect(entries).toHaveLength(18);
    expect(entries.filter((e) => e.pieces === 4)).toHaveLength(12);
    expect(entries.filter((e) => e.pieces === 2)).toHaveLength(6);
    expect(new Set(entries.map((e) => e.id)).size).toBe(18);
  });

  it('keeps names verbatim, including apostrophes and Prydwen spelling', () => {
    const byId = new Map(entries.map((e) => [e.id, e]));
    expect(byId.get(15)).toEqual({ id: 15, name: "Beast's Yearning", pieces: 4 });
    expect(byId.get(1).name).toBe("Conquerer's Aspect");
    expect(byId.get(10)).toEqual({ id: 10, name: 'Black Wing', pieces: 2 });
  });

  it('handles both Effect quote styles', () => {
    const single = `[{ID:1,Name:"A",Effect:'has "quotes"',Type:"4-PC"}]`;
    const double = `[{ID:2,Name:"B",Effect:"it's",Type:"2-PC"}]`;
    expect(parseFragmentSetEntries(single)).toEqual([{ id: 1, name: 'A', pieces: 4 }]);
    expect(parseFragmentSetEntries(double)).toEqual([{ id: 2, name: 'B', pieces: 2 }]);
  });

  it('throws when no entries parse', () => {
    expect(() => parseFragmentSetEntries('var o=function(){return []}')).toThrow(
      'no {ID,Name,Effect,Type} entries parsed',
    );
  });

  it('throws on a Type outside 4-PC / 2-PC', () => {
    const odd = `[{ID:9,Name:"Odd",Effect:"x",Type:"3-PC"}]`;
    expect(() => parseFragmentSetEntries(odd)).toThrow(
      'Memory Fragment set 9 has unknown Type "3-PC"',
    );
  });
});

describe('selectFragmentIconPaths', () => {
  const paths = selectFragmentIconPaths(fixture);

  it('maps every set ID 1–18 to a 60w hashed static path', () => {
    for (let id = 1; id <= 18; id++) {
      expect(paths.get(id), `ID ${id}`).toMatch(
        /^\/static\/[0-9a-f]{32}\/927d1\/set_(full|small)_\d+\.webp$/,
      );
    }
  });

  it('follows the chunk binding rather than the set ID for the file name', () => {
    // IDs 7–12 render set_small_1..6; 13 and 14 are swapped full images.
    expect(paths.get(7)).toMatch(/\/set_small_1\.webp$/);
    expect(paths.get(12)).toMatch(/\/set_small_6\.webp$/);
    expect(paths.get(13)).toMatch(/\/set_full_8\.webp$/);
    expect(paths.get(14)).toMatch(/\/set_full_7\.webp$/);
    expect(paths.get(1)).toMatch(/\/set_full_1\.webp$/);
  });

  it('picks the largest advertised width when a srcSet lists several', () => {
    const chunk = [
      `1===t&&s.createElement(r.S,{src:"../img/set_full_1.webp",alt:"Set",__imageData:a(1)})`,
      `"srcSet":"/static/aa/f57b3/set_full_1.webp 15w,\\n/static/aa/927d1/set_full_1.webp 60w,\\n/static/aa/bde72/set_full_1.webp 30w"`,
    ].join('\n');
    expect(selectFragmentIconPaths(chunk).get(1)).toBe('/static/aa/927d1/set_full_1.webp');
  });

  it('omits an ID whose bound file has no srcSet', () => {
    const chunk = `1===t&&s.createElement(r.S,{src:"../img/set_full_1.webp",alt:"Set",__imageData:a(1)})`;
    expect(selectFragmentIconPaths(chunk).has(1)).toBe(false);
  });
});
