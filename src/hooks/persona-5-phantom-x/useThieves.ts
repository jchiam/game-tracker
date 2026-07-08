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
    skillsLeveled: false,
    roseMaxed: false,
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
    trackedRef: trackedThievesRef,
    addEntity: addThief,
    removeEntity: removeThief,
    applyPatch,
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

  // Skill progress is two coupled booleans with the invariant
  // NOT(roseMaxed && !skillsLeveled). This updater reads current state and lets
  // the field the user just changed drive the coupling: enabling rose implies
  // skills leveled; clearing skills leveled clears rose.
  const updateSkillProgress = (
    id: string,
    patch: Pick<P5xThiefPatch, 'skillsLeveled' | 'roseMaxed'>,
  ) => {
    const cur = trackedThievesRef.current.find((t) => t.id === id);
    let skillsLeveled = patch.skillsLeveled ?? cur?.skillsLeveled ?? false;
    let roseMaxed = patch.roseMaxed ?? cur?.roseMaxed ?? false;
    if (patch.roseMaxed === true) skillsLeveled = true;
    if (patch.skillsLeveled === false) roseMaxed = false;
    applyPatch(id, { skillsLeveled, roseMaxed });
  };

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
    updateSkillProgress,
    toggleFavorite,
    getFilteredRoster,
  };
}
