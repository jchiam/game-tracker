import { createRosterPersistence } from '@/services/rosterPersistence';
import type { P5xThiefPatch, P5xTrackedThief } from '@/types';
import { ALL_THIEVES, type P5xThief } from '@/data/persona-5-phantom-x/thieves';

/** Maps each camelCase patch key to its DB column. Schema stays service-private. */
const THIEF_COLUMNS: Record<keyof P5xThiefPatch, string> = {
  level: 'level',
  awareness: 'awareness',
  isFavorited: 'is_favorited',
};

const svc = createRosterPersistence<P5xThief, P5xTrackedThief, P5xThiefPatch>({
  table: 'p5x_tracked_thieves',
  entityIdColumn: 'thief_id',
  catalog: ALL_THIEVES,
  columns: THIEF_COLUMNS,
  insertDefaults: {
    level: 1,
    awareness: 0,
  },
  select: 'id, thief_id, level, awareness, is_favorited',
  fromRow: (row, base) => ({
    ...base,
    dbId: row.id,
    isFavorited: !!row.is_favorited,
    level: row.level,
    awareness: row.awareness ?? 0,
  }),
});

export const loadThievesFromDB = svc.load;
export const insertThief = svc.insert;
export const deleteThief = svc.remove;
export const updateThief = svc.update;
