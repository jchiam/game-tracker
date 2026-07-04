import { createRosterPersistence } from '@/services/rosterPersistence';
import type { AeOperatorPatch, AeTrackedOperator } from '@/types';
import { ALL_OPERATORS, type AeOperator } from '@/data/arknights-endfield/operators';

/** Maps each camelCase patch key to its DB column. Schema stays service-private. */
const OPERATOR_COLUMNS: Record<keyof AeOperatorPatch, string> = {
  level: 'level',
  phase: 'phase',
  skillsMaxed: 'skills_maxed',
  weaponName: 'weapon_name',
  weaponLevel: 'weapon_level',
  weaponPreferences: 'weapon_preferences',
  isFavorited: 'is_favorited',
};

const svc = createRosterPersistence<AeOperator, AeTrackedOperator, AeOperatorPatch>({
  table: 'ae_tracked_operators',
  entityIdColumn: 'operator_id',
  catalog: ALL_OPERATORS,
  columns: OPERATOR_COLUMNS,
  insertDefaults: {
    level: 1,
    phase: 0,
    skills_maxed: false,
    weapon_level: 1,
  },
  select:
    'id, operator_id, level, phase, skills_maxed, weapon_name, weapon_level, weapon_preferences, is_favorited',
  fromRow: (row, base) => ({
    ...base,
    dbId: row.id,
    isFavorited: !!row.is_favorited,
    level: row.level,
    phase: row.phase ?? 0,
    skillsMaxed: !!row.skills_maxed,
    weaponName: row.weapon_name ?? null,
    weaponLevel: row.weapon_level ?? 1,
    weaponPreferences: row.weapon_preferences ?? [],
  }),
});

export const loadOperatorsFromDB = svc.load;
export const insertOperator = svc.insert;
export const deleteOperator = svc.remove;
export const updateOperator = svc.update;
