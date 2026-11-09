import { useCallback } from 'react';
import { type Session } from '@supabase/supabase-js';
import { ALL_CZN_COMBATANTS, type CznCombatant } from '@/data/chaos-zero-nightmare/combatants';
import type { CznCombatantPatch, CznTrackedCombatant } from '@/types';
import {
  loadCombatantsFromDB,
  insertCombatant,
  deleteCombatant,
  updateCombatant,
} from '@/services/chaos-zero-nightmare/combatantService';
import { useRoster } from '@/hooks/useRoster';
import { CZN_MAX_EGO, CZN_MAX_LEVEL } from '@/hooks/chaos-zero-nightmare/combatantLimits';

export { CZN_MAX_EGO, CZN_MAX_LEVEL };

function createTrackedCombatant(combatant: CznCombatant): CznTrackedCombatant {
  return {
    ...combatant,
    isFavorited: false,
    level: 1,
    ego: 0,
    potentialAttained: false,
  };
}

export function useCombatants(session: Session | null, isAuthLoading: boolean) {
  const {
    availableEntities: availableCombatants,
    trackedEntities: trackedCombatants,
    isInitialLoad,
    isLoadError,
    retryLoad,
    pendingSaveCount,
    addEntity: addCombatant,
    removeEntity: removeCombatant,
    makeFieldUpdater,
    filterRoster,
  } = useRoster<CznCombatant, CznTrackedCombatant, CznCombatantPatch>(session, isAuthLoading, {
    allEntities: ALL_CZN_COMBATANTS,
    loadFromDB: loadCombatantsFromDB,
    insertEntity: insertCombatant,
    deleteEntity: deleteCombatant,
    updateEntity: updateCombatant,
    createTracked: createTrackedCombatant,
    nounSingular: 'combatant',
    nounPlural: 'combatants',
    fuseKeys: ['name', 'class', 'element'],
  });

  const updateLevel = makeFieldUpdater('level', { clamp: [1, CZN_MAX_LEVEL] });
  const updateEgo = makeFieldUpdater('ego', { clamp: [0, CZN_MAX_EGO] });
  const togglePotential = makeFieldUpdater('potentialAttained');
  const toggleFavorite = makeFieldUpdater('isFavorited');

  const getFilteredRoster = useCallback(
    (
      searchTerm: string,
      sortBy: 'ALPHA' | 'LEVEL',
      predicate?: (c: CznTrackedCombatant) => boolean,
      entities?: CznTrackedCombatant[],
    ) => {
      const sorted = filterRoster(
        searchTerm,
        sortBy === 'LEVEL' ? (a, b) => b.level - a.level : undefined,
        entities,
      );
      return predicate ? sorted.filter(predicate) : sorted;
    },
    [filterRoster],
  );

  return {
    availableCombatants,
    trackedCombatants,
    isInitialLoad,
    isLoadError,
    retryLoad,
    pendingSaveCount,
    addCombatant,
    removeCombatant,
    updateLevel,
    updateEgo,
    togglePotential,
    toggleFavorite,
    getFilteredRoster,
  };
}
