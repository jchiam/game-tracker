// Unit tests for the CZN combatant art-source rules, with every fetcher stubbed.
import { describe, it, expect, vi } from 'vitest';
import {
  combatantReuploadModes,
  resolveCombatantArt,
  seedCombatantFaces,
} from './czn-combatant-art.mjs';
import { slugify } from './pipeline.mjs';

const mint = (name) => slugify(name, '-');

const HARU = { id: 'haru', name: 'Haru', imageSource: 'https://game8.test/haru.png' };
const FEI = { id: 'fei', name: 'Fei', imageSource: 'https://game8.test/fei.png' };
const NEW = { id: 'new-unit', name: 'New Unit', imageSource: 'https://game8.test/new.png' };

const UNITS = [
  { charId: '1062', name: 'Haru' },
  { charId: '30048', name: 'Fei' },
];

// Stubbed sources; each test overrides what it needs.
function deps(overrides = {}) {
  return {
    mint,
    overridesLabel: 'overrides.json',
    fetchMetaDecksUnits: vi.fn(async () => UNITS),
    fetchPrydwenNodes: vi.fn(async () => new Map()),
    fetchPrydwenCardUrl: vi.fn(async (id) => `https://prydwen.test/${id}_card.webp`),
    warn: vi.fn(),
    ...overrides,
  };
}

describe('combatantReuploadModes', () => {
  it('reuploads nothing by default', () => {
    expect(combatantReuploadModes({ all: false, flags: {} })).toEqual({
      portraits: false,
      faces: false,
    });
  });

  it('redoes faces along with portraits', () => {
    expect(combatantReuploadModes({ all: false, flags: { combatants: true } })).toEqual({
      portraits: true,
      faces: true,
    });
  });

  it('redoes faces alone under the faces flag', () => {
    expect(combatantReuploadModes({ all: false, flags: { 'combatant-faces': true } })).toEqual({
      portraits: false,
      faces: true,
    });
  });

  it('redoes both under --reupload-all', () => {
    expect(combatantReuploadModes({ all: true, flags: {} })).toEqual({
      portraits: true,
      faces: true,
    });
  });
});

