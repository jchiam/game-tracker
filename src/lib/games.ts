import { lazy } from 'react';
import type { ComponentType, LazyExoticComponent } from 'react';
import type { Session } from '@supabase/supabase-js';

/** Props every game page accepts; App passes the same trio to each route. */
export interface GamePageProps {
  session: Session | null;
  isAuthLoading: boolean;
  onSignIn: () => void;
}

export interface Game {
  /** Short game id used in commits, tokens, and table prefixes: 'hsr', 'r1999', 'n2e', 'ae'. */
  id: string;
  name: string;
  /** Route path; also the prefix GameSwitcher matches to highlight the active game. */
  path: string;
  developer: string;
  description: string;
  /** GameSwitcher dropdown icon. */
  icon: string;
  /** Game accent colour (switcher metadata). */
  color: string;
  /** SelectionPage card cover image. */
  coverImage: string;
  /** SelectionPage card header background class from index.css. */
  bgClass: string;
  Page: LazyExoticComponent<ComponentType<GamePageProps>>;
}

/**
 * Single source of truth for the game roster. Adding a game here wires it into
 * the router, the GameSwitcher dropdown, and the SelectionPage grid at once —
 * see the CLAUDE.md "Wiring a New Game Into the App" checklist for the rest.
 */
export const GAMES: Game[] = [
  {
    id: 'hsr',
    name: 'Honkai Star Rail',
    path: '/honkai-star-rail',
    developer: 'HoYoverse',
    description: 'Track trailblazers, relics, and warp progress.',
    icon: '/assets/icons/hsr-icon.webp',
    color: '#00ccff',
    coverImage: '/assets/honkai-star-rail/selection-cover.webp',
    bgClass: 'bg-honkai-star-rail-sel',
    Page: lazy(() =>
      import('@/pages/honkai-star-rail/HsrPage').then((m) => ({ default: m.HsrPage })),
    ),
  },
  {
    id: 'r1999',
    name: 'Reverse: 1999',
    path: '/reverse-1999',
    developer: 'Bluepoch',
    description: 'Track arcanists, psychubes, and wilderness materials.',
    icon: '/assets/icons/r1999-icon.png',
    color: '#deb887',
    coverImage: '/assets/reverse-1999/selection-cover.webp',
    bgClass: 'bg-r1999-sel',
    Page: lazy(() =>
      import('@/pages/reverse1999/Reverse1999Page').then((m) => ({ default: m.Reverse1999Page })),
    ),
  },
  {
    id: 'n2e',
    name: 'Neverness to Everness',
    path: '/neverness-to-everness',
    developer: 'Hotta Studio',
    description: 'Track espers, awakenings, and team compositions.',
    icon: '/assets/icons/n2e-icon.png',
    color: '#7b2dff',
    coverImage: '/assets/neverness-to-everness/selection-cover.webp',
    bgClass: 'bg-n2e-sel',
    Page: lazy(() =>
      import('@/pages/neverness-to-everness/N2ePage').then((m) => ({ default: m.N2ePage })),
    ),
  },
  {
    id: 'ae',
    name: 'Arknights: Endfield',
    path: '/arknights-endfield',
    developer: 'Hypergryph',
    description: 'Track operators, levels, and squad compositions.',
    icon: '/assets/icons/endfield-icon.png',
    color: '#47c7fd',
    coverImage: '/assets/arknights-endfield/selection-cover.webp',
    bgClass: 'bg-ae-sel',
    Page: lazy(() =>
      import('@/pages/arknights-endfield/ArknightsEndfieldPage').then((m) => ({
        default: m.ArknightsEndfieldPage,
      })),
    ),
  },
  {
    id: 'p5x',
    name: 'Persona 5: The Phantom X',
    path: '/persona-5-phantom-x',
    developer: 'Black Wing Game Studio',
    description: 'Track thieves, awareness, and party compositions.',
    icon: '/assets/icons/p5x-icon.png',
    color: '#f84f36',
    coverImage: '/assets/persona-5-phantom-x/selection-cover.webp',
    bgClass: 'bg-p5x-sel',
    Page: lazy(() =>
      import('@/pages/persona-5-phantom-x/P5xPage').then((m) => ({ default: m.P5xPage })),
    ),
  },
];
