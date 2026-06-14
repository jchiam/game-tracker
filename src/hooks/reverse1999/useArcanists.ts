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
    setTrackedEntities: setTrackedArcanists,
    trackedRef,
    isInitialLoad,
    isLoadError,
    retryLoad,
    pendingSaveCount,
    queueUpdate,
    addEntity: addArcanist,
    removeEntity: removeArcanist,
    filterRoster,
  } = useRoster<Arcanist, R1999TrackedArcanist>(session, isAuthLoading, {
    allEntities: ALL_ARCANISTS,
    loadFromDB: loadArcanistsFromDB,
    insertEntity: insertArcanist,
    deleteEntity: deleteArcanist,
    createTracked: createTrackedArcanist,
    nounSingular: 'arcanist',
    nounPlural: 'arcanists',
    fuseKeys: ['name', 'afflatus', 'damageType'],
  });

  const updateArcanistLevel = (id: string, level: number) => {
    const validLevel = Math.min(60, Math.max(1, level));
    setTrackedArcanists((prev) => prev.map((a) => (a.id === id ? { ...a, level: validLevel } : a)));
    const arcanist = trackedRef.current.find((a) => a.id === id);
    if (arcanist?.dbId)
      queueUpdate(arcanist.dbId, { level: validLevel } satisfies R1999ArcanistPatch, (p) =>
        updateArcanist(arcanist.dbId!, p),
      );
  };

  const updatePortraitLevel = (id: string, portraitLevel: number) => {
    setTrackedArcanists((prev) => prev.map((a) => (a.id === id ? { ...a, portraitLevel } : a)));
    const arcanist = trackedRef.current.find((a) => a.id === id);
    if (arcanist?.dbId)
      queueUpdate(arcanist.dbId, { portraitLevel } satisfies R1999ArcanistPatch, (p) =>
        updateArcanist(arcanist.dbId!, p),
      );
  };

  const updateResonanceLevel = (id: string, resonanceLevel: number) => {
    const validLevel = Math.min(15, Math.max(0, resonanceLevel));
    setTrackedArcanists((prev) =>
      prev.map((a) => (a.id === id ? { ...a, resonanceLevel: validLevel } : a)),
    );
    const arcanist = trackedRef.current.find((a) => a.id === id);
    if (arcanist?.dbId)
      queueUpdate(arcanist.dbId, { resonanceLevel: validLevel } satisfies R1999ArcanistPatch, (p) =>
        updateArcanist(arcanist.dbId!, p),
      );
  };

  const updatePsychube = (id: string, psychubeName: string | null, psychubeLevel: number) => {
    setTrackedArcanists((prev) =>
      prev.map((a) => (a.id === id ? { ...a, psychubeName, psychubeLevel } : a)),
    );
    const arcanist = trackedRef.current.find((a) => a.id === id);
    if (arcanist?.dbId)
      queueUpdate(
        arcanist.dbId,
        { psychubeName, psychubeLevel } satisfies R1999ArcanistPatch,
        (p) => updateArcanist(arcanist.dbId!, p),
      );
  };

  const updateEuphoriaStage = (id: string, stage: number) => {
    const validStage = Math.min(4, Math.max(0, stage));
    setTrackedArcanists((prev) =>
      prev.map((a) => (a.id === id ? { ...a, euphoriaStage: validStage } : a)),
    );
    const arcanist = trackedRef.current.find((a) => a.id === id);
    if (arcanist?.dbId)
      queueUpdate(arcanist.dbId, { euphoriaStage: validStage } satisfies R1999ArcanistPatch, (p) =>
        updateArcanist(arcanist.dbId!, p),
      );
  };

  const updatePsychubeAmplification = (id: string, level: number) => {
    const validLevel = Math.min(5, Math.max(1, level));
    setTrackedArcanists((prev) =>
      prev.map((a) => (a.id === id ? { ...a, psychubeAmplification: validLevel } : a)),
    );
    const arcanist = trackedRef.current.find((a) => a.id === id);
    if (arcanist?.dbId)
      queueUpdate(
        arcanist.dbId,
        { psychubeAmplification: validLevel } satisfies R1999ArcanistPatch,
        (p) => updateArcanist(arcanist.dbId!, p),
      );
  };

  const toggleFavoriteArcanist = (id: string, value: boolean) => {
    setTrackedArcanists((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isFavorited: value } : a)),
    );
    const arcanist = trackedRef.current.find((a) => a.id === id);
    if (arcanist?.dbId)
      queueUpdate(arcanist.dbId, { isFavorited: value } satisfies R1999ArcanistPatch, (p) =>
        updateArcanist(arcanist.dbId!, p),
      );
  };

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
