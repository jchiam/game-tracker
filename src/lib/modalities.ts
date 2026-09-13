import { GAMES, type Game } from '@/lib/games';

/**
 * Tracker Modality — the shape of tracking a registry entry offers. `roster`
 * entries are live-service gacha rosters (tracked entities, builds, parties);
 * `collection` entries are physical collectibles with ownership state and a
 * completion view. See "Tracker Modality" in CONTEXT.md.
 */
export type TrackerModality = 'roster' | 'collection';

export interface Modality {
  id: TrackerModality;
  /** Home-page section heading and switcher group label. */
  title: string;
  /** Home-page section subtitle. */
  subtitle: string;
}

/**
 * Ordered registry of modalities. Array order is display order everywhere
 * modalities are listed (home page sections, switcher groups). Adding a
 * modality here plus games that reference it is all a new section needs.
 */
export const MODALITIES: Modality[] = [
  {
    id: 'roster',
    title: 'Live-Service Rosters',
    subtitle: 'Gacha rosters, builds, and lineups.',
  },
  {
    id: 'collection',
    title: 'Collections',
    subtitle: 'Physical collectibles and completion.',
  },
];

export interface ModalityGroup {
  modality: Modality;
  games: Game[];
}

/**
 * Games grouped by modality, in `MODALITIES` order with `GAMES` order kept
 * within each group. Modalities with no games are omitted. The single
 * grouping used by `SelectionPage` and `GameSwitcher` — consumers never
 * filter `GAMES` by modality themselves.
 */
export function gamesByModality(games: Game[] = GAMES): ModalityGroup[] {
  return MODALITIES.map((modality) => ({
    modality,
    games: games.filter((game) => game.modality === modality.id),
  })).filter((group) => group.games.length > 0);
}
