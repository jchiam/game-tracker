import { useCallback } from 'react';
import { type Session } from '@supabase/supabase-js';
import { ALL_ARCANISTS, type Arcanist } from '@/data/reverse1999/arcanists';
import type { R1999ArcanistPatch, R1999TrackedArcanist } from '@/types';
import {
  loadArcanistsFromDB,
  insertArcanist,
  deleteArcanist,
  updateArcanist,
} from '@/services/reverse1999/arcanistService';
import { useRoster } from '@/hooks/useRoster';

function createTrackedArcanist(arcanist: Arcanist): R1999TrackedArcanist {
  return {
    ...arcanist,
    isFavorited: false,
    level: 1,
    portraitLevel: 0,
    resonanceLevel: 0,
    euphoriaStage: 0,
    psychubeName: null,
    psychubeLevel: 1,
    psychubeAmplification: 1,
  };
}

export function useArcanists(session: Session | null, isAuthLoading: boolean) {
  const {
    availableEntities: availableArcanists,
    trackedEntities: trackedArcanists,
    isInitialLoad,
    isLoadError,
    retryLoad,
    pendingSaveCount,
    addEntity: addArcanist,
    removeEntity: removeArcanist,
    applyPatch,
    makeFieldUpdater,
    filterRoster,
  } = useRoster<Arcanist, R1999TrackedArcanist, R1999ArcanistPatch>(session, isAuthLoading, {
    allEntities: ALL_ARCANISTS,
    loadFromDB: loadArcanistsFromDB,
    insertEntity: insertArcanist,
    deleteEntity: deleteArcanist,
    updateEntity: updateArcanist,
    createTracked: createTrackedArcanist,
    nounSingular: 'arcanist',
    nounPlural: 'arcanists',
    fuseKeys: ['name', 'afflatus', 'damageType'],
  });

  const updateArcanistLevel = makeFieldUpdater('level', { clamp: [1, 60] });
  const updatePortraitLevel = makeFieldUpdater('portraitLevel');
  const updateResonanceLevel = makeFieldUpdater('resonanceLevel', { clamp: [0, 15] });
  const updateEuphoriaStage = makeFieldUpdater('euphoriaStage', { clamp: [0, 4] });
  const updatePsychubeAmplification = makeFieldUpdater('psychubeAmplification', { clamp: [1, 5] });
  const toggleFavoriteArcanist = makeFieldUpdater('isFavorited');

  const updatePsychube = (id: string, psychubeName: string | null, psychubeLevel: number) =>
    applyPatch(id, { psychubeName, psychubeLevel });

  const getFilteredRoster = useCallback(
    (searchTerm: string, sortBy: 'ALPHA' | 'LEVEL') =>
      filterRoster(searchTerm, sortBy === 'LEVEL' ? (a, b) => b.level - a.level : undefined),
    [filterRoster],
  );

  return {
    availableArcanists,
    trackedArcanists,
    isInitialLoad,
    isLoadError,
    retryLoad,
    pendingSaveCount,
    addArcanist,
    removeArcanist,
    updateArcanistLevel,
    updatePortraitLevel,
    updateResonanceLevel,
    updateEuphoriaStage,
    updatePsychube,
    updatePsychubeAmplification,
    toggleFavoriteArcanist,
    getFilteredRoster,
  };
}
