import { createRosterPersistence } from '@/services/rosterPersistence';
import type { CznCombatantPatch, CznTrackedCombatant } from '@/types';
import { ALL_CZN_COMBATANTS, type CznCombatant } from '@/data/chaos-zero-nightmare/combatants';

/** Maps each camelCase patch key to its DB column. Schema stays service-private. */
const COMBATANT_COLUMNS: Record<keyof CznCombatantPatch, string> = {
  level: 'level',
  ego: 'ego',
  potentialAttained: 'potential_attained',
  isFavorited: 'is_favorited',
};

const svc = createRosterPersistence<CznCombatant, CznTrackedCombatant, CznCombatantPatch>({
  table: 'czn_tracked_combatants',
  entityIdColumn: 'combatant_id',
  catalog: ALL_CZN_COMBATANTS,
  columns: COMBATANT_COLUMNS,
  insertDefaults: {
    level: 1,
    ego: 0,
    potential_attained: false,
  },
  select: 'id, combatant_id, level, ego, potential_attained, is_favorited',
  fromRow: (row, base) => ({
    ...base,
    dbId: row.id,
    isFavorited: !!row.is_favorited,
    level: row.level,
    ego: row.ego ?? 0,
    potentialAttained: !!row.potential_attained,
  }),
});

export const loadCombatantsFromDB = svc.load;
export const insertCombatant = svc.insert;
export const deleteCombatant = svc.remove;
export const updateCombatant = svc.update;
