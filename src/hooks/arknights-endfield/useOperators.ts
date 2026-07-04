import { useCallback } from 'react';
import { type Session } from '@supabase/supabase-js';
import { ALL_OPERATORS, type AeOperator } from '@/data/arknights-endfield/operators';
import type { AeOperatorPatch, AeWeaponPatch, AeTrackedOperator } from '@/types';
import {
  loadOperatorsFromDB,
  insertOperator,
  deleteOperator,
  updateOperator,
} from '@/services/arknights-endfield/operatorService';
import { useRoster } from '@/hooks/useRoster';

function createTrackedOperator(operator: AeOperator): AeTrackedOperator {
  return {
    ...operator,
    isFavorited: false,
    level: 1,
    phase: 0,
    skillsMaxed: false,
    weaponName: null,
    weaponLevel: 1,
    weaponPreferences: [],
  };
}

export function useOperators(session: Session | null, isAuthLoading: boolean) {
  const {
    availableEntities: availableOperators,
    trackedEntities: trackedOperators,
    isInitialLoad,
    isLoadError,
    retryLoad,
    pendingSaveCount,
    addEntity: addOperator,
    removeEntity: removeOperator,
    applyPatch,
    makeFieldUpdater,
    filterRoster,
  } = useRoster<AeOperator, AeTrackedOperator, AeOperatorPatch>(session, isAuthLoading, {
    allEntities: ALL_OPERATORS,
    loadFromDB: loadOperatorsFromDB,
    insertEntity: insertOperator,
    deleteEntity: deleteOperator,
    updateEntity: updateOperator,
    createTracked: createTrackedOperator,
    nounSingular: 'operator',
    nounPlural: 'operators',
    fuseKeys: ['name', 'class', 'element', 'weapon'],
  });

  const updateLevel = makeFieldUpdater('level', { clamp: [1, 90] });
  const updatePhase = makeFieldUpdater('phase', { clamp: [0, 5] });
  const updateSkillsMaxed = makeFieldUpdater('skillsMaxed');
  const toggleFavorite = makeFieldUpdater('isFavorited');
  const updateWeaponPreferences = makeFieldUpdater('weaponPreferences', {
    // A weapon id may appear at most once; keep first occurrence, preserve order.
    transform: (preferences) => preferences.filter((p, i) => preferences.indexOf(p) === i),
  });

  const updateWeapon = (id: string, patch: AeWeaponPatch) => {
    const normalized: AeWeaponPatch = { ...patch };
    if (normalized.weaponLevel !== undefined) {
      normalized.weaponLevel = Math.min(90, Math.max(1, normalized.weaponLevel));
    }
    applyPatch(id, normalized);
  };

  const getFilteredRoster = useCallback(
    (searchTerm: string, sortBy: 'ALPHA' | 'LEVEL') =>
      filterRoster(searchTerm, sortBy === 'LEVEL' ? (a, b) => b.level - a.level : undefined),
    [filterRoster],
  );

  return {
    availableOperators,
    trackedOperators,
    isInitialLoad,
    isLoadError,
    retryLoad,
    pendingSaveCount,
    addOperator,
    removeOperator,
    updateLevel,
    updatePhase,
    updateSkillsMaxed,
    updateWeapon,
    updateWeaponPreferences,
    toggleFavorite,
    getFilteredRoster,
  };
}