describe('resolveCombatantArt', () => {
  it('uses the Meta Decks portrait for a joined combatant and never asks Prydwen', async () => {
    const d = deps();
    const sources = await resolveCombatantArt([HARU, FEI], d);
    expect(sources.get('haru')).toEqual({
      kind: 'metadecks',
      sourceUrl: 'https://cdn.czndecksmeta.com/face/character/portrait_character_1062.webp',
      charId: '1062',
      faceBox: undefined,
    });
    expect(sources.get('fei').kind).toBe('metadecks');
    expect(d.fetchPrydwenNodes).not.toHaveBeenCalled();
    expect(d.fetchPrydwenCardUrl).not.toHaveBeenCalled();
    expect(d.warn).not.toHaveBeenCalled();
  });

  it('carries an override face box on the Meta Decks source', async () => {
    const face = { left: 310, top: 150, side: 190 };
    const sources = await resolveCombatantArt(
      [HARU],
      deps({ overrides: new Map([['haru', { face }]]) }),
    );
    expect(sources.get('haru').faceBox).toEqual(face);
  });

  it('warns and uses Prydwen card art for a unit Meta Decks lacks', async () => {
    const d = deps({ fetchPrydwenNodes: vi.fn(async () => new Map([['new-unit', {}]])) });
    const sources = await resolveCombatantArt([HARU, NEW], d);
    expect(sources.get('new-unit')).toEqual({
      kind: 'prydwen',
      sourceUrl: 'https://prydwen.test/new-unit_card.webp',
    });
    expect(d.fetchPrydwenCardUrl).toHaveBeenCalledTimes(1);
    expect(d.fetchPrydwenCardUrl).toHaveBeenCalledWith('new-unit');
    expect(d.warn).toHaveBeenCalledWith(
      expect.stringContaining('new-unit joins no CZN Meta Decks unit'),
    );
  });

  it('uses the Game8 icon for a unit neither art source knows', async () => {
    const d = deps();
    const sources = await resolveCombatantArt([NEW], d);
    expect(sources.get('new-unit')).toEqual({
      kind: 'game8',
      sourceUrl: 'https://game8.test/new.png',
    });
    expect(d.fetchPrydwenCardUrl).not.toHaveBeenCalled();
  });

  it('reports a null source when Game8 has no image either', async () => {
    const sources = await resolveCombatantArt([{ id: 'bare', name: 'Bare' }], deps());
    expect(sources.get('bare')).toEqual({ kind: 'game8', sourceUrl: null });
  });

  it('relays override warnings under the seed label', async () => {
    const d = deps({ overrides: new Map([['ghost', { charId: '1062' }]]) });
    await resolveCombatantArt([HARU], d);
    expect(d.warn).toHaveBeenCalledWith(
      '    overrides.json: override for "ghost" matches no combatant',
    );
  });

  describe('Meta Decks unreachable', () => {
    const down = () => vi.fn(async () => Promise.reject(new Error('503')));

    it('warns and falls back to Prydwen then Game8 when nothing is re-uploaded', async () => {
      const d = deps({
        fetchMetaDecksUnits: down(),
        fetchPrydwenNodes: vi.fn(async () => new Map([['haru', {}]])),
      });
      const sources = await resolveCombatantArt([HARU, FEI], d);
      expect(sources.get('haru').kind).toBe('prydwen');
      expect(sources.get('fei')).toEqual({ kind: 'game8', sourceUrl: FEI.imageSource });
      expect(d.warn).toHaveBeenCalledWith(
        '  CZN Meta Decks art unavailable (503) — using Prydwen and Game8',
      );
    });

    it('aborts during a portrait reupload', async () => {
      const d = deps({
        fetchMetaDecksUnits: down(),
        reupload: { portraits: true, faces: true },
      });
      await expect(resolveCombatantArt([HARU], d)).rejects.toThrow('503');
      expect(d.fetchPrydwenNodes).not.toHaveBeenCalled();
    });

    it('aborts during a face-only reupload', async () => {
      const d = deps({
        fetchMetaDecksUnits: down(),
        reupload: { portraits: false, faces: true },
      });
      await expect(resolveCombatantArt([HARU], d)).rejects.toThrow('503');
    });
  });

  describe('Prydwen unreachable', () => {
    const listDown = () => vi.fn(async () => Promise.reject(new Error('list 500')));

    it('warns and uses Game8 icons when nothing is re-uploaded', async () => {
      const d = deps({ fetchPrydwenNodes: listDown() });
      const sources = await resolveCombatantArt([HARU, NEW], d);
      expect(sources.get('haru').kind).toBe('metadecks');
      expect(sources.get('new-unit')).toEqual({ kind: 'game8', sourceUrl: NEW.imageSource });
      expect(d.warn).toHaveBeenCalledWith(
        '  Prydwen card art unavailable (list 500) — using Game8 icons',
      );
    });

    it('aborts during a portrait reupload when a combatant needs it', async () => {
      const d = deps({
        fetchPrydwenNodes: listDown(),
        reupload: { portraits: true, faces: true },
      });
      await expect(resolveCombatantArt([HARU, NEW], d)).rejects.toThrow('list 500');
    });

    it('does not abort a portrait reupload when every combatant has Meta Decks art', async () => {
      const d = deps({
        fetchPrydwenNodes: listDown(),
        reupload: { portraits: true, faces: true },
      });
      const sources = await resolveCombatantArt([HARU, FEI], d);
      expect(sources.size).toBe(2);
      expect(d.fetchPrydwenNodes).not.toHaveBeenCalled();
    });

    it('does not abort a face-only reupload', async () => {
      const d = deps({
        fetchPrydwenNodes: listDown(),
        reupload: { portraits: false, faces: true },
      });
      const sources = await resolveCombatantArt([NEW], d);
      expect(sources.get('new-unit').kind).toBe('game8');
    });

    it('falls back per unit when one detail fetch fails', async () => {
      const d = deps({
        fetchPrydwenNodes: vi.fn(async () => new Map([['new-unit', {}]])),
        fetchPrydwenCardUrl: vi.fn(async () => Promise.reject(new Error('detail 404'))),
      });
      const sources = await resolveCombatantArt([NEW], d);
      expect(sources.get('new-unit').kind).toBe('game8');
      expect(d.warn).toHaveBeenCalledWith(
        '  Prydwen card art for new-unit unavailable (detail 404) — using Game8 icon',
      );
    });

    it('aborts a portrait reupload when one detail fetch fails', async () => {
      const d = deps({
        fetchPrydwenNodes: vi.fn(async () => new Map([['new-unit', {}]])),
        fetchPrydwenCardUrl: vi.fn(async () => Promise.reject(new Error('detail 404'))),
        reupload: { portraits: true, faces: true },
      });
      await expect(resolveCombatantArt([NEW], d)).rejects.toThrow('detail 404');
    });
  });
});

