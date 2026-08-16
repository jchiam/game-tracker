import { describe, it, expect, afterEach, vi } from 'vitest';
import { Suspense } from 'react';
import { screen, cleanup } from '@testing-library/react';
import { GAMES } from '@/lib/games';
import { renderWithProviders } from '@/test/utils';

describe('GAMES registry', () => {
  it('contains the six tracked games', () => {
    expect(GAMES.map((g) => g.id)).toEqual(['hsr', 'r1999', 'n2e', 'ae', 'p5x', 'zzz']);
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

  // Renders each lazy Page so the dynamic import() and its module mapper
  // actually execute — a typo in either would otherwise only surface at runtime.
  describe('lazy pages', () => {
    afterEach(() => cleanup());

    it.each(GAMES.map((game) => [game.id, game] as const))(
      '%s Page resolves and renders its auth gate',
      async (_id, game) => {
        renderWithProviders(
          <Suspense fallback={<div>chunk-loading</div>}>
            <game.Page session={null} isAuthLoading={false} onSignIn={vi.fn()} />
          </Suspense>,
        );
        expect(
          await screen.findByRole('button', { name: /sign in with google/i }),
        ).toBeInTheDocument();
      },
    );
  });
});
