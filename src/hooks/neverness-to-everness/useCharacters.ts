import { useCallback } from 'react';
import { type Session } from '@supabase/supabase-js';
import { ALL_CHARACTERS, type N2ECharacter } from '@/data/neverness-to-everness/characters';
import type { N2ECharacterPatch, N2ETrackedCharacter } from '@/types';
import {
  loadCharactersFromDB,
  insertCharacter,
  deleteCharacter,
  updateCharacter,
  saveCartridgePreferences as apiSaveCartridgePrefs,
} from '@/services/neverness-to-everness/characterService';
import { useRoster } from '@/hooks/useRoster';

const DEFAULT_AWAKENING = [false, false, false, false, false, false];

function createTrackedCharacter(character: N2ECharacter): N2ETrackedCharacter {
  return {
    ...character,
    isFavorited: false,
    level: 1,
    awakening: [...DEFAULT_AWAKENING],
    resonanceCount: 0,
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
    filterRoster,
  } = useRoster<N2ECharacter, N2ETrackedCharacter>(session, isAuthLoading, {
    allEntities: ALL_CHARACTERS,
    loadFromDB: loadCharactersFromDB,
    insertEntity: insertCharacter,
    deleteEntity: deleteCharacter,
    createTracked: createTrackedCharacter,
    nounSingular: 'character',
    nounPlural: 'characters',
    fuseKeys: ['name', 'esperType', 'arcType', 'roles'],
  });

  const updateCharacterLevel = (id: string, level: number) => {
    const validLevel = Math.min(90, Math.max(1, level));
    setTrackedCharacters((prev) =>
      prev.map((c) => (c.id === id ? { ...c, level: validLevel } : c)),
    );
    const char = trackedCharactersRef.current.find((c) => c.id === id);
    if (char?.dbId)
      queueUpdate(char.dbId, { level: validLevel } satisfies N2ECharacterPatch, (p) =>
        updateCharacter(char.dbId!, p),
      );
  };

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

  const updateResonanceCount = (id: string, count: number) => {
    const validCount = Math.min(6, Math.max(0, count));
    setTrackedCharacters((prev) =>
      prev.map((c) => (c.id === id ? { ...c, resonanceCount: validCount } : c)),
    );
    const char = trackedCharactersRef.current.find((c) => c.id === id);
    if (char?.dbId)
      queueUpdate(char.dbId, { resonanceCount: validCount } satisfies N2ECharacterPatch, (p) =>
        updateCharacter(char.dbId!, p),
      );
  };

  const updateArc = (id: string, arcId: string | null, arcLevel: number, arcTier: number) => {
    setTrackedCharacters((prev) =>
      prev.map((c) => (c.id === id ? { ...c, arcId, arcLevel, arcTier } : c)),
    );
    const char = trackedCharactersRef.current.find((c) => c.id === id);
    if (char?.dbId)
      queueUpdate(char.dbId, { arcId, arcLevel, arcTier } satisfies N2ECharacterPatch, (p) =>
        updateCharacter(char.dbId!, p),
      );
  };

  const updateCartridge = (
    id: string,
    cartridgeId: string | null,
    rarity: string | null,
    level: number,
    mainStat: string | null,
    subStats: string[],
  ) => {
    setTrackedCharacters((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              cartridgeId,
              cartridgeRarity: rarity,
              cartridgeLevel: level,
              cartridgeMainStat: mainStat,
              cartridgeSubStats: subStats,
            }
          : c,
      ),
    );
    const char = trackedCharactersRef.current.find((c) => c.id === id);
    if (char?.dbId)
      queueUpdate(
        char.dbId,
        {
          cartridgeId,
          cartridgeRarity: rarity,
          cartridgeLevel: level,
          cartridgeMainStat: mainStat,
          cartridgeSubStats: subStats,
        } satisfies N2ECharacterPatch,
        (p) => updateCharacter(char.dbId!, p),
      );
  };

  const toggleFavoriteCharacter = (id: string, value: boolean) => {
    setTrackedCharacters((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isFavorited: value } : c)),
    );
    const char = trackedCharactersRef.current.find((c) => c.id === id);
    if (char?.dbId)
      queueUpdate(char.dbId, { isFavorited: value } satisfies N2ECharacterPatch, (p) =>
        updateCharacter(char.dbId!, p),
      );
  };

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
    (searchTerm: string, sortBy: 'ALPHA' | 'LEVEL') =>
      filterRoster(searchTerm, sortBy === 'LEVEL' ? (a, b) => b.level - a.level : undefined),
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
    toggleAwakeningSlot,
    updateResonanceCount,
    updateArc,
    updateCartridge,
    saveCartridgePreferences,
    toggleFavoriteCharacter,
    getFilteredRoster,
  };
}
