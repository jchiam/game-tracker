// Unit tests for the shared update-pipeline helpers. Network-bound paths
// (fetchJSON, downloadImage, live ImageKit calls) are exercised by the real
// weekly workflows, not here.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  toImageKitLocation,
  initImageKit,
  parseReuploadFlags,
  slugify,
  esc,
  jsStr,
  diffByKey,
  formatDiff,
  generatedHeader,
} from './pipeline.mjs';

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
