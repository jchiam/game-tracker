import { type Session } from '@supabase/supabase-js';
import { ALL_CHARACTERS, type N2ECharacter } from '@/data/neverness-to-everness/characters';
import type { N2ETrackedCharacter } from '@/types';
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
    cartridgeRarity: null,
    cartridgeLevel: 0,
    cartridgeMainStat: null,
    cartridgeSubStats: [],
    cartridgePreferences: { mainStats: [], subStats: [], comments: '' },
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
      queueUpdate(char.dbId, { level: validLevel }, (p) => updateCharacter(char.dbId!, p));
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
      queueUpdate(char.dbId, { awakening_slots: newAwakening }, (p) =>
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
      queueUpdate(char.dbId, { resonance_count: validCount }, (p) =>
        updateCharacter(char.dbId!, p),
      );
  };

  const updateArc = (id: string, arcId: string | null, arcLevel: number, arcTier: number) => {
    setTrackedCharacters((prev) =>
      prev.map((c) => (c.id === id ? { ...c, arcId, arcLevel, arcTier } : c)),
    );
    const char = trackedCharactersRef.current.find((c) => c.id === id);
    if (char?.dbId)
      queueUpdate(char.dbId, { arc_id: arcId, arc_level: arcLevel, arc_tier: arcTier }, (p) =>
        updateCharacter(char.dbId!, p),
      );
  };

  const updateCartridge = (
    id: string,
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
          cartridge_rarity: rarity,
          cartridge_level: level,
          cartridge_main_stat: mainStat,
          cartridge_sub_stats: subStats,
        },
        (p) => updateCharacter(char.dbId!, p),
      );
  };

  const toggleFavoriteCharacter = (id: string, value: boolean) => {
    setTrackedCharacters((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isFavorited: value } : c)),
    );
    const char = trackedCharactersRef.current.find((c) => c.id === id);
    if (char?.dbId)
      queueUpdate(char.dbId, { is_favorited: value }, (p) => updateCharacter(char.dbId!, p));
  };

  const saveCartridgePreferences = async (
    id: string,
    newPrefs: N2ETrackedCharacter['cartridgePreferences'],
  ) => {
    setTrackedCharacters((prev) =>
      prev.map((c) => (c.id === id ? { ...c, cartridgePreferences: newPrefs } : c)),
    );
    const char = trackedCharactersRef.current.find((c) => c.id === id);
    if (char?.dbId) await apiSaveCartridgePrefs(char.dbId, newPrefs);
  };

  const getFilteredRoster = (searchTerm: string, sortBy: 'ALPHA' | 'LEVEL') =>
    filterRoster(searchTerm, sortBy === 'LEVEL' ? (a, b) => b.level - a.level : undefined);

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
