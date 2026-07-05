import { useCallback } from 'react';
import { type Session } from '@supabase/supabase-js';
import { ALL_THIEVES, type P5xThief } from '@/data/persona-5-phantom-x/thieves';
import type { P5xThiefPatch, P5xTrackedThief } from '@/types';
import {
  loadThievesFromDB,
  insertThief,
  deleteThief,
  updateThief,
} from '@/services/persona-5-phantom-x/thiefService';
import { useRoster } from '@/hooks/useRoster';

function createTrackedThief(thief: P5xThief): P5xTrackedThief {
  return {
    ...thief,
    isFavorited: false,
    level: 1,
    awareness: 0,
  };
}

export function useThieves(session: Session | null, isAuthLoading: boolean) {
  const {
    availableEntities: availableThieves,
    trackedEntities: trackedThieves,
    isInitialLoad,
    isLoadError,
    retryLoad,
    pendingSaveCount,
    addEntity: addThief,
    removeEntity: removeThief,
    makeFieldUpdater,
    filterRoster,
  } = useRoster<P5xThief, P5xTrackedThief, P5xThiefPatch>(session, isAuthLoading, {
    allEntities: ALL_THIEVES,
    loadFromDB: loadThievesFromDB,
    insertEntity: insertThief,
    deleteEntity: deleteThief,
    updateEntity: updateThief,
    createTracked: createTrackedThief,
    nounSingular: 'thief',
    nounPlural: 'thieves',
    fuseKeys: ['name', 'codename', 'personaName', 'role', 'element'],
  });

  const updateLevel = makeFieldUpdater('level', { clamp: [1, 80] });
  const updateAwareness = makeFieldUpdater('awareness', { clamp: [0, 6] });
  const toggleFavorite = makeFieldUpdater('isFavorited');

  const getFilteredRoster = useCallback(
    (searchTerm: string, sortBy: 'ALPHA' | 'LEVEL') =>
      filterRoster(searchTerm, sortBy === 'LEVEL' ? (a, b) => b.level - a.level : undefined),
    [filterRoster],
  );

  return {
    availableThieves,
    trackedThieves,
    isInitialLoad,
    isLoadError,
    retryLoad,
    pendingSaveCount,
    addThief,
    removeThief,
    updateLevel,
    updateAwareness,
    toggleFavorite,
    getFilteredRoster,
  };
}
