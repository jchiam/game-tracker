// Unit tests for the shared update-pipeline helpers. Network-bound paths
// (downloadImage, live ImageKit calls) are exercised by the real weekly
// workflows, not here; fetchJSON is tested against a stubbed global fetch.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  toImageKitLocation,
  initImageKit,
  parseReuploadFlags,
  fetchJSON,
  slugify,
  mintId,
  esc,
  jsStr,
  diffByKey,
  applyOverlay,
  validateOverlaySeed,
  formatDiff,
  generatedHeader,
} from './pipeline.mjs';

describe('applyOverlay', () => {
  const key = (x) => x.id;

  it('appends overlay entries the fetched catalog lacks, in seed order after fetched order', () => {
    const fetched = [{ id: 'b' }, { id: 'a' }];
    const overlay = [{ id: 'z' }, { id: 'y' }];
    const { entries, shadowed } = applyOverlay(fetched, overlay, key);
    expect(entries.map(key)).toEqual(['b', 'a', 'z', 'y']);
    expect(shadowed).toEqual([]);
  });

  it('drops an overlay entry whose key the source now carries and reports it as shadowed', () => {
    const fetched = [{ id: 'a', name: 'Upstream A' }];
    const overlay = [
      { id: 'a', name: 'Seed A' },
      { id: 'b', name: 'Seed B' },
    ];
    const { entries, shadowed } = applyOverlay(fetched, overlay, key);
    expect(entries).toEqual([
      { id: 'a', name: 'Upstream A' },
      { id: 'b', name: 'Seed B' },
    ]);
    expect(shadowed).toEqual([{ id: 'a', name: 'Seed A' }]);
  });

  it('returns the fetched catalog unchanged for an empty overlay', () => {
    const fetched = [{ id: 'a' }];
    expect(applyOverlay(fetched, [], key)).toEqual({ entries: [{ id: 'a' }], shadowed: [] });
  });
});

describe('validateOverlaySeed', () => {
  const opts = { label: 'seeds/x.json', required: ['id', 'name', 'rarity'], rarities: [4, 5] };
  const entry = (overrides = {}) => ({
    id: 'kotone-shiomi',
    name: 'Kotone Shiomi',
    rarity: 5,
    imageSource: 'https://example.test/kotone.webp',
    ...overrides,
  });

  it('returns a valid seed unchanged, accepting a null imageSource', () => {
    const seed = [entry(), entry({ id: 'other-unit', imageSource: null })];
    expect(validateOverlaySeed(seed, opts)).toBe(seed);
  });

  it('accepts an empty seed', () => {
    expect(validateOverlaySeed([], opts)).toEqual([]);
  });

  it('rejects a seed that is not an array', () => {
    expect(() => validateOverlaySeed({ id: 'x' }, opts)).toThrow(
      'seeds/x.json: seed must be a JSON array',
    );
  });

  it('rejects a missing or empty required field, naming the entry and field', () => {
    expect(() => validateOverlaySeed([entry({ name: '' })], opts)).toThrow(
      'seeds/x.json entry 0 (kotone-shiomi): missing required field "name"',
    );
    expect(() => validateOverlaySeed([entry(), { name: 'No Id' }], opts)).toThrow(
      'seeds/x.json entry 1: missing required field "id"',
    );
  });

  it('rejects an id that is not a kebab-case slug', () => {
    expect(() => validateOverlaySeed([entry({ id: 'Kotone_Shiomi' })], opts)).toThrow(
      /entry 0 \(Kotone_Shiomi\): id must be a kebab-case slug/,
    );
  });

  it('rejects a duplicate id', () => {
    expect(() => validateOverlaySeed([entry(), entry()], opts)).toThrow(
      'seeds/x.json entry 1 (kotone-shiomi): duplicate id',
    );
  });

  it('rejects a rarity outside the allowed set', () => {
    expect(() => validateOverlaySeed([entry({ rarity: 3 })], opts)).toThrow(
      'seeds/x.json entry 0 (kotone-shiomi): rarity must be 4 or 5',
    );
  });

  it('skips the rarity check when no rarities are given', () => {
    const { rarities: _unused, ...noRarities } = opts;
    expect(() => validateOverlaySeed([entry({ rarity: 3 })], noRarities)).not.toThrow();
  });

  it('rejects an imageSource that is absent, http, or not a URL', () => {
    const msg = 'seeds/x.json entry 0 (kotone-shiomi): imageSource must be an https URL or null';
    const { imageSource: _unused, ...noImage } = entry();
    expect(() => validateOverlaySeed([noImage], opts)).toThrow(msg);
    expect(() =>
      validateOverlaySeed([entry({ imageSource: 'http://x.test/a.webp' })], opts),
    ).toThrow(msg);
    expect(() => validateOverlaySeed([entry({ imageSource: 'kotone.webp' })], opts)).toThrow(msg);
  });
});

