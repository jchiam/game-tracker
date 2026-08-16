import { useCallback } from 'react';
import { type Session } from '@supabase/supabase-js';
import { type N2ECharacter } from '@/data/neverness-to-everness/characters';
import { ALL_CHARACTERS } from '@/data/neverness-to-everness/characterOverrides';
import type { N2ECharacterPatch, N2ECartridgePatch, N2ETrackedCharacter } from '@/types';
import {
  loadCharactersFromDB,
  insertCharacter,
  deleteCharacter,
  updateCharacter,
  saveCartridgePreferences as apiSaveCartridgePrefs,
} from '@/services/neverness-to-everness/characterService';
import { useRoster } from '@/hooks/useRoster';
import { calculateCartridgeScore } from '@/utils/cartridgeScoring';

const DEFAULT_AWAKENING = [false, false, false, false, false, false];

function createTrackedCharacter(character: N2ECharacter): N2ETrackedCharacter {
  return {
    ...character,
    isFavorited: false,
    level: 1,
    modulesConfigured: false,
    awakening: [...DEFAULT_AWAKENING],
    arcId: null,
    arcLevel: 1,
    arcTier: 1,
    cartridgeId: null,
    cartridgeRarity: null,
    cartridgeLevel: 0,
    cartridgeMainStat: null,
    cartridgeSubStats: [],
    cartridgePreferences: { cartridgeId: null, mainStats: [], subStats: [], comments: '' },
  };
}

export function useCharacters(session: Session | null, isAuthLoading: boolean) {
  const {
    availableEntities: availableCharacters,
    trackedEntities: trackedCharacters,
    setTrackedEntities: setTrackedCharacters,
    trackedRef: trackedCharactersRef,
    isInitialLoad,
    isLoadError,
    retryLoad,
    pendingSaveCount,
    queueUpdate,
    queueAction,
    addEntity: addCharacter,
    removeEntity: removeCharacter,
    applyPatch,
    makeFieldUpdater,
    filterRoster,
  } = useRoster<N2ECharacter, N2ETrackedCharacter, N2ECharacterPatch>(session, isAuthLoading, {
    allEntities: ALL_CHARACTERS,
    loadFromDB: loadCharactersFromDB,
    insertEntity: insertCharacter,
    deleteEntity: deleteCharacter,
    updateEntity: updateCharacter,
    createTracked: createTrackedCharacter,
    nounSingular: 'character',
    nounPlural: 'characters',
    fuseKeys: ['name', 'esperType', 'arcType', 'roles'],
  });

  const updateCharacterLevel = makeFieldUpdater('level', { clamp: [1, 90] });
  const toggleFavoriteCharacter = makeFieldUpdater('isFavorited');
  const toggleModulesConfigured = makeFieldUpdater('modulesConfigured');

  const toggleAwakeningSlot = (id: string, slotIndex: number) => {
    setTrackedCharacters((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const newAwakening = [...c.awakening];
        newAwakening[slotIndex] = !newAwakening[slotIndex];
        return { ...c, awakening: newAwakening };
      }),
    );
    const char = trackedCharactersRef.current.find((c) => c.id === id);
    if (char?.dbId) {
      const newAwakening = [...char.awakening];
      newAwakening[slotIndex] = !newAwakening[slotIndex];
      queueUpdate(char.dbId, { awakening: newAwakening } satisfies N2ECharacterPatch, (p) =>
        updateCharacter(char.dbId!, p),
      );
    }
  };

  const updateArc = (id: string, arcId: string | null, arcLevel: number, arcTier: number) =>
    applyPatch(id, { arcId, arcLevel, arcTier });

  const updateCartridge = (id: string, patch: N2ECartridgePatch) => applyPatch(id, patch);

  const saveCartridgePreferences = (
    id: string,
    newPrefs: N2ETrackedCharacter['cartridgePreferences'],
  ) => {
    setTrackedCharacters((prev) =>
      prev.map((c) => (c.id === id ? { ...c, cartridgePreferences: newPrefs } : c)),
    );
    const char = trackedCharactersRef.current.find((c) => c.id === id);
    if (char?.dbId) {
      const dbId = char.dbId;
      queueAction(`${dbId}-cartprefs`, () => apiSaveCartridgePrefs(dbId, newPrefs));
    }
  };

  const getFilteredRoster = useCallback(
    (searchTerm: string, sortBy: 'ALPHA' | 'LEVEL' | 'SCORE', entities?: N2ETrackedCharacter[]) => {
      let compare: ((a: N2ETrackedCharacter, b: N2ETrackedCharacter) => number) | undefined;
      if (sortBy === 'LEVEL') compare = (a, b) => b.level - a.level;
      // Descending score; insufficient-data (-1) sorts last among non-favorites.
      else if (sortBy === 'SCORE')
        compare = (a, b) => calculateCartridgeScore(b) - calculateCartridgeScore(a);
      return filterRoster(searchTerm, compare, entities);
    },
    [filterRoster],
  );

  return {
    availableCharacters,
    trackedCharacters,
    isInitialLoad,
    isLoadError,
    retryLoad,
    pendingSaveCount,
    addCharacter,
    removeCharacter,
    updateCharacterLevel,
    toggleModulesConfigured,
    toggleAwakeningSlot,
    updateArc,
    updateCartridge,
    saveCartridgePreferences,
    toggleFavoriteCharacter,
    getFilteredRoster,
  };
}
