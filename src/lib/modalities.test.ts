import { describe, it, expect, vi } from 'vitest';
import type { Game } from '@/lib/games';
import { MODALITIES, gamesByModality } from '@/lib/modalities';

// gamesByModality defaults to the real GAMES array; these tests pass explicit
// fixtures, so the lazy pages (and their Supabase imports) never load.
vi.mock('@/lib/games', () => ({ GAMES: [] }));

function makeGame(id: string, modality: Game['modality']): Game {
  return {
    id,
    name: id,
    path: `/${id}`,
    developer: 'dev',
    description: 'desc',
    icon: `/assets/icons/${id}.webp`,
    color: '#000000',
    coverImage: `/assets/${id}/cover.webp`,
    bgClass: `bg-${id}-sel`,
    modality,
    Page: null as unknown as Game['Page'],
  };
}

describe('MODALITIES registry', () => {
  it('lists roster first and collection second', () => {
    expect(MODALITIES.map((m) => m.id)).toEqual(['roster', 'collection']);
  });

  it('has unique ids and complete copy', () => {
    expect(new Set(MODALITIES.map((m) => m.id)).size).toBe(MODALITIES.length);
    for (const modality of MODALITIES) {
      expect(modality.title).toBeTruthy();
      expect(modality.subtitle).toBeTruthy();
    }
  });
});

describe('gamesByModality', () => {
  it('groups games in modality order, keeping registry order within a group', () => {
    const games = [makeGame('a', 'roster'), makeGame('c', 'collection'), makeGame('b', 'roster')];
    const groups = gamesByModality(games);
    expect(groups.map((g) => g.modality.id)).toEqual(['roster', 'collection']);
    expect(groups[0].games.map((g) => g.id)).toEqual(['a', 'b']);
    expect(groups[1].games.map((g) => g.id)).toEqual(['c']);
  });

  it('omits modalities with no games', () => {
    const groups = gamesByModality([makeGame('a', 'roster')]);
    expect(groups.map((g) => g.modality.id)).toEqual(['roster']);
  });

  it('returns nothing for an empty registry', () => {
    expect(gamesByModality([])).toEqual([]);
  });
});