describe('fetchJSON', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('passes the optional RequestInit through to fetch and returns parsed JSON', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: () => Promise.resolve({ retcode: 0 }) });
    vi.stubGlobal('fetch', fetchMock);
    const init = { method: 'POST', headers: { 'X-Rpc-Wiki_app': 'zzz' } };
    await expect(fetchJSON('https://example.test/api', init)).resolves.toEqual({ retcode: 0 });
    expect(fetchMock).toHaveBeenCalledWith('https://example.test/api', init);
  });

  it('throws with the URL and status on a non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 429 }));
    await expect(fetchJSON('https://example.test/api')).rejects.toThrow(
      'Failed to fetch https://example.test/api: 429',
    );
  });
});

describe('slugify', () => {
  it('slugs with underscore by default (R1999/N2E convention)', () => {
    expect(slugify('Liang Yue')).toBe('liang_yue');
    expect(slugify('  A.K.A.-6  ')).toBe('a_k_a_6');
  });

  it('slugs with hyphen for HSR ids', () => {
    expect(slugify('Dan Heng • Imbibitor Lunae', '-')).toBe('dan-heng-imbibitor-lunae');
    expect(slugify('Topaz & Numby', '-')).toBe('topaz-numby');
  });

  it('collapses runs and trims leading/trailing separators', () => {
    expect(slugify('--Weird__Name--', '-')).toBe('weird-name');
    expect(slugify('__Weird__Name__')).toBe('weird_name');
  });
});

describe('mintId', () => {
  it('prefers the pinned id over a slug of the current name', () => {
    // Zankou: pinned while upstream still called it '残虹', kept after localization.
    const pinned = new Map([['1046', 'unnamed_1046']]);
    expect(mintId({ name: 'Zankou', sourceId: '1046', pinned, taken: new Map() })).toBe(
      'unnamed_1046',
    );
  });

  it('slugs the name on first sighting', () => {
    expect(
      mintId({ name: 'Liang Yue', sourceId: '2001', pinned: new Map(), taken: new Map() }),
    ).toBe('liang_yue');
  });

  it('falls back to a sourceId-derived id when the name slugifies to nothing', () => {
    expect(mintId({ name: '残虹', sourceId: '1046', pinned: new Map(), taken: new Map() })).toBe(
      'unnamed_1046',
    );
  });

  it('honours the separator and fallback prefix', () => {
    expect(
      mintId({
        name: '灵可',
        sourceId: '1047',
        pinned: new Map(),
        taken: new Map(),
        separator: '-',
        fallbackPrefix: 'persona',
      }),
    ).toBe('persona-1047');
  });

  it('accumulates minted ids in taken', () => {
    const taken = new Map();
    mintId({ name: 'Zero', sourceId: '1', pinned: new Map(), taken });
    mintId({ name: 'Shinku', sourceId: '2', pinned: new Map(), taken });
    expect([...taken.keys()]).toEqual(['zero', 'shinku']);
  });

  it('gives two un-slugifiable names distinct ids (the 残虹/灵可 collision)', () => {
    const taken = new Map();
    const a = mintId({ name: '残虹', sourceId: '1046', pinned: new Map(), taken });
    const b = mintId({ name: '灵可', sourceId: '1047', pinned: new Map(), taken });
    expect(a).toBe('unnamed_1046');
    expect(b).toBe('unnamed_1047');
  });

  it('throws on a collision, naming both entities', () => {
    const taken = new Map();
    mintId({ name: 'A.K.A.-6', sourceId: '1', pinned: new Map(), taken });
    expect(() => mintId({ name: 'A K A 6', sourceId: '2', pinned: new Map(), taken })).toThrow(
      /Duplicate catalog id 'a_k_a_6'.*sourceId 2.*A\.K\.A\.-6/s,
    );
  });
});

describe('esc', () => {
  it('escapes single quotes and backslashes for single-quoted literals', () => {
    expect(esc("Ms. Moissan's")).toBe("Ms. Moissan\\'s");
    expect(esc('back\\slash')).toBe('back\\\\slash');
  });
});

describe('jsStr', () => {
  it('single-quotes plain strings (Prettier singleQuote default)', () => {
    expect(jsStr('Zero')).toBe("'Zero'");
  });

  it('double-quotes strings with an apostrophe and no double quote (no escape churn)', () => {
    expect(jsStr("Good Boy's Grand Adventure")).toBe('"Good Boy\'s Grand Adventure"');
    expect(jsStr("Hethereau's Keeper")).toBe('"Hethereau\'s Keeper"');
  });

  it('keeps single quotes when the string contains a double quote', () => {
    expect(jsStr('he said "hi"')).toBe('\'he said "hi"\'');
  });

  it('escapes backslashes', () => {
    expect(jsStr('back\\slash')).toBe("'back\\\\slash'");
  });
});

describe('toImageKitLocation', () => {
  it('strips /assets, underscores directory segments, keeps filename', () => {
    expect(toImageKitLocation('/assets/reverse-1999/arcanists/foo-bar.webp')).toEqual({
      folder: '/reverse_1999/arcanists',
      fileName: 'foo-bar.webp',
    });
  });

  it('handles absolute Windows paths', () => {
    expect(
      toImageKitLocation('C:\\repo\\public\\assets\\honkai-star-rail\\characters\\seele.webp'),
    ).toEqual({
      folder: '/honkai_star_rail/characters',
      fileName: 'seele.webp',
    });
  });

  it('returns null for paths without /assets/', () => {
    expect(toImageKitLocation('/somewhere/else/foo.webp')).toBeNull();
  });
});

