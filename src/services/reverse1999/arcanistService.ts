import { createRosterPersistence } from '@/services/rosterPersistence';
import type { R1999ArcanistPatch, R1999TrackedArcanist } from '@/types';
import { ALL_ARCANISTS, type Arcanist } from '@/data/reverse1999/arcanists';

/** Maps each camelCase patch key to its DB column. Schema stays service-private. */
const ARCANIST_COLUMNS: Record<keyof R1999ArcanistPatch, string> = {
  level: 'level',
  portraitLevel: 'portrait_level',
  resonanceLevel: 'resonance_level',
  euphoriaStage: 'euphoria_stage',
  psychubeName: 'psychube_name',
  psychubeLevel: 'psychube_level',
  psychubeAmplification: 'psychube_amplification',
  isFavorited: 'is_favorited',
};

const svc = createRosterPersistence<Arcanist, R1999TrackedArcanist, R1999ArcanistPatch>({
  table: 'r1999_tracked_arcanists',
  entityIdColumn: 'arcanist_id',
  catalog: ALL_ARCANISTS,
  columns: ARCANIST_COLUMNS,
  insertDefaults: {
    level: 1,
    portrait_level: 0,
    resonance_level: 0,
    euphoria_stage: 0,
    psychube_name: null,
    psychube_level: 1,
    psychube_amplification: 1,
  },
  select:
    'id, arcanist_id, level, portrait_level, resonance_level, is_favorited, euphoria_stage, psychube_name, psychube_level, psychube_amplification',
  fromRow: (row, base) => ({
    ...base,
    dbId: row.id,
    isFavorited: !!row.is_favorited,
    level: row.level,
    portraitLevel: row.portrait_level ?? 0,
    resonanceLevel: row.resonance_level ?? 0,
    euphoriaStage: row.euphoria_stage ?? 0,
    psychubeName: row.psychube_name ?? null,
    psychubeLevel: row.psychube_level ?? 1,
    psychubeAmplification: row.psychube_amplification ?? 1,
  }),
});

export const loadArcanistsFromDB = svc.load;
export const insertArcanist = svc.insert;
export const deleteArcanist = svc.remove;
export const updateArcanist = svc.update;