describe('seedCombatantFaces', () => {
  const facePath = (id) => `/assets/chaos-zero-nightmare/combatant-faces/${id}.webp`;
  const MD = {
    id: 'haru',
    name: 'Haru',
    sourceUrl: 'https://cdn.test/portrait_1062.webp',
    art: { charId: '1062' },
  };
  const FALLBACK = { id: 'new-unit', name: 'New Unit', sourceUrl: 'https://game8.test/new.png' };

  // ensureAsset stand-ins: one that always skips, one that always fetches.
  const skipping = () => vi.fn(async () => 'skipped');
  const uploading = () =>
    vi.fn(async ({ fetchBuffer }) => {
      try {
        await fetchBuffer();
        return 'uploaded';
      } catch {
        return 'failed';
      }
    });

  function faceDeps(overrides = {}) {
    return {
      facePath,
      download: vi.fn(async (url) => `bytes:${url}`),
      build: vi.fn(async () => ({ buffer: 'face', source: 'match' })),
      topSquare: vi.fn(async () => 'square'),
      ...overrides,
    };
  }

  it('downloads nothing for a face that is already uploaded', async () => {
    const d = faceDeps({ ensureAsset: skipping() });
    const result = await seedCombatantFaces([MD, FALLBACK], d);
    expect(result.counts).toEqual({ skipped: 2, uploaded: 0, failed: 0 });
    expect(d.download).not.toHaveBeenCalled();
    expect(d.build).not.toHaveBeenCalled();
  });

  it('passes the reupload mode and the derived face path to ensureAsset', async () => {
    const d = faceDeps({ ensureAsset: skipping(), reupload: true });
    await seedCombatantFaces([MD], d);
    expect(d.ensureAsset).toHaveBeenCalledWith(
      expect.objectContaining({
        localPath: '/assets/chaos-zero-nightmare/combatant-faces/haru.webp',
        label: 'Face for Haru',
        reupload: true,
        mimeType: 'image/webp',
      }),
    );
  });

  it('builds a Meta Decks face from the portrait and the face icon', async () => {
    const d = faceDeps({ ensureAsset: uploading() });
    const result = await seedCombatantFaces([MD], d);
    expect(d.download).toHaveBeenCalledWith('https://cdn.test/portrait_1062.webp');
    expect(d.download).toHaveBeenCalledWith(
      'https://cdn.czndecksmeta.com/face/character/face_character_1062.webp',
    );
    expect(d.build).toHaveBeenCalledWith({
      portrait: 'bytes:https://cdn.test/portrait_1062.webp',
      icon: 'bytes:https://cdn.czndecksmeta.com/face/character/face_character_1062.webp',
      box: undefined,
    });
    expect(result.counts.uploaded).toBe(1);
    expect(result.iconFallbacks).toEqual([]);
  });

  it('skips the icon download when a manual face box is given', async () => {
    const box = { left: 1, top: 2, side: 3 };
    const d = faceDeps({ ensureAsset: uploading() });
    await seedCombatantFaces([{ ...MD, art: { charId: '1062', faceBox: box } }], d);
    expect(d.download).toHaveBeenCalledTimes(1);
    expect(d.build).toHaveBeenCalledWith(expect.objectContaining({ icon: null, box }));
  });

  it('names combatants whose face fell back to the game icon', async () => {
    const d = faceDeps({
      ensureAsset: uploading(),
      build: vi.fn(async () => ({ buffer: 'icon', source: 'icon' })),
    });
    const result = await seedCombatantFaces([MD], d);
    expect(result.iconFallbacks).toEqual(['haru']);
  });

  it('uses the top square of fallback art and never matches', async () => {
    const d = faceDeps({ ensureAsset: uploading() });
    const result = await seedCombatantFaces([FALLBACK], d);
    expect(d.topSquare).toHaveBeenCalledWith('bytes:https://game8.test/new.png');
    expect(d.build).not.toHaveBeenCalled();
    expect(result.counts.uploaded).toBe(1);
  });

  it('counts a combatant without any portrait source as missing', async () => {
    const d = faceDeps({ ensureAsset: uploading() });
    const result = await seedCombatantFaces([{ id: 'bare', name: 'Bare', sourceUrl: null }], d);
    expect(result.missing).toEqual(['bare']);
    expect(d.ensureAsset).not.toHaveBeenCalled();
  });

  it('counts a failed face as failed and missing', async () => {
    const d = faceDeps({
      ensureAsset: uploading(),
      download: vi.fn(async () => Promise.reject(new Error('404'))),
    });
    const result = await seedCombatantFaces([MD], d);
    expect(result.counts.failed).toBe(1);
    expect(result.missing).toEqual(['haru']);
  });
});