describe('parseReuploadFlags', () => {
  it('no flags: nothing requested', () => {
    const { all, flags } = parseReuploadFlags(['relics'], []);
    expect(all).toBe(false);
    expect(flags.relics).toBe(false);
  });

  it('--reupload-all implies every type', () => {
    const { all, flags } = parseReuploadFlags(
      ['mugshots', 'full-art', 'psychubes'],
      ['--reupload-all'],
    );
    expect(all).toBe(true);
    expect(flags).toEqual({ mugshots: true, 'full-art': true, psychubes: true });
  });

  it('per-type flag only enables that type', () => {
    const { all, flags } = parseReuploadFlags(
      ['mugshots', 'full-art', 'psychubes'],
      ['--reupload-full-art'],
    );
    expect(all).toBe(false);
    expect(flags).toEqual({ mugshots: false, 'full-art': true, psychubes: false });
  });
});

describe('diffByKey / formatDiff', () => {
  const existing = [{ id: 'a' }, { id: 'b' }];
  const next = [{ id: 'b' }, { id: 'c' }];

  it('splits added and removed by key', () => {
    const { added, removed } = diffByKey(existing, next, (x) => x.id);
    expect(added).toEqual([{ id: 'c' }]);
    expect(removed).toEqual([{ id: 'a' }]);
  });

  it('formats a change summary and a no-change summary', () => {
    const { added, removed } = diffByKey(existing, next, (x) => x.id);
    expect(formatDiff(added, removed)).toBe('+1 added, -1 removed');
    expect(formatDiff([], [])).toBe('no changes');
  });
});

describe('generatedHeader', () => {
  it('produces the two banner lines', () => {
    expect(generatedHeader('StarRailRes', 'update-hsr-data.mjs')).toEqual([
      '// Auto-generated from StarRailRes — do not edit manually.',
      '// Run `node scripts/update-hsr-data.mjs` or trigger the GitHub Actions workflow to update.',
    ]);
  });
});

describe('initImageKit (disabled)', () => {
  beforeEach(() => {
    vi.stubEnv('IMAGEKIT_PRIVATE_KEY', '');
    vi.stubEnv('VITE_IMAGEKIT_PRIVATE_KEY', '');
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('reports disabled and short-circuits both operations without touching the network', async () => {
    const kit = initImageKit();
    expect(kit.enabled).toBe(false);
    await expect(kit.existsOnImageKit('/assets/x/y.webp')).resolves.toBe(false);
    await expect(
      kit.uploadToImageKit(Buffer.from(''), '/assets/x/y.webp'),
    ).resolves.toBeUndefined();
    expect(console.log).toHaveBeenCalledWith(
      'ImageKit uploads skipped (IMAGEKIT_PRIVATE_KEY not set)',
    );
  });

  describe('ensureAsset', () => {
    it('skips without fetching when the batched pre-check says the asset is on ImageKit', async () => {
      const kit = initImageKit();
      const fetchBuffer = vi.fn();
      await expect(
        kit.ensureAsset({
          localPath: '/assets/x/y.webp',
          label: 'Image',
          onKit: true,
          fetchBuffer,
        }),
      ).resolves.toBe('skipped');
      expect(fetchBuffer).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('    Image already on ImageKit, skipping');
    });

    it('fetches and uploads a missing asset, logging the missing-from-ImageKit reason', async () => {
      const kit = initImageKit();
      const fetchBuffer = vi.fn().mockResolvedValue(Buffer.from('img'));
      await expect(
        kit.ensureAsset({ localPath: '/assets/x/y.webp', label: 'Mugshot', fetchBuffer }),
      ).resolves.toBe('uploaded');
      expect(fetchBuffer).toHaveBeenCalledOnce();
      expect(console.log).toHaveBeenCalledWith(
        '    Mugshot missing from ImageKit — downloading...',
      );
    });

    it('re-fetches when reupload is requested, logging the reupload reason', async () => {
      const kit = initImageKit();
      const fetchBuffer = vi.fn().mockResolvedValue(Buffer.from('img'));
      await expect(
        kit.ensureAsset({
          localPath: '/assets/x/y.webp',
          label: 'Image',
          reupload: true,
          fetchBuffer,
        }),
      ).resolves.toBe('uploaded');
      expect(console.log).toHaveBeenCalledWith('    Image reupload requested — downloading...');
    });

    it('returns failed and warns with the label when the fetch closure throws', async () => {
      const kit = initImageKit();
      const fetchBuffer = vi.fn().mockRejectedValue(new Error('HTTP 404'));
      await expect(
        kit.ensureAsset({ localPath: '/assets/x/y.webp', label: 'Full-art', fetchBuffer }),
      ).resolves.toBe('failed');
      expect(console.warn).toHaveBeenCalledWith('    Full-art failed: HTTP 404');
    });
  });
});
