import { useState, useEffect, useCallback, useRef } from 'react';
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
import { usePendingSaves } from '@/hooks/usePendingSaves';
import { addToast } from '@/utils/toast';

export const emptyRelic: EquippedRelic = { setId: null, mainStat: null, subStats: [] };
const defaultRelics = { head: null, hands: null, body: null, feet: null, sphere: null, rope: null };

export function useCharacters(session: Session | null, isAuthLoading: boolean) {
  const [availableCharacters] = useState<Character[]>(ALL_CHARACTERS);
  const [availableRelicSets] = useState<RelicSet[]>(ALL_RELIC_SETS);
  const [trackedCharacters, setTrackedCharacters] = useState<HsrTrackedCharacter[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isLoadError, setIsLoadError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Track in-flight inserts to prevent race condition on rapid adds
  const pendingInserts = useRef<Set<string>>(new Set());
  // Ref always holds the latest trackedCharacters to avoid stale closures in update functions
  const trackedCharactersRef = useRef<HsrTrackedCharacter[]>([]);
  trackedCharactersRef.current = trackedCharacters;

  const { pendingSaveCount, queueUpdate, queueAction } = usePendingSaves(1000, () =>
    addToast('Failed to save changes. Please try again.', 'error'),
  );

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
        if (isMounted) {
          setTrackedCharacters(roster);
          setIsLoadError(false);
        }
      } catch (e) {
        console.error(e);
        if (isMounted) setIsLoadError(true);
      } finally {
        if (isMounted) setIsInitialLoad(false);
      }
    })();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, isAuthLoading, retryCount]);

  const addCharacter = async (char: Character) => {
    if (!session) {
      addToast('Please log in to add characters.', 'warning');
      return;
    }
    // Check both local state AND in-flight inserts to prevent duplicates
    if (trackedCharactersRef.current.some((c) => c.id === char.id)) return;
    if (pendingInserts.current.has(char.id)) return;

    pendingInserts.current.add(char.id);
    const newChar: HsrTrackedCharacter = {
      ...char,
      isFavorited: false,
      level: 1,
      tracesAttained: false,
      relics: defaultRelics,
      buildPreferences: { mainStats: { body: [], feet: [], sphere: [], rope: [] }, subStats: [] },
    };
    setTrackedCharacters((prev) => [...prev, newChar]);
    try {
      const dbId = await insertCharacter(session.user.id, char.id);
      if (dbId)
        setTrackedCharacters((prev) => prev.map((c) => (c.id === char.id ? { ...c, dbId } : c)));
    } catch (e) {
      console.error(e);
      setTrackedCharacters((prev) => prev.filter((c) => c.id !== char.id));
      addToast('Failed to add character. Please try again.', 'error');
    } finally {
      pendingInserts.current.delete(char.id);
    }
  };

  const removeCharacter = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const charToRemove = trackedCharactersRef.current.find((c) => c.id === id);
    const snapshot = trackedCharactersRef.current;
    setTrackedCharacters((prev) => prev.filter((c) => c.id !== id));
    if (charToRemove?.dbId) {
      try {
        await deleteCharacter(charToRemove.dbId);
      } catch (err) {
        console.error(err);
        setTrackedCharacters(snapshot);
        addToast('Failed to remove character. Please try again.', 'error');
      }
    }
  };

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

  const saveBuildPreferences = async (
    charId: string,
    newPreferences: HsrTrackedCharacter['buildPreferences'],
  ) => {
    setTrackedCharacters((prev) =>
      prev.map((c) => (c.id === charId ? { ...c, buildPreferences: newPreferences } : c)),
    );
    const char = trackedCharactersRef.current.find((c) => c.id === charId);
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

  const retryLoad = () => {
    setIsLoadError(false);
    setIsInitialLoad(true);
    setRetryCount((n) => n + 1);
  };

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
