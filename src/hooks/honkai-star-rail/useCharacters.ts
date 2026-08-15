import { type Session } from '@supabase/supabase-js';
import { ALL_CHARACTERS, type Character } from '@/data/honkai-star-rail/characters';
import { type EquippedRelic, type RelicSet } from '@/data/honkai-star-rail/relics';
import { ALL_RELIC_SETS } from '@/data/honkai-star-rail/relic_sets';
import type { HsrCharacterPatch, HsrTrackedCharacter } from '@/types';
import { useCallback, useState } from 'react';
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
    useAltPortrait: false,
    lightConeId: null,
    lightConeLevel: 1,
    lightConeSuperimposition: 1,
    lightConePreferences: [],
    // Spread — assigning the module-level default directly would share one object
    // identity across every freshly-added character (same aliasing class as the
    // P5X substat-preference bug); the service load path already spreads.
    relics: { ...defaultRelics },
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
    queueAction,
    addEntity: addCharacter,
    removeEntity: removeCharacter,
    makeFieldUpdater,
    filterRoster,
  } = useRoster<Character, HsrTrackedCharacter, HsrCharacterPatch>(session, isAuthLoading, {
    allEntities: ALL_CHARACTERS,
    loadFromDB: loadCharactersFromDB,
    insertEntity: insertCharacter,
    deleteEntity: deleteCharacter,
    updateEntity: updateCharacter,
    createTracked: createTrackedCharacter,
    nounSingular: 'character',
    nounPlural: 'characters',
    fuseKeys: ['name', 'element', 'path'],
  });

  const updateCharacterLevel = makeFieldUpdater('level', { clamp: [1, 80] });
  const toggleCharacterTraces = makeFieldUpdater('tracesAttained');
  const toggleFavoriteCharacter = makeFieldUpdater('isFavorited');
  const updateUseAltPortrait = makeFieldUpdater('useAltPortrait');
  const updateLightCone = makeFieldUpdater('lightConeId');
  const updateLightConeLevel = makeFieldUpdater('lightConeLevel', { clamp: [1, 80] });
  const updateLightConeSuperimposition = makeFieldUpdater('lightConeSuperimposition', {
    clamp: [1, 5],
  });
  const updateLightConePreferences = makeFieldUpdater('lightConePreferences');

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

  const getFilteredRoster = useCallback(
    (searchTerm: string, sortBy: 'SCORE' | 'ALPHA', scoreFor: (c: HsrTrackedCharacter) => number) =>
      filterRoster(
        searchTerm,
        sortBy === 'SCORE' ? (a, b) => scoreFor(b) - scoreFor(a) : undefined,
      ),
    [filterRoster],
  );

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
    updateUseAltPortrait,
    updateLightCone,
    updateLightConeLevel,
    updateLightConeSuperimposition,
    updateLightConePreferences,
    saveRelicData,
    removeRelicData,
    saveBuildPreferences,
    getFilteredRoster,
  };
}
