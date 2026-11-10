// Unit tests for the CZN Partner source-shape and seed rules. The live fetch
// and ImageKit paths are exercised by the weekly workflow, not here.
import { describe, it, expect, vi } from 'vitest';
import { selectPartnerNodes } from './czn-partners.mjs';
import { mintId } from './pipeline.mjs';

const partnerNode = (name) => ({ name, rarity: '5', class: 'Striker', faction: null });
const pageData = (hashes, listCount = 2) => ({
  staticQueryHashes: hashes,
  result: { data: { allCharacters: { nodes: Array.from({ length: listCount }, () => ({})) } } },
});
const payload = (nodes) => ({ data: { allContentfulChaosPartner: { nodes } } });

describe('selectPartnerNodes', () => {
  it('returns the nodes from the first static query carrying allContentfulChaosPartner', async () => {
    const nodes = [partnerNode('Akad'), partnerNode('Zeta')];
    const fetchStaticQuery = vi.fn(async (hash) =>
      hash === 'b' ? payload(nodes) : { data: { somethingElse: {} } },
    );
    const warn = vi.fn();
    await expect(
      selectPartnerNodes(pageData(['a', 'b', 'c']), { fetchStaticQuery, warn }),
    ).resolves.toBe(nodes);
    expect(fetchStaticQuery.mock.calls.map(([h]) => h)).toEqual(['a', 'b']);
    expect(warn).not.toHaveBeenCalled();
  });

  it('warns without failing when the page-data node count disagrees with the static query', async () => {
    const nodes = [partnerNode('Akad')];
    const warn = vi.fn();
    await expect(
      selectPartnerNodes(pageData(['a'], 3), {
        fetchStaticQuery: async () => payload(nodes),
        warn,
      }),
    ).resolves.toBe(nodes);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('has 3 nodes but static query a has 1'),
    );
  });

  it('throws when the page-data lists no static query hashes', async () => {
    await expect(
      selectPartnerNodes({ staticQueryHashes: [] }, { fetchStaticQuery: vi.fn() }),
    ).rejects.toThrow('staticQueryHashes missing/empty');
    await expect(selectPartnerNodes({}, { fetchStaticQuery: vi.fn() })).rejects.toThrow(
      'staticQueryHashes missing/empty',
    );
  });

  it('throws naming every hash when no payload carries partner nodes', async () => {
    const fetchStaticQuery = async () => ({ data: { allContentfulChaosPartner: { nodes: [] } } });
    await expect(selectPartnerNodes(pageData(['x', 'y']), { fetchStaticQuery })).rejects.toThrow(
      'no payload among x, y carries allContentfulChaosPartner.nodes',
    );
  });
});

describe('partner id minting', () => {
  it('throws when two partner names slugify to the same kebab id', () => {
    const taken = new Map();
    mintId({ name: 'Mei Lin', sourceId: '1', taken, separator: '-' });
    expect(() => mintId({ name: 'Mei-Lin', sourceId: '2', taken, separator: '-' })).toThrow(
      /Duplicate catalog id 'mei-lin'/,
    );
  });
});
