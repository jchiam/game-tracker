import { useCallback } from 'react';
import { type Session } from '@supabase/supabase-js';
import { ALL_THIEVES, type P5xThief } from '@/data/persona-5-phantom-x/thieves';
import type { EquippedRevelation, RevelationSlot } from '@/data/persona-5-phantom-x/revelations';
import type { P5xThiefPatch, P5xTrackedThief, P5xRevelationPreferences } from '@/types';
import { calculateRevelationScore } from '@/utils/revelationScoring';
import {
  loadThievesFromDB,
  insertThief,
  deleteThief,
  updateThief,
  upsertRevelationCard,
  deleteRevelationCard,
  saveRevelationPreferences,
} from '@/services/persona-5-phantom-x/thiefService';
import { useRoster } from '@/hooks/useRoster';

function createTrackedThief(thief: P5xThief): P5xTrackedThief {
  return {
    ...thief,
    isFavorited: false,
    level: 1,
    awareness: 0,
    skillProgress: 0,
    mindscapeProgress: 0,
    weaponRarity: 2,
    weaponLevel: 1,
    weaponForge: 0,
    revelations: { sun: null, moon: null, star: null, sky: null, space: null },
    revelationPreferences: {
      heavensSetId: null,
      spaceSetId: null,
      mainStats: { moon: [], star: [], sky: [] },
      subStats: [],
      comments: '',
    },
  };
}

export function useThieves(session: Session | null, isAuthLoading: boolean) {
  const {
    availableEntities: availableThieves,
    trackedEntities: trackedThieves,
    setTrackedEntities: setTrackedThieves,
    isInitialLoad,
    isLoadError,
    retryLoad,
    pendingSaveCount,
    trackedRef: trackedThievesRef,
    queueAction,
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
  const updateMindscapeProgress = makeFieldUpdater('mindscapeProgress', { clamp: [0, 2] });
  const updateWeaponRarity = makeFieldUpdater('weaponRarity');
  const updateWeaponLevel = makeFieldUpdater('weaponLevel', { clamp: [1, 80] });
  const updateWeaponForge = makeFieldUpdater('weaponForge', { clamp: [0, 6] });
  const updateSkillProgress = makeFieldUpdater('skillProgress', { clamp: [0, 2] });

  const updateRevelationSlot = (
    id: string,
    slot: RevelationSlot,
    data: EquippedRevelation | null,
  ) => {
    setTrackedThieves((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, revelations: { ...t.revelations, [slot]: data } } : t,
      ),
    );
    const thief = trackedThievesRef.current.find((t) => t.id === id);
    if (thief?.dbId) {
      if (data) {
        queueAction(`${thief.dbId}-rev-${slot}`, () =>
          upsertRevelationCard(thief.dbId!, slot, data),
        );
      } else {
        queueAction(`${thief.dbId}-rev-${slot}-del`, () => deleteRevelationCard(thief.dbId!, slot));
      }
    }
  };

  const updateRevelationPreferences = (id: string, prefs: P5xRevelationPreferences) => {
    setTrackedThieves((prev) =>
      prev.map((t) => (t.id === id ? { ...t, revelationPreferences: prefs } : t)),
    );
    const thief = trackedThievesRef.current.find((t) => t.id === id);
    if (thief?.dbId) {
      queueAction(`${thief.dbId}-rev-prefs`, () => saveRevelationPreferences(thief.dbId!, prefs));
    }
  };

  const getFilteredRoster = useCallback(
    (
      searchTerm: string,
      sortBy: 'ALPHA' | 'LEVEL' | 'SCORE',
      predicate?: (t: P5xTrackedThief) => boolean,
      entities?: P5xTrackedThief[],
    ) => {
      let compare: ((a: P5xTrackedThief, b: P5xTrackedThief) => number) | undefined;
      if (sortBy === 'LEVEL') compare = (a, b) => b.level - a.level;
      // Descending score; insufficient-data (-1) sorts last among non-favorites.
      else if (sortBy === 'SCORE')
        compare = (a, b) => calculateRevelationScore(b) - calculateRevelationScore(a);
      const sorted = filterRoster(searchTerm, compare, entities);
      return predicate ? sorted.filter(predicate) : sorted;
    },
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
    updateMindscapeProgress,
    updateWeaponRarity,
    updateWeaponLevel,
    updateWeaponForge,
    updateRevelationSlot,
    updateRevelationPreferences,
    getFilteredRoster,
  };
}
