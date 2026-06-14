import { type Session } from '@supabase/supabase-js';
import { ALL_CHARACTERS, type Character } from '@/data/honkai-star-rail/characters';
import { type EquippedRelic, type RelicSet } from '@/data/honkai-star-rail/relics';
import { ALL_RELIC_SETS } from '@/data/honkai-star-rail/relic_sets';
import type { HsrTrackedCharacter } from '@/types';
import { useState } from 'react';
import {
  loadCharactersFromDB,
  insertCharacter,
  deleteCharacter,
  updateCharacter,
  upsertRelic,
  deleteRelic,
  saveBuildPrefs,
} from '@/services/honkai-star-rail/characterService';
import { useRoster } from '@/hooks/useRoster';

export const emptyRelic: EquippedRelic = { setId: null, mainStat: null, subStats: [] };
const defaultRelics = { head: null, hands: null, body: null, feet: null, sphere: null, rope: null };

function createTrackedCharacter(char: Character): HsrTrackedCharacter {
  return {
    ...char,
    isFavorited: false,
    level: 1,
    tracesAttained: false,
    relics: defaultRelics,
    buildPreferences: { mainStats: { body: [], feet: [], sphere: [], rope: [] }, subStats: [] },
  };
}

export function useCharacters(session: Session | null, isAuthLoading: boolean) {
  const [availableRelicSets] = useState<RelicSet[]>(ALL_RELIC_SETS);
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
  } = useRoster<Character, HsrTrackedCharacter>(session, isAuthLoading, {
    allEntities: ALL_CHARACTERS,
    loadFromDB: loadCharactersFromDB,
    insertEntity: insertCharacter,
    deleteEntity: deleteCharacter,
    createTracked: createTrackedCharacter,
    nounSingular: 'character',
    nounPlural: 'characters',
    fuseKeys: ['name', 'element', 'path'],
  });

  const updateCharacterLevel = (id: string, level: number) => {
    const validLevel = Math.min(80, Math.max(1, level));
    setTrackedCharacters((prev) =>
      prev.map((c) => (c.id === id ? { ...c, level: validLevel } : c)),
    );
    const char = trackedCharactersRef.current.find((c) => c.id === id);
    if (char?.dbId)
      queueUpdate(char.dbId, { level: validLevel }, (p) => updateCharacter(char.dbId!, p));
  };

  const toggleCharacterTraces = (id: string, value: boolean) => {
    setTrackedCharacters((prev) =>
      prev.map((c) => (c.id === id ? { ...c, tracesAttained: value } : c)),
    );
    const char = trackedCharactersRef.current.find((c) => c.id === id);
    if (char?.dbId)
      queueUpdate(char.dbId, { traces_attained: value }, (p) => updateCharacter(char.dbId!, p));
  };

  const toggleFavoriteCharacter = (id: string, value: boolean) => {
    setTrackedCharacters((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isFavorited: value } : c)),
    );
    const char = trackedCharactersRef.current.find((c) => c.id === id);
    if (char?.dbId)
      queueUpdate(char.dbId, { is_favorited: value }, (p) => updateCharacter(char.dbId!, p));
  };

  const saveRelicData = async (
    editingRelic: { charId: string; slot: keyof HsrTrackedCharacter['relics'] },
    relicData: EquippedRelic,
  ) => {
    const { charId, slot } = editingRelic;
    setTrackedCharacters((prev) =>
      prev.map((c) => (c.id === charId ? { ...c, relics: { ...c.relics, [slot]: relicData } } : c)),
    );
    const char = trackedCharactersRef.current.find((c) => c.id === charId);
    if (char?.dbId)
      queueAction(`${char.dbId}-${slot}`, () => upsertRelic(char.dbId!, slot, relicData));
  };

  const removeRelicData = async (editingRelic: {
    charId: string;
    slot: keyof HsrTrackedCharacter['relics'];
  }) => {
    const { charId, slot } = editingRelic;
    setTrackedCharacters((prev) =>
      prev.map((c) =>
        c.id === charId ? { ...c, relics: { ...c.relics, [slot]: emptyRelic } } : c,
      ),
    );
    const char = trackedCharactersRef.current.find((c) => c.id === charId);
    if (char?.dbId) queueAction(`${char.dbId}-${slot}-delete`, () => deleteRelic(char.dbId!, slot));
  };

  const saveBuildPreferences = (
    charId: string,
    newPreferences: HsrTrackedCharacter['buildPreferences'],
  ) => {
    setTrackedCharacters((prev) =>
      prev.map((c) => (c.id === charId ? { ...c, buildPreferences: newPreferences } : c)),
    );
    const char = trackedCharactersRef.current.find((c) => c.id === charId);
    if (char?.dbId) {
      const dbId = char.dbId;
      queueAction(`${dbId}-buildprefs`, () => saveBuildPrefs(dbId, newPreferences));
    }
  };

  const getFilteredRoster = (
    searchTerm: string,
    sortBy: 'SCORE' | 'ALPHA',
    scoreFor: (c: HsrTrackedCharacter) => number,
  ) =>
    filterRoster(searchTerm, sortBy === 'SCORE' ? (a, b) => scoreFor(b) - scoreFor(a) : undefined);

  return {
    availableCharacters,
    availableRelicSets,
    trackedCharacters,
    isInitialLoad,
    isLoadError,
    retryLoad,
    pendingSaveCount,
    addCharacter,
    removeCharacter,
    updateCharacterLevel,
    toggleCharacterTraces,
    toggleFavoriteCharacter,
    saveRelicData,
    removeRelicData,
    saveBuildPreferences,
    getFilteredRoster,
  };
}
