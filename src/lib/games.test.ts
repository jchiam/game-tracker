import { describe, it, expect } from 'vitest';
import { GAMES } from '@/lib/games';

describe('GAMES registry', () => {
  it('contains the five tracked games', () => {
    expect(GAMES.map((g) => g.id)).toEqual(['hsr', 'r1999', 'n2e', 'ae', 'p5x']);
  });

  it('has unique ids and paths', () => {
    expect(new Set(GAMES.map((g) => g.id)).size).toBe(GAMES.length);
    expect(new Set(GAMES.map((g) => g.path)).size).toBe(GAMES.length);
  });

  it('every path is absolute and not the selection route', () => {
    for (const game of GAMES) {
      expect(game.path).toMatch(/^\/[a-z0-9-]+$/);
    }
  });

  it('every entry has complete metadata', () => {
    for (const game of GAMES) {
      expect(game.name).toBeTruthy();
      expect(game.developer).toBeTruthy();
      expect(game.description).toBeTruthy();
      expect(game.icon).toMatch(/^\/assets\//);
      expect(game.coverImage).toMatch(/^\/assets\//);
      expect(game.color).toMatch(/^#[0-9a-f]{6}$/i);
      expect(game.bgClass).toMatch(/^bg-.+-sel$/);
      expect(game.Page).toBeDefined();
    }
  });
});
