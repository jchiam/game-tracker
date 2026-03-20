import { useState, useEffect, useRef, useCallback } from 'react';
import { type Session } from '@supabase/supabase-js';
import Fuse from 'fuse.js';
import { ALL_CHARACTERS, type Character } from '@/data/honkai-star-rail/characters';
import { type EquippedRelic, type RelicSet } from '@/data/honkai-star-rail/relics';
import { ALL_RELIC_SETS } from '@/data/honkai-star-rail/relic_sets';
import type { HsrTrackedCharacter } from '@/types';
import {
  loadCharactersFromDB,
  insertCharacter,
  deleteCharacter,
  updateCharacter,
  upsertRelic,
  deleteRelic,
  saveBuildPrefs,
} from '@/services/honkai-star-rail/characterService';

export const emptyRelic: EquippedRelic = { setId: null, mainStat: null, subStats: [] };
const defaultRelics = { head: null, hands: null, body: null, feet: null, sphere: null, rope: null };

export function useCharacters(session: Session | null, isAuthLoading: boolean) {
  const [availableCharacters] = useState<Character[]>(ALL_CHARACTERS);
  const [availableRelicSets] = useState<RelicSet[]>(ALL_RELIC_SETS);
  const [trackedCharacters, setTrackedCharacters] = useState<HsrTrackedCharacter[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Debounce refs for DB writes
  const pendingUpdates = useRef<Record<string, any>>({});
  const updateTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const pendingRelicUpdates = useRef<
    Record<string, { dbId: string; slot: string; relicData: EquippedRelic }>
  >({});
  const relicUpdateTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const queueDBUpdate = (dbId: string, updates: any) => {
    pendingUpdates.current[dbId] = { ...pendingUpdates.current[dbId], ...updates };
    if (updateTimeouts.current[dbId]) clearTimeout(updateTimeouts.current[dbId]);
    updateTimeouts.current[dbId] = setTimeout(async () => {
      const payload = pendingUpdates.current[dbId];
      if (!payload) return;
      delete pendingUpdates.current[dbId];
      delete updateTimeouts.current[dbId];
      await updateCharacter(dbId, payload);
    }, 1000);
  };

  const queueRelicDBUpdate = (dbId: string, slot: string, relicData: EquippedRelic) => {
    const key = `${dbId}-${slot}`;
    pendingRelicUpdates.current[key] = { dbId, slot, relicData };
    if (relicUpdateTimeouts.current[key]) clearTimeout(relicUpdateTimeouts.current[key]);
    relicUpdateTimeouts.current[key] = setTimeout(async () => {
      const payload = pendingRelicUpdates.current[key];
      if (!payload) return;
      delete pendingRelicUpdates.current[key];
      delete relicUpdateTimeouts.current[key];
      await upsertRelic(payload.dbId, payload.slot, payload.relicData);
    }, 1000);
  };

  // Load from DB on session change
  useEffect(() => {
    if (isAuthLoading) return;
    if (!session?.user) {
      setTrackedCharacters([]);
      setIsInitialLoad(false);
      return;
    }
    let isMounted = true;
    (async () => {
      try {
        const roster = await loadCharactersFromDB(session.user.id);
        if (isMounted) setTrackedCharacters(roster);
      } catch (e) {
        console.error(e);
      } finally {
        if (isMounted) setIsInitialLoad(false);
      }
    })();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, isAuthLoading]);

  const addCharacter = async (char: Character) => {
    if (!session) {
      alert('Please log in first!');
      return;
    }
    if (trackedCharacters.some((c) => c.id === char.id)) return;
    const newChar: HsrTrackedCharacter = {
      ...char,
      isFavorited: false,
      level: 1,
      tracesAttained: false,
      relics: defaultRelics,
      buildPreferences: { mainStats: { body: [], feet: [], sphere: [], rope: [] }, subStats: [] },
    };
    setTrackedCharacters((prev) => [...prev, newChar]);
    const dbId = await insertCharacter(session.user.id, char.id);
    if (dbId)
      setTrackedCharacters((prev) => prev.map((c) => (c.id === char.id ? { ...c, dbId } : c)));
  };

  const removeCharacter = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const charToRemove = trackedCharacters.find((c) => c.id === id);
    setTrackedCharacters((prev) => prev.filter((c) => c.id !== id));
    if (charToRemove?.dbId) await deleteCharacter(charToRemove.dbId);
  };

  const updateCharacterLevel = (id: string, level: number) => {
    const validLevel = Math.min(80, Math.max(1, level));
    setTrackedCharacters((prev) =>
      prev.map((c) => (c.id === id ? { ...c, level: validLevel } : c)),
    );
    const char = trackedCharacters.find((c) => c.id === id);
    if (char?.dbId) queueDBUpdate(char.dbId, { level: validLevel });
  };

  const toggleCharacterTraces = (id: string, value: boolean) => {
    setTrackedCharacters((prev) =>
      prev.map((c) => (c.id === id ? { ...c, tracesAttained: value } : c)),
    );
    const char = trackedCharacters.find((c) => c.id === id);
    if (char?.dbId) queueDBUpdate(char.dbId, { traces_attained: value });
  };

  const toggleFavoriteCharacter = (id: string, value: boolean) => {
    setTrackedCharacters((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isFavorited: value } : c)),
    );
    const char = trackedCharacters.find((c) => c.id === id);
    if (char?.dbId) queueDBUpdate(char.dbId, { is_favorited: value });
  };

  const saveRelicData = async (
    editingRelic: { charId: string; slot: keyof HsrTrackedCharacter['relics'] },
    relicData: EquippedRelic,
  ) => {
    const { charId, slot } = editingRelic;
    setTrackedCharacters((prev) =>
      prev.map((c) => (c.id === charId ? { ...c, relics: { ...c.relics, [slot]: relicData } } : c)),
    );
    const char = trackedCharacters.find((c) => c.id === charId);
    if (char?.dbId) queueRelicDBUpdate(char.dbId, slot, relicData);
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
    const char = trackedCharacters.find((c) => c.id === charId);
    if (char?.dbId) await deleteRelic(char.dbId, slot);
  };

  const saveBuildPreferences = async (
    charId: string,
    newPreferences: HsrTrackedCharacter['buildPreferences'],
  ) => {
    setTrackedCharacters((prev) =>
      prev.map((c) => (c.id === charId ? { ...c, buildPreferences: newPreferences } : c)),
    );
    const char = trackedCharacters.find((c) => c.id === charId);
    if (char?.dbId) await saveBuildPrefs(char.dbId, newPreferences);
  };

  const getFilteredRoster = useCallback(
    (
      searchTerm: string,
      sortBy: 'SCORE' | 'ALPHA',
      scoreFor: (c: HsrTrackedCharacter) => number,
    ) => {
      let result = trackedCharacters;
      if (searchTerm.trim()) {
        const fuse = new Fuse(trackedCharacters, {
          keys: ['name', 'element', 'path'],
          threshold: 0.3,
        });
        result = fuse.search(searchTerm).map((r) => r.item);
      }
      return [...result].sort((a, b) => {
        if (a.isFavorited && !b.isFavorited) return -1;
        if (!a.isFavorited && b.isFavorited) return 1;
        if (sortBy === 'SCORE') {
          const diff = scoreFor(b) - scoreFor(a);
          if (diff !== 0) return diff;
        }
        return a.name.localeCompare(b.name);
      });
    },
    [trackedCharacters],
  );

  return {
    availableCharacters,
    availableRelicSets,
    trackedCharacters,
    isInitialLoad,
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
